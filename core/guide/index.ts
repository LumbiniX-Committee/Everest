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
