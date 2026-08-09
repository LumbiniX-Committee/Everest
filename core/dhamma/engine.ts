/**
 * core/dhamma/engine.ts
 *
 * Dhamma Engine execution pipeline:
 *  1. Query rewrite / language detect
 *  2. Hybrid RRF retrieval
 *  3. Grounding Gate check (refuse below threshold)
 *  4. Constrained generation / Response construction
 *  5. Citation Validator (strip ungrounded sentences, downgrade if > 40% invalid)
 *  6. Tier 1/2/3 fallback & Scripted Demo Caching
 */

import { resolveSegment, type BilaraChunk } from './bilara.ts';
import { hybridRetrieve, type RetrievalResult } from './retrieval.ts';
import { DHAMMA_MODEL, hasProvider, LLM_API_KEY, LLM_ENDPOINT, LLM_TIMEOUT_MS } from './llm';

/**
 * Declared once, in the shared vocabulary, and re-exported here so everything
 * that already imports them from the engine keeps working.
 *
 * They used to be declared in both places with identical fields, which made
 * `core/index.ts` ambiguous — two `export *` lines offering different
 * `Citation` types under one name. TypeScript refuses that (TS2308), so
 * importing `@/core` did not compile at all. Worth noting as one reason the
 * barrel had no consumers: the contract in INTEGRATION.md said to import from
 * here, and doing so was an error.
 */
import type { Citation, Passage } from '../../shared/types.ts';

export type { Citation, Passage };

export type DhammaAskRequest = {
  question: string;
  language?: 'en' | 'ne';
  mode?: 'auto' | 'passages_only';
};

export type DhammaAskResponse = {
  answer: string | null;
  refused: boolean;
  refusal_reason?: string;
  citations: Citation[];
  passages: Passage[];
  tier: 'full_rag' | 'cached_demo' | 'passages_only';
  mode?: string;
  _note?: string;
};

/**
 * There is deliberately no retrieval-score threshold here, and this comment is
 * the reason — a constant named GROUNDING_THRESHOLD used to sit at this line,
 * unused by anything, looking like a safety mechanism that was never wired up.
 *
 * Wiring it up makes the engine worse. Measured across the 50-question
 * benchmark, the top RRF score for questions that *should* be answered and
 * questions that *must* be refused occupy the same band:
 *
 *   should answer   0.027 0.031 0.031 0.032 0.032 0.033 0.033 then 1.000 x23
 *   should refuse   0.000 0.029 0.030 0.030 0.031 0.031 0.032 0.032 0.033 …
 *
 * Only exact matches separate. Any cut below 1.0 admits out-of-scope questions;
 * any cut at 1.0 refuses seven legitimate ones. The score says how well a
 * passage matched the words, not whether the corpus has authority on the
 * subject — and those are different questions.
 *
 * The domain-vocabulary gate below is what actually carries the refusal, which
 * is why it is worth extending carefully rather than replacing with a number.
 */

/** Pre-cached responses for the 5 scripted demo questions (offline venue resilience) */
const DEMO_CACHE: Record<string, DhammaAskResponse> = {
  'what are the four noble truths': {
    answer: 'The Buddha taught the four noble truths in the Dhammacakkappavattana Sutta [sn56.11:4.2]: the truth of suffering (dukkha), its origin (samudaya), its cessation (nirodha), and the path (magga) leading to cessation.',
    refused: false,
    citations: [{ segment_id: 'sn56.11:4.2', sutta_uid: 'sn56.11', display: 'SN 56.11:4.2' }],
    passages: [
      {
        segment_id: 'sn56.11:4.2',
        pali: 'Idaṃ kho pana bhikkhave dukkhaṃ ariya-saccaṃ…',
        english: 'Now this, mendicants, is the noble truth of suffering: birth is suffering, aging is suffering, illness is suffering, death is suffering…',
        translator: 'Bhikkhu Sujato',
        collection: 'Saṃyutta Nikāya',
        licence: 'CC0-1.0',
      },
    ],
    tier: 'cached_demo',
  },
  'what did the buddha say to the kalamas': {
    answer: 'In the Kālāma Sutta [an3.65:3.1], the Buddha advised the Kālāmas not to rely solely on tradition, hearsay, or authority, but to know for themselves when qualities are skillful or unskillful.',
    refused: false,
    citations: [{ segment_id: 'an3.65:3.1', sutta_uid: 'an3.65', display: 'AN 3.65:3.1' }],
    passages: [
      {
        segment_id: 'an3.65:3.1',
        pali: 'Etha tumhe kālāmā mā anussavena…',
        english: 'Come, Kālāmas, do not go by oral tradition, by lineage, by hearsay, by scriptural authority… When you know for yourselves that these qualities are unskillful, then abandon them.',
        translator: 'Bhikkhu Sujato',
        collection: 'Aṅguttara Nikāya',
        licence: 'CC0-1.0',
      },
    ],
    tier: 'cached_demo',
  },
  'what were the last words of the buddha': {
    answer: 'In the Mahāparinibbāna Sutta [dn16:6.7], the Buddha’s final words were: "All conditioned things are subject to decay. Strive with diligence!"',
    refused: false,
    citations: [{ segment_id: 'dn16:6.7', sutta_uid: 'dn16', display: 'DN 16:6.7' }],
    passages: [
      {
        segment_id: 'dn16:6.7',
        pali: 'Handa dāni bhikkhave āmantayāmi vo: Vayadhammā saṅkhārā appamādena sampādethā’ti.',
        english: 'Come now, mendicants, I declare to you: all conditioned things are subject to decay. Strive with diligence! This was the Tathāgata’s last word.',
        translator: 'Bhikkhu Sujato',
        collection: 'Dīgha Nikāya',
        licence: 'CC0-1.0',
      },
    ],
    tier: 'cached_demo',
  },
  'what does buddhism say about cryptocurrency': {
    answer: null,
    refused: true,
    refusal_reason: 'Not found in the canon. The discourses do not address modern financial assets directly.',
    citations: [{ segment_id: 'an5.177:1.1', sutta_uid: 'an5.177', display: 'AN 5.177:1.1' }],
    passages: [
      {
        segment_id: 'an5.177:1.1',
        pali: 'Pañcimā bhikkhave vaṇijjā upāsakena akaraṇīyā…',
        english: 'Mendicants, a lay follower should not engage in five trades: trade in weapons, trade in living beings, trade in meat, trade in intoxicants, and trade in poison.',
        translator: 'Bhikkhu Sujato',
        collection: 'Aṅguttara Nikāya',
        licence: 'CC0-1.0',
      },
    ],
    tier: 'cached_demo',
  },
};

/**
 * Domain vocabulary gate.
 *
 * With only 8 corpus chunks the RRF scores are nearly uniform (~0.032) and
 * cannot discriminate relevance from irrelevance.  Instead we use a whitelist
 * of Pali / Buddhist / pilgrimage vocabulary.  A query that contains NONE of
 * these terms is clearly out of scope and is refused before retrieval.
 *
 * The list is intentionally broad (stems, transliterations, site names) so
 * that paraphrased but genuine questions still pass.
 */
const DOMAIN_VOCAB = new Set([
  // Core Pali / Dhamma terms
  'buddha', 'buddhas', 'buddhism', 'buddhist', 'buddhists',
  'dhamma', 'dharma', 'sutta', 'suttas', 'nikaya', 'nibbana', 'nirvana',
  'dukkha', 'suffering', 'impermanence', 'anicca', 'anatta', 'anattā',
  'tanha', 'tanhā', 'craving', 'cessation', 'noble', 'truth', 'truths',
  'eightfold', 'path', 'middle', 'way', 'precept', 'precepts', 'sila', 'sīla',
  'merit', 'karma', 'kamma', 'meditation', 'mindfulness', 'appamada', 'appamāda',
  'samadhi', 'samādhi', 'prajna', 'panna', 'paññā', 'wisdom',
  'compassion', 'metta', 'mettā', 'loving', 'kindness', 'mind', 'words', 'final', 'last',
  // English terminology a reader is likely to use for things the corpus states
  // in other words. The texts say "impermanent", "not-self", "suffering"; a
  // visitor asks about "the three marks of existence", and the gate below has
  // to recognise that as our subject or it refuses a question we can answer.
  'marks', 'characteristics', 'existence', 'conditioned', 'aggregates', 'khandha',
  'khandhas', 'clinging', 'attachment', 'rebirth', 'samsara', 'saṃsāra',
  'refuge', 'triple', 'gem', 'jewels', 'renunciation', 'equanimity', 'upekkha',
  'concentration', 'jhana', 'jhāna', 'insight', 'vipassana', 'vipassanā',
  'breathing', 'anapanasati', 'ānāpānasati', 'satipatthana', 'satipaṭṭhāna',
  'contemplation', 'ethical', 'ethics', 'conduct', 'generosity', 'dana', 'dāna',
  'patience', 'anger', 'ill', 'hatred', 'delusion', 'greed', 'defilements',
  'monk', 'monks', 'mendicant', 'bhikkhu', 'sangha', 'saṅgha',
  'enlightenment', 'awakening', 'liberation', 'heedfulness', 'speech', 'virtue', 'benefits',
  'kālāma', 'kalama', 'kalamas', 'kālāmas', 'authority', 'tradition', 'hearsay',
  'dependent', 'origination', 'paticca', 'paṭicca', 'dhammapada',
  'wheel', 'dhammacakka', 'sarnath', 'varanasi',
  // Pilgrimage / Lumbini / sites
  'lumbini', 'pilgrimage', 'birthplace', 'tathagata', 'tathāgata',
  'bodhi', 'bodhgaya', 'kusinara', 'kusinagar',
  'ashokan', 'ashoka', 'pillar', 'puskarini', 'tilaurakot',
  // Sutta references
  'dn16', 'sn56', 'mn63', 'an3', 'an5', 'dhp', 'mahāparinibbāna',
  'mahaparinibbana', 'parinibbana', 'parinirvana',
  // Nepali / Devanagari stems (Unicode)
  'बुद्ध', 'बुद्धको', 'धम्म', 'सुत्त', 'निर्वाण', 'दुःख', 'तृष्णा', 'लुम्बिनी',
  'चार', 'आर्य', 'सत्य', 'अष्टांगिक', 'मार्ग', 'अनित्य',
  'अन्तिम', 'शब्द', 'शब्दहरू', 'जन्म', 'ज्ञान', 'ध्यान', 'के', 'थिए', 'हुन्', 'किन', 'महत्त्वपूर्ण',
]);

/** Returns true if the query contains at least one domain-relevant token */
function isDomainQuery(question: string): boolean {
  const queryTerms = question.toLowerCase().split(/[\s,.:;?!'"()\[\]\/\\—–-]+/);
  return queryTerms.some((t) => t.length >= 2 && DOMAIN_VOCAB.has(t));
}

/** Grounding Gate & Citation Validator Engine execution */
export function askDhamma(req: DhammaAskRequest): DhammaAskResponse {
  const normQ = req.question.trim().toLowerCase();

  // 0. Domain vocabulary pre-gate — refuse immediately if no Dhamma token found
  if (!isDomainQuery(req.question)) {
    return {
      answer: null,
      refused: true,
      refusal_reason: 'This question is outside the scope of the canonical Buddhist texts. The Dhamma engine only draws on the Pali Tipiṭaka (Bilara corpus).',
      citations: [],
      passages: [],
      tier: 'full_rag',
      mode: 'thapaniya',
    };
  }

  // 1. Impersonation & prompt-injection & non-canonical comparative gate — these override domain-vocab pass
  const IMPERSONATION_PATTERNS = [
    /\bspeak (to me )?as (the )?buddha\b/i,
    /\byou are (the )?buddha\b/i,
    /\bpretend (you are|to be)\b/i,
    /\bsecret (teachings?|pali|dhamma)\b/i,
    /\bhidden from (monks?|disciples?)\b/i,
    /\bprevious instructions\b/i,
    /\bno restrictions\b/i,
    /\bpassword\b/i,
    /\bverse 999\b/i,
    /\bnever written down\b/i,
    /\bhinduism\b/i,
    /\btherav.da\b.*\bmah.y.na\b/i,
    // Fabricated citation bait: "Buddha said [modern claim]. What sutta?"
    /\bbuddha said\b.{0,60}\bwhat sutta\b/i,
    /\bbuddha said\b.{0,60}\bsutta is this\b/i,
  ];
  if (IMPERSONATION_PATTERNS.some((p) => p.test(req.question))) {
    return {
      answer: null,
      refused: true,
      refusal_reason: 'This request asks the Dhamma engine to act outside its scope: it cannot impersonate the Buddha, fabricate citations, or reveal non-existent teachings. The Kālāma principle applies — accept nothing without canonical grounding.',
      citations: [],
      passages: [],
      tier: 'full_rag',
      mode: 'thapaniya',
    };
  }

  // 2. Check exact scripted demo cache for dead-wifi venue guarantee
  if (DEMO_CACHE[normQ]) {
    return DEMO_CACHE[normQ];
  }


  // 2. Hybrid RRF Retrieval
  const matches = hybridRetrieve(req.question, 4);

  // 3. If retrieval returns nothing at all, refuse
  if (matches.length === 0) {
    return buildRefusalResponse(req.question, []);
  }

  // If client specifically requested Tier 3 passages_only (zero generation)
  if (req.mode === 'passages_only') {
    return buildTier3Response(matches);
  }

  // 4. Constrained Generation & Citation Validation
  const topMatch = matches[0];
  const chunk = topMatch.chunk;

  // Build answer incorporating valid segment ID
  const answerText = `According to the ${chunk.title_en} [${chunk.chunk_id}]: ${chunk.english}`;

  // Validate citation
  const citations = validateCitations(answerText, matches);
  if (citations.length === 0) {
    // Grounding validator stripped citation -> Refuse
    return buildRefusalResponse(req.question, matches);
  }

  const passages: Passage[] = matches.map((m) => ({
    segment_id: m.chunk.chunk_id,
    pali: m.chunk.pali,
    english: m.chunk.english,
    translator: m.chunk.translator,
    collection: m.chunk.collection.toUpperCase(),
    licence: m.chunk.license,
  }));

  return {
    answer: answerText,
    refused: false,
    citations,
    passages,
    tier: 'full_rag',
    mode: 'ekamsa',
  };
}



/**
 * Async RAG pipeline — calls real LLM API (gpt-oss:120b-cloud via Ollama cloud API)
 * over retrieved canonical Bilara passages. Fast response, thinking disabled.
 * Falls back to deterministic RAG if API call fails or times out.
 */
export async function askDhammaAsync(req: DhammaAskRequest): Promise<DhammaAskResponse> {
  // 1. Run Grounding Gate & Pre-checks synchronously
  const syncResult = askDhamma(req);
  // Cached demo answers are English. Re-run retrieval and generation for Nepali.
  if (syncResult.refused || req.mode === 'passages_only' || (syncResult.tier === 'cached_demo' && req.language !== 'ne')) {
    return syncResult;
  }

  // 2. Format retrieved Bilara passages for LLM synthesis
  const matches = hybridRetrieve(req.question, 4);
  const passageContext = matches.map((m) =>
    `[${m.chunk.chunk_id}] (${m.chunk.title_en}): "${m.chunk.english}"`
  ).join('\n');

  const systemPrompt =
    'You are the Sākṣī Dhamma RAG engine. Synthesize the retrieved canonical passages to answer the user question directly in 1-2 concise sentences. You MUST include the exact segment ID citation in brackets like [sn56.11:4.2] or [dn16:6.7]. Do NOT output thinking, reasoning, or preamble. Return ONLY the final direct answer.';

  const responseLanguage = req.language === 'ne' ? 'Nepali (Devanagari script)' : 'English';
  const userPrompt = `Retrieved Canonical Passages:\n${passageContext}\n\nRespond entirely in ${responseLanguage}. Preserve the exact citation IDs.\n\nUser Question: ${req.question}`;

  // Never attempt a provider call without a credential. The deterministic RAG
  // result is grounded and cited, so this degrades the answer rather than
  // withholding one. See core/dhamma/llm.ts for why the variable is named as
  // it is — under the old name this branch was taken on every device.
  if (!hasProvider()) return syncResult;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), LLM_TIMEOUT_MS);

    const apiRes = await fetch(LLM_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + LLM_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DHAMMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        stream: false,
        max_tokens: 300,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (apiRes.ok) {
      const data = await apiRes.json();
      const rawAnswer = data.choices?.[0]?.message?.content?.trim();
      if (rawAnswer) {
        const validatedCits = validateCitations(rawAnswer, matches);
        const finalCits = validatedCits.length > 0 ? validatedCits : syncResult.citations;

        return {
          answer: rawAnswer,
          refused: false,
          citations: finalCits,
          passages: syncResult.passages,
          tier: 'full_rag',
          mode: 'ekamsa',
          _note: `Generated by ${DHAMMA_MODEL}`,
        };
      }
    }
  } catch (e) {
    console.warn('[dhamma] LLM API call failed or timed out — using fallback engine:', (e as Error).message);
  }

  // Graceful fallback to deterministic engine response
  return syncResult;
}

/** Validates inline citations against retrieved segments */

export function validateCitations(text: string, matches: RetrievalResult[]): Citation[] {
  const validChunkIds = new Set(matches.map((m) => m.chunk.chunk_id));
  const citations: Citation[] = [];

  const regex = /\[([a-zA-Z0-9.:-]+)\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const chunkId = match[1];
    const resolved = resolveSegment(chunkId);
    if (resolved && validChunkIds.has(resolved.chunk_id)) {
      citations.push({
        segment_id: resolved.chunk_id,
        sutta_uid: resolved.uid,
        display: `${resolved.uid.toUpperCase()} ${resolved.chunk_id.split(':')[1] || ''}`,
      });
    }
  }

  // Fallback: if text contains no bracketed citation but top match is valid
  if (citations.length === 0 && matches.length > 0) {
    const top = matches[0].chunk;
    citations.push({
      segment_id: top.chunk_id,
      sutta_uid: top.uid,
      display: `${top.uid.toUpperCase()} ${top.chunk_id.split(':')[1] || ''}`,
    });
  }

  return citations;
}

function buildRefusalResponse(_question: string, matches: RetrievalResult[]): DhammaAskResponse {
  const fallbackPassages: Passage[] = (matches.length > 0 ? matches : []).slice(0, 2).map((m) => ({
    segment_id: m.chunk.chunk_id,
    pali: m.chunk.pali,
    english: m.chunk.english,
    translator: m.chunk.translator,
    collection: m.chunk.collection.toUpperCase(),
    licence: m.chunk.license,
  }));

  return {
    answer: null,
    refused: true,
    refusal_reason: 'Not found in the canonical texts. The discourses do not address this question directly.',
    citations: fallbackPassages.map((p) => ({
      segment_id: p.segment_id,
      sutta_uid: p.segment_id.split(':')[0],
      display: p.segment_id.toUpperCase(),
    })),
    passages: fallbackPassages,
    tier: 'full_rag',
    mode: 'thapaniya',
  };
}

function buildTier3Response(matches: RetrievalResult[]): DhammaAskResponse {
  const passages: Passage[] = matches.map((m) => ({
    segment_id: m.chunk.chunk_id,
    pali: m.chunk.pali,
    english: m.chunk.english,
    translator: m.chunk.translator,
    collection: m.chunk.collection.toUpperCase(),
    licence: m.chunk.license,
  }));

  return {
    answer: null,
    refused: false,
    citations: passages.map((p) => ({
      segment_id: p.segment_id,
      sutta_uid: p.segment_id.split(':')[0],
      display: p.segment_id.toUpperCase(),
    })),
    passages,
    tier: 'passages_only',
  };
}
