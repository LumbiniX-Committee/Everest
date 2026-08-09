import { guidePrompt, guideSystem, tidyGuideText, type GuideLanguage } from '@/core/guide';
import { callLlm, hasProvider, trimToCompleteSentence } from '@/core/dhamma/llm';
import { findSite } from '@/data';
import type { HeritageSite } from '@/types';

/**
 * The on-site guide, app side.
 *
 * Separate from `services/dhamma` on purpose. Dhamma retrieves, grounds, cites,
 * and refuses when the corpus does not support an answer, which is exactly right
 * for a question about a sutta and exactly wrong for a visitor standing in front
 * of a building asking what it is. Running the guide through the Dhamma engine
 * produced "I don't have enough reliable evidence to answer this confidently"
 * followed by a reading list: a true sentence, and a useless one.
 *
 * The voice and its two limits live in `core/guide`, shared with the backend so
 * the answer does not change depending on which one served it. Nothing in
 * `core/dhamma` or `services/dhamma` is touched by this file.
 */

export type { GuideLanguage };

/** Where the answer came from. Useful in tests, never shown as a badge. */
export type GuideOrigin = 'provider' | 'site' | 'general';

export type GuideReply = {
  text: string;
  origin: GuideOrigin;
};

export type GuideRequest = {
  question: string;
  /** The site the visitor is standing at, when they are standing at one. */
  siteId?: string;
  siteName?: string;
  language?: GuideLanguage;
};

const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/** Longer than the provider's own deadline, for the reason given in services/dhamma. */
const API_TIMEOUT_MS = 30000;

/**
 * The answer of last resort, and it is a real answer rather than an apology.
 *
 * A guide that says "I could not reach the network" has told the visitor about
 * our infrastructure instead of about the place they are standing in. The seed
 * ships every site's own description, so there is always something true to say.
 */
export function fallbackReply(site: HeritageSite | undefined, siteName?: string): GuideReply {
  if (site) {
    const body = [site.summary, site.description].filter(Boolean).join(' ');
    if (body.trim()) return { text: body.trim(), origin: 'site' };
  }
  const name = site?.name ?? siteName;
  return {
    text: name
      ? `You are at ${name}. Open the place from the map for what this app has recorded about it, and the Dhamma section for the texts that mention it.`
      : 'Walk toward a marked place on the map and I can tell you about it. The Dhamma section holds the texts, and Sākṣī holds what has been surveyed here.',
    origin: 'general',
  };
}

/**
 * What of a provider reply is safe to show, or `''`.
 *
 * A reply that stopped at the ceiling ends mid-word, and a severed sentence
 * presented as guidance is worse than saying nothing. Cut it back to its last
 * complete sentence; if too little survives to be an answer, the caller falls
 * through to the site's own description.
 */
export function usableGuideText(reply: { text: string; truncated: boolean } | null): string {
  if (!reply?.text.trim()) return '';
  const text = reply.truncated ? trimToCompleteSentence(reply.text) : reply.text;
  const tidied = tidyGuideText(text);
  return tidied.length >= 40 ? tidied : '';
}

async function askRemote(request: GuideRequest): Promise<GuideReply | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/tirtha/guide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        question: request.question,
        site_id: request.siteId ?? null,
        site_name: request.siteName ?? null,
        language: request.language ?? 'en',
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json().catch(() => null)) as { answer?: string } | null;
    const text = body?.answer?.trim();
    if (!text) return null;
    return { text: tidyGuideText(text), origin: 'provider' };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Ask the guide. Always resolves, never throws, never refuses.
 *
 * Order: the backend, then a direct provider call if a credential happens to be
 * present in this process, then the site's own bundled description. The last of
 * those needs no network at all, which is the case the Sacred Garden actually
 * presents.
 */
export async function askGuide(request: GuideRequest): Promise<GuideReply> {
  const site = request.siteId ? findSite(request.siteId) : undefined;
  const question = request.question.trim();
  if (!question) return fallbackReply(site, request.siteName);

  if (API_URL) {
    const remote = await askRemote({ ...request, question });
    if (remote) return remote;
  }

  if (hasProvider()) {
    const reply = await callLlm(
      guideSystem(request.language ?? 'en'),
      guidePrompt(question, site, request.siteName),
      420,
    );
    const text = usableGuideText(reply);
    if (text) return { text, origin: 'provider' };
  }

  return fallbackReply(site, request.siteName);
}

/**
 * The opening line, before anything has been asked.
 *
 * Named here rather than in the screen so the guide's voice lives in one place.
 */
export function opening(siteName?: string): string {
  return siteName
    ? `You are standing at ${siteName}. Ask me anything about it, or about where to go next.`
    : 'Ask me about Lumbini, or about where to go next.';
}
