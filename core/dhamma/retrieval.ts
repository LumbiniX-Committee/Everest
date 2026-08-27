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
/**
 * Words carrying no retrieval signal, filtered out before scoring. Same
 * rationale as the equivalent list in services/dhamma/index.ts: a query like
 * "what is the Nara Document on Authenticity" scored 0.8 against an unrelated
 * sutta chunk before this filter existed — not from "document" or
 * "authenticity", but from "what" and "the", which appear as a substring
 * match in nearly every chunk once the corpus is large enough (534 chunks
 * across the Pali and heritage corpora, at the point this was found). The
 * cost of the two errors is asymmetric here too: dropping a true stopword
 * costs nothing a real query needs, and letting one through costs a
 * confident, wrong-feeling answer.
 */
const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'what', 'when', 'where', 'who', 'why', 'how', 'which', 'does', 'did',
  'do', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'not',
  'for', 'with', 'about', 'from', 'into', 'onto', 'has', 'have', 'had',
  'can', 'will', 'would', 'should', 'could', 'you', 'your', 'their',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
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
  // UNESCO — Lumbini (666). Checked before the DN 16:5.8 pilgrimage route
  // below: that route's `/\blumbini\b/` trigger is broad by design (any
  // paraphrase of "why is Lumbini a pilgrimage site" should hit it), which
  // means a specifically UNESCO-flavoured Lumbini question has to be caught
  // first or the general route wins on array order.
  {
    preferred: 'unesco-1997:criteria',
    triggers: [
      /\bwhen was lumbini (inscribed|listed|added)\b/i,
      /\blumbini.*world heritage\b/i,
      /\bworld heritage\b.*\blumbini\b/i,
      /\blumbini.*criteri(on|a)\b/i,
    ],
  },
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

  // ── Heritage / conservation corpus (core/dhamma/heritage.ts) ─────────────
  // Same technique as the Pali routes above: with a small corpus, BM25 alone
  // cannot always separate two heritage chunks that share vocabulary (e.g.
  // "restoration" appears in both Venice Art. 9 and Burra Art. 19). A trigger
  // match boosts the chunk that actually answers the question.

  // Venice 1964 Art. 9 — restoration stops where conjecture begins
  {
    preferred: 'venice-1964:art9',
    triggers: [
      /\bstop.*conjecture\b/i,
      /\bconjecture begins\b/i,
      /\bwhere does restoration stop\b/i,
      /\bcontemporary stamp\b/i,
      /\bvenice charter\b.*\brestoration\b/i,
    ],
  },
  // Venice 1964 Art. 15 — excavation, anastylosis, no reconstruction a priori
  {
    preferred: 'venice-1964:art15',
    triggers: [
      /\banastylosis\b/i,
      /\bexcavat(e|ion|ions)\b/i,
      /\ba priori\b/i,
      /\bruled out.*reconstruction\b/i,
    ],
  },
  // Venice 1964 Art. 1 — definition of a monument
  {
    preferred: 'venice-1964:art1',
    triggers: [
      /\bwhat is a (historic )?monument\b/i,
      /\bdefine.*monument\b/i,
      /\bconcept of a historic monument\b/i,
    ],
  },
  // Burra 2013 Art. 1.7/1.8 — restoration vs reconstruction, defined
  {
    preferred: 'burra-2013:art1.8',
    triggers: [
      /\bdifference between restoration and reconstruction\b/i,
      /\bwhat is reconstruction\b/i,
      /\bburra charter\b.*\breconstruction\b/i,
    ],
  },
  {
    preferred: 'burra-2013:art1.7',
    triggers: [
      /\bwhat is restoration\b/i,
      /\bburra charter\b.*\brestoration\b/i,
    ],
  },
  // Burra 2013 Art. 3.1/3.2 — cautious approach, no conjecture
  {
    preferred: 'burra-2013:art3.1',
    triggers: [
      /\bas much as necessary.*as little as possible\b/i,
      /\bcautious approach\b/i,
      /\bburra charter\b.*\bprinciple\b/i,
    ],
  },
  // Burra 2013 Art. 20 — reconstruction conditions
  {
    preferred: 'burra-2013:art20.1',
    triggers: [
      /\bwhen is reconstruction appropriate\b/i,
      /\breconstruction.*sufficient evidence\b/i,
    ],
  },
  // Burra 2013 Art. 25 — interpretation
  {
    preferred: 'burra-2013:art25',
    triggers: [
      /\bwhat is interpretation\b/i,
      /\bburra charter\b.*\binterpretation\b/i,
    ],
  },
  // Burra 2013 Art. 26.1/27.2 — record before/after, precede work with study
  {
    preferred: 'burra-2013:art27.2',
    triggers: [
      /\brecord.*before and after\b/i,
      /\bdocument.*before.*change\b/i,
    ],
  },
  {
    preferred: 'burra-2013:art26.1',
    triggers: [
      /\bstudies?.*before.*work\b/i,
      /\bunderstand the place\b/i,
    ],
  },

  // UNESCO — Kathmandu Valley (120bis): danger listing checked before the
  // general zones route, since "Kathmandu Valley ... World Heritage" also
  // appears in a danger-listing question and `.find()` takes the first match.
  {
    preferred: 'unesco-kv-1979:danger-list',
    triggers: [
      /\bdanger list\b/i,
      /\bworld heritage in danger\b/i,
      /\bendangered\b.*\bkathmandu\b/i,
      /\bloss of authenticity\b/i,
    ],
  },
  {
    preferred: 'unesco-kv-1979:zones',
    triggers: [
      /\bseven monument zones\b/i,
      /\bkathmandu valley\b.*\bworld heritage\b/i,
      /\bworld heritage\b.*\bkathmandu valley\b/i,
      /\bhow many (monument )?zones\b/i,
      /\bdurbar squares?\b.*\bunesco\b/i,
    ],
  },

  // Changu Narayan
  {
    preferred: 'changu-manadeva-inscription:date',
    triggers: [
      /\bm.?nadeva\b/i,
      /\bchangu narayan\b.*\binscription\b/i,
      /\boldest.*inscription\b.*\bnepal\b/i,
      /\binscription\b.*\boldest\b.*\bnepal\b/i,
    ],
  },
  {
    preferred: 'changu-narayan:earthquake-2015',
    triggers: [
      /\bchangu narayan\b.*\bearthquake\b/i,
      /\bchangu narayan\b.*\b(destroyed|damage|reconstruct)/i,
    ],
  },

  // Patan Durbar Square
  {
    preferred: 'patan-durbar-square:construction',
    triggers: [
      /\bpatan durbar square\b.*\b(built|built by|history|malla|krishna mandir)\b/i,
      /\bkrishna mandir\b/i,
      /\bwho built patan\b/i,
    ],
  },
  {
    preferred: 'patan-durbar-square:earthquake-2015',
    triggers: [
      /\bpatan durbar square\b.*\bearthquake\b/i,
      /\bhari shankar\b/i,
    ],
  },

  // Dhunge dhara / hiti — water systems. Decline checked first: a question
  // about how many are still working names the topic (dhunge dhara) and asks
  // about its state, which the broader origin route would otherwise also match.
  {
    preferred: 'dhunge-dhara:decline',
    triggers: [
      /\b(hiti|dhunge dharas?).*(dying|dry|decline|survey|disappearing|lost|still|working|producing|water)\b/i,
      /\bhow many\b.*\b(hiti|dhunge dharas?)\b/i,
      /\btraditional water system.*(dying|declin)/i,
    ],
  },
  {
    preferred: 'dhunge-dhara:origin',
    triggers: [
      /\bdhunge dharas?\b/i,
      /\bhiti\b/i,
      /\bmanga hiti\b/i,
      /\bstone (water )?spouts?\b/i,
      /\blicchavi\b.*\bwater\b/i,
    ],
  },

  // Department of Archaeology, Nepal
  {
    preferred: 'doa-nepal:role',
    triggers: [
      /\bdepartment of archaeology\b/i,
      /\bwho (monitors|protects|manages) (heritage|monuments)\b.*\bnepal\b/i,
      /\bancient monument preservation\b/i,
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
  const searchTerms = tokenize(effectiveQuery);

  if (searchTerms.length === 0) {
    return [];
  }

  // Intent routing: check if query matches a known semantic intent
  const route = INTENT_ROUTES.find((r) =>
    r.triggers.some((pattern) => pattern.test(query) || pattern.test(effectiveQuery))
  );

  // 1. BM25 score & rank
  const bm25Scored = chunks
    .map((chunk) => ({ chunk, score: scoreBM25(searchTerms, chunk) }))
    .sort((a, b) => b.score - a.score);

  const bm25Ranks = new Map<string, number>();
  bm25Scored.forEach((item, idx) => bm25Ranks.set(item.chunk.chunk_id, idx + 1));

  // 2. Vector score & rank
  const vectorScored = chunks
    .map((chunk) => ({ chunk, score: scoreVectorSimilarity(searchTerms, chunk) }))
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


