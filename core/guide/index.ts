/**
 * The guide's voice, as pure text.
 *
 * Prompt and formatting only, with no imports at all, so both the app
 * (`services/guide`) and the backend stand-in (`mock-api/server.mjs`) build the
 * same request. A guide that answers one way over the network and another way
 * on the device is two guides.
 *
 * Why this is not part of `core/dhamma`: Dhamma retrieves, grounds and cites,
 * and refuses when the corpus does not support an answer. A visitor standing in
 * front of a building and asking what it is deserves an answer, not a refusal
 * with a reading list. This path is free. The two honesty rules that survive
 * are written into the prompt below.
 */

export type GuideLanguage = 'ne' | 'en';

/** The shape the prompt needs from a place. A `HeritageSite` satisfies it. */
export type GuidePlace = {
  name: string;
  nameNepali?: string;
  summary?: string;
  description?: string;
  zone?: string;
  facts?: Array<{ label: string; value: string }>;
};

export const GUIDE_SYSTEM_EN = [
  'You are the guide inside Sākṣī, a heritage app for Lumbini, Nepal.',
  'You are speaking to a visitor standing in the place they are asking about.',
  '',
  'Speak warmly and plainly, in two or three short sentences. Say what the place is,',
  'what is worth noticing while they are there, and where they might walk next.',
  'You may draw on ordinary knowledge of Lumbini, the Buddha\'s life and Nepali history.',
  'Never refuse. If a detail is uncertain, say what you do know and move on.',
  '',
  'Two things you must not do:',
  '1. Never state the physical condition of a monument. Nothing about cracks, tilt,',
  '   damage, erosion, repairs, or when damage happened. Condition is recorded by',
  '   survey in this app, measured rather than guessed. If asked, say the condition',
  '   record lives in the Sākṣī section.',
  '2. Never claim to be quoting a text, a sutta, an inscription or a document, and',
  '   never invent a reference. If asked for a source, say the cited texts are in',
  '   the Dhamma section.',
  '',
  'No headings, no bullet lists, no markdown. Plain sentences only.',
].join('\n');

export const GUIDE_SYSTEM_NE = [
  GUIDE_SYSTEM_EN,
  '',
  'Answer entirely in Nepali (Devanagari). Keep the same warmth and the same two limits.',
].join('\n');

export function guideSystem(language: GuideLanguage = 'en'): string {
  return language === 'ne' ? GUIDE_SYSTEM_NE : GUIDE_SYSTEM_EN;
}

/**
 * The place, described in the app's own seeded words.
 *
 * Seeded content rather than the model's memory, so the guide's account agrees
 * with the site screen a visitor can open right next to it.
 */
export function placeContext(place: GuidePlace | null | undefined): string {
  if (!place) return '';
  const lines = [`Place: ${place.name}${place.nameNepali ? ` (${place.nameNepali})` : ''}`];
  if (place.summary) lines.push(`Summary: ${place.summary}`);
  if (place.description) lines.push(`Description: ${place.description}`);
  if (place.zone) lines.push(`Zone: ${place.zone.replace(/_/g, ' ')}`);
  if (place.facts?.length) {
    lines.push('Recorded facts:');
    for (const fact of place.facts.slice(0, 8)) lines.push(`  ${fact.label}: ${fact.value}`);
  }
  return lines.join('\n');
}

export function guidePrompt(
  question: string,
  place: GuidePlace | null | undefined,
  placeName?: string,
): string {
  const name = place?.name ?? placeName;
  const where = name
    ? `The visitor is at ${name}.`
    : 'The visitor is somewhere in the Lumbini property.';
  return [placeContext(place), where, `They ask: ${question}`]
    .filter((part) => part.length > 0)
    .join('\n\n')
    .trim();
}

/**
 * Strips the shapes a chat model reaches for and a guide should not use.
 *
 * Headings, bullets and bold markers arrive as literal asterisks and hashes in
 * a React Native `Text`, which is how a warm two-sentence answer turns into
 * something that looks like a broken document.
 */
export function tidyGuideText(text: string): string {
  return text
    .replace(/\*\*/g, '')
    .replace(/^#{1,6}\s*/gm, '')
    .replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * The offline guide: a real answer to *this* question, drawn only from the
 * place's own seeded material.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * With no provider reachable, the guide used to fall straight to dumping the
 * whole `summary` plus `description` for any question. So "when was this
 * excavated?" and "what is this place?" produced the identical paragraph. It
 * never errored, and it visibly did not answer. On a stage with no wifi that is
 * the guide a judge actually sees.
 *
 * This routes the question to the most relevant unit the app already holds — a
 * labelled fact, or a single sentence of the description — and returns that.
 * It **invents nothing**: every word it returns is seed content a visitor could
 * read on the site screen next to them, which is exactly the honesty the guide's
 * two limits protect. It does not touch condition (the facts are curatorial, not
 * survey measurements) and it never claims to quote a source, because it is
 * quoting the app's own description, not a sutta.
 *
 * Returns null when nothing in the place is relevant, so the caller can fall
 * back to the general orienting line rather than forcing a bad match.
 */
const GUIDE_STOPWORDS = new Set([
  'a', 'about', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'here', 'how',
  'i', 'if', 'in', 'is', 'it', 'its', 'know', 'me', 'more', 'my', 'of', 'on', 'or',
  'so', 'tell', 'that', 'the', 'their', 'them', 'there', 'these', 'they', 'this',
  'to', 'was', 'were', 'what', 'when', 'where', 'which', 'who', 'why', 'will',
  'with', 'would', 'you', 'your', 'me', 'us', 'please',
]);

/** A question is asking about time when it uses one of these. Boosts dated units. */
const TEMPORAL_QUESTION = /\b(when|year|years|old|age|date|dated|century|centuries|ancient|built|rebuilt|founded|excavat)\w*/i;
/** A unit carries a temporal answer when it names a year, an era, or a century. */
const TEMPORAL_UNIT = /\b(\d{3,4}|bce|ce|century|centuries|c\.)\b/i;

function guideTokens(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !GUIDE_STOPWORDS.has(token));
}

/**
 * Whether two words are the same, allowing for a suffix.
 *
 * A visitor types "excavated" and the description says "excavation"; exact
 * matching misses that they are the same idea. Rather than a fragile stemmer,
 * two words match when they agree on a prefix of at least five characters,
 * which folds the "-ed / -ion / -ing / -s" family together while keeping short
 * words (maya, sal, pond) to exact matches so they cannot collide.
 */
function tokensMatch(a: string, b: string): boolean {
  if (a === b) return true;
  const shortest = Math.min(a.length, b.length);
  if (shortest < 5) return false;
  let i = 0;
  while (i < shortest && a[i] === b[i]) i += 1;
  return i >= 5;
}

/** Description prose split into sentences long enough to stand alone as an answer. */
function guideSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 20);
}

type GuideUnit = { display: string; text: string; kind: 'fact' | 'sentence' };

export function answerFromPlace(
  question: string,
  place: GuidePlace | null | undefined,
): string | null {
  if (!place) return null;
  const queryTokens = [...new Set(guideTokens(question))];
  if (queryTokens.length === 0) return null;
  const timeAsked = TEMPORAL_QUESTION.test(question);

  const units: GuideUnit[] = [];
  for (const fact of place.facts ?? []) {
    units.push({ display: `${fact.label}: ${fact.value}.`, text: `${fact.label} ${fact.value}`, kind: 'fact' });
  }
  for (const sentence of guideSentences(place.description ?? place.summary ?? '')) {
    units.push({ display: sentence, text: sentence, kind: 'sentence' });
  }
  if (units.length === 0) return null;

  const score = (unit: GuideUnit): number => {
    let overlap = 0;
    for (const unitToken of new Set(guideTokens(unit.text))) {
      if (queryTokens.some((queryToken) => tokensMatch(queryToken, unitToken))) overlap += 1;
    }
    if (overlap === 0) return 0;
    let value = overlap;
    // A "when" question is answered by whatever unit carries a date, even if it
    // shares few other words with the question.
    if (timeAsked && TEMPORAL_UNIT.test(unit.text)) value += 1.5;
    // A labelled fact is the curated answer form, so it wins a tie.
    if (unit.kind === 'fact') value += 0.25;
    return value;
  };

  const ranked = units
    .map((unit) => ({ unit, value: score(unit) }))
    .filter((entry) => entry.value > 0)
    .sort((a, b) => b.value - a.value);
  if (ranked.length === 0) return null;

  // The best unit, plus one complementary unit of the other kind for context,
  // so a fact gains a sentence around it and a sentence gains its fact.
  const top = ranked[0];
  const parts = [top.unit.display];
  const complement = ranked.find((entry) => entry.unit.kind !== top.unit.kind);
  if (complement && parts.length < 2) parts.push(complement.unit.display);

  return tidyGuideText(parts.join(' '));
}
