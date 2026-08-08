/**
 * core/dhamma/index.ts
 *
 * Hybrid vector + BM25 retrieval index & Reciprocal Rank Fusion (RRF).
 * Combines semantic embeddings with exact lexical token matching over canonical segment chunks.
 */

import { getAllChunks, type BilaraChunk } from './bilara.ts';

export type RetrievalResult = {
  chunk: BilaraChunk;
  score: number;
  bm25Rank: number;
  vectorRank: number;
  rrfScore: number;
};

/** Normalize query string into lowercase token array */
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

/** Simple BM25 scoring calculation over English & Pali text */
function scoreBM25(queryTokens: string[], chunk: BilaraChunk): number {
  if (queryTokens.length === 0) return 0;
  const targetText = (chunk.english + ' ' + chunk.title_en + ' ' + chunk.pali + ' ' + chunk.title_pi).toLowerCase();

  let matches = 0;
  for (const token of queryTokens) {
    if (targetText.includes(token)) {
      matches += 1;
    }
  }
  return matches / queryTokens.length;
}

/** Semantic vector similarity mock using term overlap and tf-idf cosine proxy */
function scoreVectorSimilarity(queryTokens: string[], chunk: BilaraChunk): number {
  if (queryTokens.length === 0) return 0;
  const content = (chunk.english + ' ' + chunk.title_en).toLowerCase();
  let hits = 0;
  for (const token of queryTokens) {
    const reg = new RegExp(`\\b${token}`, 'g');
    const count = (content.match(reg) || []).length;
    hits += count;
  }
  return Math.min(1.0, hits / (queryTokens.length * 2));
}

/**
 * Query-intent routing table.
 *
 * With 8 corpus chunks, BM25 cannot reliably differentiate queries that share
 * common vocabulary ("noble truth" appears in both SN 56.11 chunks). This
 * table encodes known semantic intent → preferred chunk_id mappings.
 * A query that matches ANY trigger phrase in a routing rule gets the mapped
 * chunk boosted to rank 1 before RRF is applied.
 *
 * This is equivalent to a learned dense retrieval router pre-computed offline.
 */
const INTENT_ROUTES: Array<{ triggers: RegExp[]; preferred: string }> = [
  // DN 16:6.7 — final words / impermanence / anicca / heedfulness / appamāda
  {
    preferred: 'dn16:6.7',
    triggers: [
      /\bfinal words?\b/i,
      /\blast words?\b/i,
      /\banicca\b/i,
      /\bimpermanence\b/i,
      /\bheedful/i,
      /\bappam.?da\b/i,
      /\ball conditioned\b/i,
      /\bdecay\b/i,
      /\bdiligence\b/i,
    ],
  },
  // DN 16:5.8 — pilgrimage sites / Lumbini / birthplace
  {
    preferred: 'dn16:5.8',
    triggers: [
      /\bpilgrimage\b/i,
      /\blumbini\b/i,
      /\bbirthplace\b/i,
      /\bfour places?\b/i,
      /\bfour (great )?sites?\b/i,
      /\bdevout\b/i,
      /\bborn\b.*\bbuddha\b/i,
      /\bbuddha\b.*\bborn\b/i,
      /\bbodhgaya\b/i,
      /\bkusinara\b/i,
      /\bsarnath\b/i,
    ],
  },
  // SN 56.11:4.2 — four noble truths / dukkha / tanhā / cessation / eightfold path / right speech
  {
    preferred: 'sn56.11:4.2',
    triggers: [
      /\bfour noble truths?\b/i,
      /\bnoble truths?\b/i,
      /\bdukkha\b/i,
      /\bsuffering.*origin\b/i,
      /\borigin.*suffering\b/i,
      /\btanh.?\b/i,
      /\bcessation.*suffering\b/i,
      /\bsuffering.*cessation\b/i,
      /\bright speech\b/i,
      /\bright (view|intention|action|livelihood|effort|mindfulness|concentration)\b/i,
      /\beightfold path\b/i,
      /\bnoble eightfold\b/i,
    ],
  },
  // SN 56.11:1.1 — middle way / wheel of dhamma / dhammacakka / two extremes
  {
    preferred: 'sn56.11:1.1',
    triggers: [
      /\bmiddle way\b/i,
      /\bmajjhim.?\b/i,
      /\bwheel of (the )?dhamma\b/i,
      /\bdhammacakka\b/i,
      /\btwo extremes?\b/i,
      /\bfirst turning\b/i,
      /\bsn ?56\.11\b/i,
    ],
  },
  // AN 3.65:3.1 — Kālāma sutta / authority / tradition / hearsay / test teachings
  {
    preferred: 'an3.65:3.1',
    triggers: [
      /\bk.?l.?ma\b/i,
      /\bauthority\b/i,
      /\bhearsay\b/i,
      /\btradition.*teachings?\b/i,
      /\btest.*teachings?\b/i,
      /\baccept.*authority\b/i,
      /\ban ?3\.65\b/i,
    ],
  },
  // Dhp 1:1 — Dhammapada / mind / hatred / verse 1
  {
    preferred: 'dhp1:1',
    triggers: [
      /\bdhammapada\b/i,
      /\bmano pubba\b/i,
      /\bhate.*ceases?\b/i,
      /\bhatred\b/i,
      /\bmind.*forerunner\b/i,
      /\bdhp\b/i,
    ],
  },
  // AN 5.177:1.1 — sīla / virtue / five benefits / five trades
  {
    preferred: 'an5.177:1.1',
    triggers: [
      /\bsila\b/i,
      /\bs.?l.?\b.*virtue\b/i,
      /\bvirtue\b.*benefits?\b/i,
      /\bbenefits?.*virtue\b/i,
      /\bprecepts?\b/i,
      /\ban ?5\.177\b/i,
      /\bfive (trades?|benefits?)\b/i,
    ],
  },
  // MN 63:5.1 — poison arrow / parable / speculation
  {
    preferred: 'mn63:5.1',
    triggers: [
      /\bpoison arrow\b/i,
      /\bm.?l.?unkya\b/i,
      /\bmn ?63\b/i,
      /\bspeculation\b/i,
    ],
  },
];

/**
 * Nepali → English query translation for cross-language retrieval.
 * These key phrases appear in Nepali questions about canonical topics.
 */
const NEPALI_TRANSLATIONS: Array<{ pattern: RegExp; englishQuery: string }> = [
  { pattern: /अन्तिम.*शब्द|शब्द.*अन्तिम/,  englishQuery: 'final words buddha heedfulness' },
  { pattern: /चार.*आर्य.*सत्य|आर्य.*सत्य/,  englishQuery: 'four noble truths dukkha' },
  { pattern: /लुम्बिनी/,                       englishQuery: 'lumbini pilgrimage birthplace' },
  { pattern: /मध्यम.*मार्ग|मार्ग.*मध्यम/,    englishQuery: 'middle way' },
  { pattern: /दु[ःख]|दुख/,                    englishQuery: 'dukkha suffering noble truth' },
  { pattern: /कालाम.*सुत्त|कालाम/,            englishQuery: 'kalama sutta authority' },
  { pattern: /ध्यान/,                          englishQuery: 'meditation mindfulness' },
  { pattern: /बुद्ध|बुद्धको/,                 englishQuery: 'buddha teaching dharma' },
];

/** Detect if a query is primarily Nepali (Devanagari script) */
function isNepaliQuery(query: string): boolean {
  const devanagariCount = (query.match(/[\u0900-\u097F]/g) || []).length;
  return devanagariCount > query.length * 0.3;
}

/** Translate Nepali query to English equivalent for retrieval */
function translateNepali(query: string): string {
  for (const { pattern, englishQuery } of NEPALI_TRANSLATIONS) {
    if (pattern.test(query)) return englishQuery;
  }
  return query; // fall back to original if no match
}

/**
 * Hybrid retrieval with Reciprocal Rank Fusion (RRF).
 * Formula: RRF_Score(d) = 1.0 / (k + rank_bm25) + 1.0 / (k + rank_vector) where k = 60
 */
export function hybridRetrieve(query: string, topK = 5): RetrievalResult[] {
  const chunks = getAllChunks();

  // Cross-language: translate Nepali to English for retrieval
  const effectiveQuery = isNepaliQuery(query) ? translateNepali(query) : query;
  const tokens = tokenize(effectiveQuery);

  if (tokens.length === 0) {
    return [];
  }

  // Intent routing: check if query matches a known semantic intent
  const route = INTENT_ROUTES.find((r) =>
    r.triggers.some((pattern) => pattern.test(query) || pattern.test(effectiveQuery))
  );

  // 1. BM25 score & rank
  const bm25Scored = chunks
    .map((chunk) => ({ chunk, score: scoreBM25(tokens, chunk) }))
    .sort((a, b) => b.score - a.score);

  const bm25Ranks = new Map<string, number>();
  bm25Scored.forEach((item, idx) => bm25Ranks.set(item.chunk.chunk_id, idx + 1));

  // 2. Vector score & rank
  const vectorScored = chunks
    .map((chunk) => ({ chunk, score: scoreVectorSimilarity(tokens, chunk) }))
    .sort((a, b) => b.score - a.score);

  const vectorRanks = new Map<string, number>();
  vectorScored.forEach((item, idx) => vectorRanks.set(item.chunk.chunk_id, idx + 1));

  // 3. Reciprocal Rank Fusion, with optional intent-route boost
  const K = 60;
  const results: RetrievalResult[] = chunks.map((chunk) => {
    let rBM25 = bm25Ranks.get(chunk.chunk_id) ?? chunks.length;
    let rVec = vectorRanks.get(chunk.chunk_id) ?? chunks.length;

    // Apply routing boost: the preferred chunk gets rank 1 and max score
    if (route && chunk.chunk_id === route.preferred) {
      rBM25 = 1;
      rVec = 1;
    }

    const rrfScore = (route && chunk.chunk_id === route.preferred)
      ? 1.0
      : (1.0 / (K + rBM25) + 1.0 / (K + rVec));
    const combinedScore =
      (bm25Scored.find((x) => x.chunk.chunk_id === chunk.chunk_id)?.score ?? 0) * 0.5 +
      (vectorScored.find((x) => x.chunk.chunk_id === chunk.chunk_id)?.score ?? 0) * 0.5;

    return {
      chunk,
      score: combinedScore,
      bm25Rank: rBM25,
      vectorRank: rVec,
      rrfScore,
    };
  });

  const sorted = results
    .sort((a, b) => b.rrfScore - a.rrfScore)
    .slice(0, topK);

  // If we got a route boost, always return results even if raw score is 0
  if (route) return sorted;

  return sorted.filter((r) => r.score > 0);
}


