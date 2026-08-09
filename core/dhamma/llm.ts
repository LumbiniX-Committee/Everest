/**
 * Provider configuration for the Dhamma engine.
 *
 * One module, because two files were reading the same three settings under
 * three different names each with their own defaults — a drift that guaranteed
 * the reflection path and the ask path would eventually disagree about which
 * model answered.
 *
 * ── Why the names changed ───────────────────────────────────────────────────
 *
 * These were `process.env.OLLAMA_API_KEY`, `OLLAMA_API_ENDPOINT` and
 * `OLLAMA_MODEL`. Expo inlines **only** variables prefixed `EXPO_PUBLIC_` into
 * the JavaScript bundle; anything else is `undefined` at runtime on a device.
 *
 * So `OLLAMA_API_KEY` was always undefined in the app, both call sites took
 * their "no credential" branch, and the provider was never called at all. Both
 * degrade safely — deterministic retrieval still answers, still cited — so
 * nothing crashed and nothing looked wrong. It simply never did the thing it
 * was written to do.
 *
 * The names now match the ones `services/questReview` already uses, so the
 * whole app takes one key from one variable rather than two keys from two.
 *
 * ── What that costs, plainly ────────────────────────────────────────────────
 *
 * `EXPO_PUBLIC_` means the value ships inside the APK and can be read by anyone
 * who unzips it. For the Supabase publishable key that is fine — it is designed
 * for it, and RLS is what protects the data. **For an LLM credential it is not
 * fine**: it is a billable secret with no equivalent of RLS behind it.
 *
 * The comment at the old call site said "never attempt a provider call without
 * a server-side credential", which was the right instinct with no server to put
 * it on. The real fix is a proxy — an edge function holding the key, with the
 * app calling that. Until then this is a known, bounded exposure on a key that
 * should be rotatable and rate-limited, and it is written down here rather than
 * discovered later.
 */

/**
 * Absent by default, and absence is a supported state: every caller falls back
 * to deterministic retrieval, which is grounded and cited. A missing key
 * degrades the answer, it never fabricates one.
 */
export const LLM_API_KEY =
  process.env.OLLAMA_API_KEY ?? process.env.EXPO_PUBLIC_LLM_API_KEY ?? '';

export const LLM_ENDPOINT =
  process.env.OLLAMA_API_ENDPOINT ??
  process.env.EXPO_PUBLIC_LLM_ENDPOINT ??
  'https://ollama.com/v1/chat/completions';

/** Text synthesis. `questReview` picks its own vision model separately. */
export const DHAMMA_MODEL =
  process.env.OLLAMA_MODEL ?? process.env.EXPO_PUBLIC_DHAMMA_MODEL ?? 'gpt-oss:120b-cloud';

/**
 * Twenty seconds.
 *
 * This was six, chosen for "someone standing at a monument will not wait longer
 * than that". The instinct is right about attention and wrong about the clock:
 * `gpt-oss:120b-cloud` is a reasoning model that regularly spends more than six
 * seconds before emitting its first token, so the deadline was firing on
 * *healthy* calls and every reflection quietly became the deterministic
 * fallback. A timeout shorter than the model's normal latency is not a
 * responsiveness guarantee, it is a switch that turns the feature off.
 *
 * The waiting is handled where it belongs — the UI names what it is doing while
 * the call is in flight — so the deadline only has to cover a genuinely dead
 * connection.
 */
export const LLM_TIMEOUT_MS = 20000;

/**
 * A provider reply, and whether the provider ran out of room mid-thought.
 *
 * `truncated` is the part that matters. A chat completion that stops at
 * `max_tokens` returns `finish_reason: 'length'` and a body that ends mid-word —
 * and unless the caller is told, that fragment gets rendered as though it were a
 * finished thought. For a surface whose whole claim is that it does not overstate
 * what it knows, silently presenting a severed sentence as guidance is the exact
 * failure mode to avoid.
 */
export type LlmReply = { text: string; truncated: boolean };

/**
 * Cuts a truncated reply back to its last complete sentence.
 *
 * Returns `''` when nothing complete survives, which callers treat as a failed
 * call and answer from the deterministic path instead. Losing a partial sentence
 * costs nothing; showing one costs the reader's trust in everything around it.
 */
export function trimToCompleteSentence(text: string): string {
  // Devanagari danda (।/॥) as well as Latin terminators — the Nepali path is not
  // an afterthought here, and a sentence ending in । is complete.
  const lastEnd = Math.max(
    text.lastIndexOf('.'),
    text.lastIndexOf('!'),
    text.lastIndexOf('?'),
    text.lastIndexOf('।'),
    text.lastIndexOf('॥'),
  );
  return lastEnd === -1 ? '' : text.slice(0, lastEnd + 1).trim();
}

/** True when a provider call is worth attempting at all. */
export function hasProvider(): boolean {
  return LLM_API_KEY.length > 0;
}

/**
 * One provider call, returning the assistant's reply or `null`.
 *
 * The single place the chat-completions request is shaped, so the ask, reflect
 * and question-generation paths cannot drift apart in model, endpoint, timeout,
 * or how a failure is handled. Returns `null` — never throws — on a missing
 * credential, a timeout, a non-OK response, or a malformed body, so every caller
 * can treat "no provider text" and "provider failed" identically and fall back
 * to deterministic, cited behaviour.
 *
 * Callers that need to trust the output (an answer, guidance) must still
 * validate it — this only guarantees the transport, never that the text is
 * grounded, and `truncated` never that it is complete.
 */
export async function callLlm(
  system: string,
  user: string,
  maxTokens = 320,
): Promise<LlmReply | null> {
  if (!hasProvider()) return null;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);
  try {
    const response = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: DHAMMA_MODEL,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
        stream: false,
        max_tokens: maxTokens,
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
    };
    const choice = data.choices?.[0];
    const text = choice?.message?.content?.trim();
    if (!text) return null;
    return { text, truncated: choice?.finish_reason === 'length' };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
