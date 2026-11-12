/**
 * core/dhamma/sites.ts
 *
 * Questions about a named place, answered from that place's own page.
 *
 * The canon and the heritage charters cannot say when Nyatapola was built or
 * what Kathmandu Durbar Square costs to enter, and the engine used to refuse
 * both. The app already shows those facts on the site page, with sources, so
 * Ask now answers from exactly those words.
 *
 * Scope stays narrow on purpose. A place counts as named only when every
 * distinctive word of its name is in the question; "temple" or "Kathmandu" on
 * their own name nothing. The answer is one passage, quoted, with its source;
 * nothing is generated here, and a place with nothing on record is not answered.
 */
import type { BilaraChunk } from './bilara.ts';
import { SITE_CHUNKS, SITE_INDEX, type SiteIndexEntry } from './sites.generated.ts';

const chunkById = new Map<string, BilaraChunk>(SITE_CHUNKS.map((chunk) => [chunk.chunk_id, chunk]));

export function resolveSiteChunk(chunkId: string): BilaraChunk | undefined {
  return chunkById.get(chunkId);
}

const words = (text: string): Set<string> =>
  new Set(
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length >= 3),
  );

const DEVANAGARI = /[\u0900-\u097F]/;

/** The place a question is about, or null when it names none. */
export function findNamedPlace(question: string): SiteIndexEntry | null {
  const asked = words(question);
  const nepali = DEVANAGARI.test(question) ? question.replace(/ँ/g, 'ं') : null;
  let best: { entry: SiteIndexEntry; score: number } | null = null;
  for (const entry of SITE_INDEX) {
    const latin = entry.key.length > 0 && entry.key.every((word) => asked.has(word));
    const devanagari = nepali !== null && entry.keyNe.length > 0 && entry.keyNe.every((stem) => nepali.includes(stem));
    if (!latin && !devanagari) continue;
    if (devanagari && !latin) {
      const score = entry.keyNe.join('').length * 3 - entry.tier;
      if (!best || score > best.score) best = { entry, score };
      continue;
    }
    // The name matched most fully wins, so "Trailokya Mohan Narayan Temple"
    // beats "Narayan Temple"; a named parent complex settles namesakes such as
    // the two Sundari Chowks; curated sites outrank listed places.
    let matched = 0;
    for (const word of words(entry.name)) if (asked.has(word)) matched += 1;
    const parent = entry.parent.filter((word) => asked.has(word)).length;
    const score = matched * 10 + parent * 5 - entry.tier;
    if (!best || score > best.score) best = { entry, score };
  }
  return best?.entry ?? null;
}

const INTENTS: { suffix: string; pattern: RegExp }[] = [
  { suffix: 'fee', pattern: /\b(fee|fees|ticket|tickets|cost|costs|price|charge|pay|entry|entrance|admission|npr|rupees?)\b|शुल्क|टिकट|पैसा/i },
  { suffix: 'note', pattern: /\b(rules?|allowed|enter|entry|leather|dress|hindus?|non-hindus?|who is worshipped|deity|god)\b|नियम|हिन्दु|प्रवेश|भित्र जान/i },
  { suffix: 'visit', pattern: /\b(photo|photos|photograph|photography|camera|pictures?)\b|फोटो|तस्बिर/i },
  { suffix: 'facts', pattern: /\b(when|built|date|year|century|old|age|height|tall|storey|storeys|tiers?|type)\b|कहिले|बनेको/i },
];

const STOP = new Set(['what', 'when', 'where', 'which', 'who', 'why', 'how', 'the', 'this', 'that', 'there', 'here', 'about', 'tell', 'does', 'did', 'are', 'was', 'were', 'for', 'and', 'with', 'from', 'have', 'has', 'can', 'its']);

function overlap(question: Set<string>, chunk: BilaraChunk): number {
  const text = words(`${chunk.title_en} ${chunk.english}`);
  let n = 0;
  for (const word of question) if (!STOP.has(word) && text.has(word)) n += 1;
  return n;
}

export type SiteAnswer = {
  place: SiteIndexEntry;
  /** Best first; the first is the one quoted. */
  chunks: BilaraChunk[];
  /** Asked about the fee, the rules or photography, which only the page records. */
  practical: boolean;
  /** Said first when the question asks for something nobody has recorded. */
  notRecorded: string | null;
};

const HOURS = /\b(open|opens|opening|close|closes|closing|closed|hours|timings?)\b|खुल्ने|बन्द हुने/i;

/**
 * The passages that answer a question about a named place, best first.
 *
 * A clear intent (the fee, the rules, photography, dates) picks that passage
 * when the place has one. Otherwise the passage sharing most words with the
 * question wins, and a tie goes to the place's own description.
 */
export function answerAboutPlace(question: string, place: SiteIndexEntry): SiteAnswer | null {
  const chunks = place.chunks.map((id) => chunkById.get(id)).filter((chunk): chunk is BilaraChunk => Boolean(chunk));
  if (!chunks.length) return null;
  const asked = words(question);
  for (const word of place.key) asked.delete(word);

  const intent = INTENTS.find(({ suffix, pattern }) => pattern.test(question) && chunks.some((chunk) => chunk.chunk_id.endsWith(`:${suffix}`)));
  const ranked = chunks
    .map((chunk, order) => ({
      chunk,
      score: (intent && chunk.chunk_id.endsWith(`:${intent.suffix}`) ? 100 : 0) + overlap(asked, chunk) * 2 + (chunk.chunk_id.endsWith(':about') ? 1 : 0),
      order,
    }))
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map(({ chunk }) => chunk);
  // Opening hours are only ever OSM's own tag. When it is missing, say so
  // rather than answer a different question with the description.
  const hoursAsked = HOURS.test(question);
  const hoursKnown = chunks.some((chunk) => chunk.english.includes('Opening hours'));
  if (hoursAsked && hoursKnown) {
    ranked.sort((a, b) => Number(b.english.includes('Opening hours')) - Number(a.english.includes('Opening hours')));
  }
  return {
    place,
    chunks: ranked,
    practical: Boolean(intent && intent.suffix !== 'facts') || hoursAsked,
    notRecorded: hoursAsked && !hoursKnown ? `Opening hours for ${place.name} are not recorded, so call ahead or ask at the gate.` : null,
  };
}
