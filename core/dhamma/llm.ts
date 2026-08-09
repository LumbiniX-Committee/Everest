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
export const LLM_API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY ?? '';

export const LLM_ENDPOINT =
  process.env.EXPO_PUBLIC_LLM_ENDPOINT ?? 'https://ollama.com/v1/chat/completions';

/** Text synthesis. `questReview` picks its own vision model separately. */
export const DHAMMA_MODEL = process.env.EXPO_PUBLIC_DHAMMA_MODEL ?? 'gpt-oss:120b-cloud';

/** Six seconds. Someone standing at a monument will not wait longer than that. */
export const LLM_TIMEOUT_MS = 6000;

/** True when a provider call is worth attempting at all. */
export function hasProvider(): boolean {
  return LLM_API_KEY.length > 0;
}
