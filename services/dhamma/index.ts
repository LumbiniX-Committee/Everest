import { demoDhammaEntries, findSource, type DhammaEntry } from '@/data';
import type { DhammaAnswer, Evidence, GroundedAnswer, RefusedAnswer } from '@/types';

/**
 * Dhamma retrieval.
 *
 * A mock in the sense that the corpus is four entries and the matching is
 * lexical rather than semantic. Not a mock in the sense that matters: it really
 * searches, it really scores, and it really refuses. A stub that always
 * produced an answer would make the refusal path unreachable and untestable,
 * and the refusal is the feature.
 *
 * The interface is the one a real retriever would expose, so replacing the
 * internals later touches nothing above this file (§48).
 */

/** Named so the refusal can say what was actually consulted. */
export const COLLECTIONS = [
  'Pali Canon (public-domain translations)',
  'Ashokan inscriptions',
  'Lumbini site records',
  'Sanskrit lexicography',
];

/**
 * Below this, the corpus does not support an answer and we refuse.
 *
 * Tuned to be *unforgiving*. The cost of the two errors is wildly asymmetric:
 * a needless refusal is a mild disappointment that the suggestions recover
 * from, while a confident answer assembled from a weak match is exactly the
 * failure this surface exists to avoid.
 */
const CONFIDENCE_FLOOR = 0.34;

/** Words carrying no retrieval signal. Kept small and obvious. */
const STOPWORDS = new Set([
  'a', 'about', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'been', 'but', 'by',
  'can', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have', 'how', 'i', 'if',
  'in', 'is', 'it', 'its', 'me', 'my', 'of', 'on', 'or', 'so', 'that', 'the', 'their',
  'them', 'there', 'these', 'they', 'this', 'to', 'was', 'were', 'what', 'when', 'where',
  'which', 'who', 'why', 'will', 'with', 'would', 'you', 'your',
]);

function tokenise(text: string): string[] {
  return text
    .toLowerCase()
    // Keep Latin letters, digits and the combining marks used by IAST
    // transliteration — stripping those would turn "sākṣī" into two fragments.
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

/**
 * Normalises a token toward a common form, so what a visitor types reaches what
 * the corpus stores.
 *
 * Stripping diacritics is not enough on its own. `sākṣī` reduces to `saksi`,
 * but nobody without a Devanagari keyboard types it that way — they type
 * `sakshi`, because `sh` is the conventional ASCII rendering of ś and ṣ. The
 * same goes for doubled vowels standing in for macrons.
 *
 * Over-folding is safe here because the same function is applied to both the
 * query and the corpus. Collapsing more than strictly necessary can only
 * introduce false matches, never miss true ones — and false matches are already
 * held back by IDF weighting and the confidence floor.
 */
function fold(token: string): string {
  return (
    token
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      // ś and ṣ are conventionally typed "sh".
      .replace(/sh/g, 's')
      // "aa", "ii", "uu" stand in for ā, ī, ū.
      .replace(/([aiu])\1+/g, '$1')
  );
}

/** The searchable text of one entry, folded and deduplicated. */
function haystackFor(entry: DhammaEntry): Set<string> {
  const source = findSource(entry.citations[0]?.sourceId);
  return new Set(
    tokenise(
      [entry.question, entry.answer, entry.original ?? '', source?.title ?? '', source?.attribution ?? '']
        .join(' '),
    ).map(fold),
  );
}

/** Built once. The corpus is static, so document frequencies are too. */
const haystacks = new Map<string, Set<string>>(
  demoDhammaEntries.map((entry) => [entry.id, haystackFor(entry)]),
);

/**
 * Inverse document frequency, smoothed.
 *
 * This is what stops a question being answered by an entry that merely shares
 * its common words. "Buddha" appears throughout the corpus and distinguishes
 * nothing; "enlightenment" appears nowhere, so failing to match it is strong
 * evidence that the corpus cannot answer.
 *
 * Terms absent from every entry score highest, which means an unmatched one
 * drags the result down hard. That asymmetry is deliberate — it biases the
 * whole surface toward refusing.
 */
function idf(term: string): number {
  const total = demoDhammaEntries.length;
  let seen = 0;
  for (const haystack of haystacks.values()) {
    if (matches(term, haystack)) seen += 1;
  }
  return Math.log((total + 1) / (seen + 1)) + 1;
}

function matches(folded: string, haystack: Set<string>): boolean {
  if (haystack.has(folded)) return true;
  // Prefix matching so "birth" reaches "birthplace". One-directional: a query
  // term may be a prefix of a corpus term, not the reverse, or short queries
  // would match almost everything.
  for (const word of haystack) {
    if (word.startsWith(folded)) return true;
  }
  return false;
}

/**
 * Share of the query's *distinctiveness* the entry accounts for, 0–1.
 *
 * Weighting by IDF rather than counting tokens is what makes the floor
 * meaningful. Without it, a query with two ordinary words and three the corpus
 * has never seen clears a plain 0.34 ratio and produces a confident answer to
 * a question nothing in the collection addresses.
 */
function scoreEntry(queryTokens: string[], entry: DhammaEntry): number {
  if (queryTokens.length === 0) return 0;

  const haystack = haystacks.get(entry.id);
  if (!haystack) return 0;

  let matched = 0;
  let possible = 0;
  for (const token of queryTokens) {
    const folded = fold(token);
    const weight = idf(folded);
    possible += weight;
    if (matches(folded, haystack)) matched += weight;
  }

  return possible === 0 ? 0 : matched / possible;
}

/** Turns a corpus entry into a grounded answer. */
export function answerForEntry(entry: DhammaEntry, relevance = 1): GroundedAnswer {
  const evidence: Evidence[] = entry.citations.map((citation) => ({
    citation,
    // The corpus stores a rendered answer rather than raw passages, so the
    // original line is quoted where one exists and the answer stands in
    // otherwise. A real retriever would return the retrieved span here.
    passage: entry.original ?? entry.answer,
    relevance,
  }));

  return {
    status: 'grounded',
    text: entry.answer,
    citations: entry.citations,
    evidence,
    caveat: entry.caveat,
    reflectionPrompt: entry.reflectionPrompt,
  };
}

function refuse(query: string, ranked: { entry: DhammaEntry; score: number }[]): RefusedAnswer {
  // Near-misses become "related", so a refusal still points somewhere. Only
  // entries with *some* overlap qualify — offering unrelated material as
  // related would be its own small dishonesty.
  const related = ranked
    .filter((candidate) => candidate.score > 0)
    .slice(0, 2)
    .flatMap((candidate) => candidate.entry.citations);

  return {
    status: 'refused',
    text: 'I don’t have enough reliable evidence to answer this confidently.',
    reason: related.length
      ? 'Nothing in the collections addresses this closely enough to answer without guessing. What is below is adjacent, not an answer.'
      : `Nothing in the collections addresses this. The corpus here is small and deliberately narrow — ${COLLECTIONS.length} collections, all concerning Lumbini and the early record.`,
    searched: COLLECTIONS,
    related,
    // Real questions the corpus can answer, so the suggestion is never a
    // dead end.
    suggestions: demoDhammaEntries
      .filter((entry) => entry.question.toLowerCase() !== query.trim().toLowerCase())
      .slice(0, 3)
      .map((entry) => entry.question),
  };
}

export type Retrieval = {
  answer: DhammaAnswer;
  /** What was found while searching, shown during and after retrieval. */
  evidence: Evidence[];
};

/**
 * Searches the corpus for a free-text question.
 *
 * Deliberately async and deliberately not instant — but the delay is a real
 * search boundary, not a fake typing animation. The UI fills it by showing the
 * evidence being weighed (§14), which is the honest version of "thinking".
 */
export async function ask(query: string): Promise<Retrieval> {
  const queryTokens = tokenise(query);

  const ranked = demoDhammaEntries
    .map((entry) => ({ entry, score: scoreEntry(queryTokens, entry) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];

  if (!best || best.score < CONFIDENCE_FLOOR) {
    const answer = refuse(query, ranked);
    return {
      answer,
      evidence: answer.related.map((citation) => ({
        citation,
        passage: '',
        relevance: 0,
      })),
    };
  }

  const answer = answerForEntry(best.entry, best.score);
  return { answer, evidence: answer.evidence };
}
