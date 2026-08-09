import {
  askDhammaAsync,
  checkDistressTrigger,
  generateReflectionQuestions,
  processReflectionAsync,
  VERIFIED_NEPALI_HELPLINES,
} from '@/core/dhamma';
import { generateOfflineGroundedAnswer } from '@/services/offlineModel';
import { demoDhammaEntries, findSource, type DhammaEntry } from '@/data';
import type { Citation, DhammaAnswer, Evidence, GroundedAnswer, RefusedAnswer } from '@/types';

/**
 * Dhamma retrieval — the app-facing boundary.
 *
 * This file used to *be* the retriever: lexical scoring over six hand-written
 * demo entries. It said of itself that the interface was the one a real
 * retriever would expose, so replacing the internals later would touch nothing
 * above this file. That turned out to be true, and this is that replacement.
 *
 * Answers now come from `core/dhamma`: hybrid retrieval (BM25 + vector, fused
 * by reciprocal rank) over segment-aligned canonical passages, with citations
 * validated against what was actually retrieved. The refusal is unchanged in
 * spirit and stricter in fact — it now refuses against a grounding threshold on
 * a real retrieval score rather than a lexical overlap.
 *
 * Three sources, in order:
 *
 *   1. `EXPO_PUBLIC_API_URL`, when set. Unchanged — the mock in `mock-api/`
 *      serves this contract and the team's offline dev loop depends on it.
 *   2. `core/dhamma`, on device. This is the one that matters: it needs no
 *      network, which is the case that actually happens in the Sacred Garden.
 *   3. The six demo entries, kept only as the source of *suggestions* on a
 *      refusal — "here are questions this corpus can answer" needs a list of
 *      known-good questions, and that is all they are still for.
 *
 * `core/dhamma` returns the same shape the API does, so `fromApiResponse` maps
 * both. That is not a coincidence: the API was written against this contract.
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

type ApiCitation = {
  segment_id?: string;
  sutta_uid?: string;
  display?: string;
};

type ApiPassage = {
  segment_id?: string;
  english?: string;
};

type ApiResponse = {
  answer?: string | null;
  refused?: boolean;
  refusal_reason?: string;
  citations?: ApiCitation[];
  passages?: ApiPassage[];
};

export type DhammaLanguage = 'ne' | 'en';

export type ReflectionApiResult = {
  inquiry: string;
  stage: number;
  completed: boolean;
  distress_override: boolean;
  helplines?: Array<{ name: string; number: string; hours: string }>;
  disclaimer: string;
  language?: DhammaLanguage;
  guidance?: string;
  citations?: Array<{ segment_id: string; sutta_uid: string; display: string }>;
  passages?: Array<{ segment_id: string; english: string }>;
  tier?: 'full_rag' | 'fallback';
};

// This value is embedded in the Expo bundle. It is only a server URL: the
// Ollama credential must stay in the backend environment.
const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').trim().replace(/\/$/, '');

/**
 * Thirty seconds, and it must stay longer than the engine's own provider
 * deadline (`LLM_TIMEOUT_MS`, 20s in core/dhamma/llm.ts).
 *
 * This was twelve, which inverted the two budgets: the backend was still
 * waiting on a synthesis it would have returned at second eighteen when the app
 * gave up at second twelve. Measured Nepali synthesis runs 6–9s warm and longer
 * on the first call of a session, so the client was abandoning work that was
 * about to succeed and falling back to the on-device engine — which then made
 * its *own* provider call and paid the latency a second time.
 *
 * The ordering is the invariant, not the number: an outer deadline shorter than
 * the inner one cannot ever observe a slow success, only manufacture failures.
 */
const API_TIMEOUT_MS = 30000;

function sourceIdFor(suttaUid: string | undefined, segmentId: string | undefined): string {
  if (suttaUid === 'dn16' || segmentId?.startsWith('dn16:')) return 'dn-16';
  if (suttaUid === 'sn56.11' || segmentId?.startsWith('sn56.11:')) return 'sn-11-3';
  // The current canonical corpus exposes additional suttas before the local
  // source registry does. Keep the citation checkable without inventing a
  // source record; the UI simply omits an unknown source card.
  return suttaUid ?? segmentId ?? 'canonical-corpus';
}

function fromApiResponse(result: ApiResponse, question: string, language: DhammaLanguage): Retrieval {
  const apiCitations = Array.isArray(result.citations) ? result.citations : [];
  const citations: Citation[] = apiCitations.map((citation) => ({
    sourceId: sourceIdFor(citation.sutta_uid, citation.segment_id),
    locator: citation.segment_id,
  }));
  const passages = Array.isArray(result.passages) ? result.passages : [];
  const evidence = passages.map((passage, index) => ({
    citation: citations[index] ?? {
      sourceId: sourceIdFor(undefined, passage.segment_id),
      locator: passage.segment_id,
    },
    passage: passage.english ?? '',
    relevance: Math.max(0, 1 - index * 0.1),
  }));

  if (result.refused || !result.answer) {
    return {
      answer: {
        status: 'refused',
        text: language === 'ne'
          ? 'यस प्रश्नको विश्वसनीय उत्तर दिन मसँग पर्याप्त प्रमाण छैन।'
          : 'I don’t have enough reliable evidence to answer this confidently.',
        reason: result.refusal_reason ?? (language === 'ne'
          ? 'प्रामाणिक संग्रहले यस प्रश्नको विश्वसनीय उत्तर समर्थन गर्दैन।'
          : 'The canonical collection does not support a reliable answer to this question.'),
        searched: COLLECTIONS,
        related: citations,
        suggestions: demoDhammaEntries
          .filter((entry) => entry.question.toLowerCase() !== question.trim().toLowerCase())
          .slice(0, 3)
          .map((entry) => entry.question),
      },
      evidence,
    };
  }

  return {
    answer: {
      status: 'grounded',
      text: result.answer,
      citations,
      evidence,
    },
    evidence,
  };
}

async function askRemote(query: string, language: DhammaLanguage): Promise<Retrieval> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/dhamma/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ question: query, language, mode: 'auto' }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as ApiResponse | null;
    if (!response.ok || !body) {
      throw new Error(`Dhamma API returned ${response.status}`);
    }
    return fromApiResponse(body, query, language);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Searches the corpus for a free-text question.
 *
 * Deliberately async and deliberately not instant — but the delay is a real
 * search boundary, not a fake typing animation. The UI fills it by showing the
 * evidence being weighed (§14), which is the honest version of "thinking".
 */
export async function ask(query: string, language: DhammaLanguage = 'ne'): Promise<Retrieval> {
  if (API_URL) {
    try {
      return await askRemote(query, language);
    } catch (error) {
      // The local corpus is an intentional offline fallback for venue Wi-Fi
      // failures and development without the backend running.
      console.warn('[dhamma] API unavailable; using local corpus fallback', error);
    }
  }
  // On device, over the canonical corpus. Async because it may synthesise
  // through a provider when one is configured; without one it returns the
  // deterministic retrieval result, which is grounded and cited either way.
  const result = await askDhammaAsync({ question: query, language, mode: 'auto' });
  if (!result.refused && result.answer && result.passages?.length) {
    try {
      const localAnswer = await generateOfflineGroundedAnswer({
        question: query,
        language,
        passages: result.passages,
      });
      if (localAnswer) result.answer = localAnswer;
    } catch (error) {
      console.warn('[dhamma] offline model unavailable; keeping corpus answer', error);
    }
  }
  return fromApiResponse(result, query, language);
}

export type CrisisHelpline = { name: string; number: string; hours: string };

export type ReflectionQuestionsResult = {
  opening?: string;
  questions: string[];
  distress_override: boolean;
  helplines?: CrisisHelpline[];
  disclaimer: string;
  language: DhammaLanguage;
  tier: 'full_rag' | 'fallback';
};

/**
 * A synchronous crisis check for the reflection chat.
 *
 * The tailored-question and synthesis calls both check distress on the server
 * side, but a person's answers to the middle questions never reach the server
 * until the final synthesis. This lets the chat catch a distress signal in any
 * message the moment it is typed and surface verified helplines immediately,
 * rather than waiting for a round trip. Same keyword source as the engine, so
 * the two cannot disagree about what counts.
 */
export function distressGuard(
  text: string,
  language: DhammaLanguage,
): { message: string; helplines: CrisisHelpline[] } | null {
  if (!checkDistressTrigger(text)) return null;
  return {
    message:
      language === 'ne'
        ? 'यदि तपाईं गम्भीर पीडा वा आत्म-हानिको विचारमा हुनुहुन्छ भने, कृपया तुरुन्तै सहयोग सेवामा सम्पर्क गर्नुहोस्। तपाईं यो एक्लै बोक्नुपर्दैन।'
        : 'If you are in acute distress or having thoughts of self-harm, please reach out to support services right away. You do not have to carry this alone.',
    helplines: VERIFIED_NEPALI_HELPLINES,
  };
}

/**
 * Turns what the person shared into 3–4 tailored inquiry questions.
 *
 * Mirrors `ask`'s resilience: the API is preferred when configured, but any
 * failure falls back to the on-device engine rather than throwing — the venue
 * Wi-Fi case. On device (no API), the engine tailors the questions through a
 * provider when one is present and otherwise returns the deterministic
 * four-question scaffold, so this always resolves to a usable set.
 */
export async function reflectQuestions(request: {
  userInput: string;
  siteId?: string;
  language: DhammaLanguage;
}): Promise<ReflectionQuestionsResult> {
  const local = () =>
    generateReflectionQuestions({
      user_input: request.userInput,
      site_id: request.siteId,
      language: request.language,
    }) as Promise<ReflectionQuestionsResult>;

  if (!API_URL) return local();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/dhamma/reflect/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        user_input: request.userInput,
        site_id: request.siteId,
        language: request.language,
      }),
      signal: controller.signal,
    });
    const body = (await response.json().catch(() => null)) as ReflectionQuestionsResult | null;
    if (!response.ok || !body) throw new Error(`Reflection questions API returned ${response.status}`);
    return body;
  } catch (error) {
    console.warn('[dhamma] questions API unavailable; using on-device engine', error);
    return local();
  } finally {
    clearTimeout(timeout);
  }
}

export async function reflect(request: {
  stage: number;
  userInput?: string;
  answers: string[];
  siteId?: string;
  language: DhammaLanguage;
}): Promise<ReflectionApiResult> {
  // Reflection used to throw here without a backend, which made the whole
  // four-question companion unreachable for anyone not running mock-api — the
  // offline case, and the one Lumbini actually presents. core/dhamma has
  // implemented this the whole time.
  const local = async (): Promise<ReflectionApiResult> => {
    const result = await processReflectionAsync({
      stage: request.stage,
      user_input: request.userInput,
      answers: request.answers,
      site_id: request.siteId,
      language: request.language,
    });
    if (!result.distress_override && result.completed && result.passages?.length) {
      try {
        const localGuidance = await generateOfflineGroundedAnswer({
          question: request.answers.join('\n'),
          language: request.language,
          passages: result.passages,
        });
        if (localGuidance) return { ...result, inquiry: localGuidance, guidance: localGuidance };
      } catch (error) {
        console.warn('[dhamma] offline reflection model unavailable; keeping corpus guidance', error);
      }
    }
    return result;
  };

  if (!API_URL) return local();

  // Falls back rather than throwing, matching `ask` and `reflectQuestions`.
  // This was the one call in the trio that let a network failure escape, and it
  // is the *last* step of the conversation — so an unreachable backend produced
  // tailored questions, took all four answers, and then failed at the synthesis,
  // losing the reflection someone had just spent several minutes on. The engine
  // that would have answered was on the device the whole time.
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(`${API_URL}/dhamma/reflect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        stage: request.stage,
        user_input: request.userInput,
        answers: request.answers,
        site_id: request.siteId,
        language: request.language,
      }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => null) as ReflectionApiResult | null;
    if (!response.ok || !body) throw new Error(`Reflection API returned ${response.status}`);
    return body;
  } catch (error) {
    console.warn('[dhamma] reflect API unavailable; using on-device engine', error);
    return local();
  } finally {
    clearTimeout(timeout);
  }
}
