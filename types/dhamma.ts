/**
 * Dhamma question and answer.
 *
 * The shape encodes the product rule from §25: an answer that cannot be
 * grounded is not softened, hedged, or padded out — it is a different kind of
 * result. `DhammaAnswer` is a discriminated union so that a screen cannot
 * accidentally render a refusal as though it were an answer, and cannot render
 * an answer without the citations that justify it.
 *
 * `grounded` carries a non-empty citation list by construction. There is no
 * valid state in this model where prose is shown without provenance.
 */

import type { Citation } from './source';

export type DhammaQuestion = {
  id: string;
  /** The question as the person actually typed it. Preserved verbatim. */
  text: string;
  /** ISO 8601, UTC. */
  askedAt: string;
};

/** Where a retrieval is in its cycle. Drives the §14 evidence-first UI. */
export type RetrievalPhase = 'idle' | 'retrieving' | 'answered' | 'refused' | 'failed';

/**
 * A passage the retrieval found, before it becomes an answer.
 *
 * Surfaced in the UI *while* retrieving. Showing the evidence being gathered,
 * rather than a typing animation, is the difference between §14's
 * question→evidence→answer→sources and a chatbot.
 */
export type Evidence = {
  citation: Citation;
  /** The retrieved passage. Quoted, never paraphrased at this stage. */
  passage: string;
  /** 0–1. Shown as a coarse indicator, never as a precise percentage. */
  relevance: number;
};

export type GroundedAnswer = {
  status: 'grounded';
  /** Direct, short, no embellishment. */
  text: string;
  /** Non-empty. An answer without citations does not ship. */
  citations: Citation[];
  evidence: Evidence[];
  /** Stated when scholarship is unsettled. Rendered with the answer, not after. */
  caveat?: string;
  /** Offered once the answer has been read. Optional to take up. */
  reflectionPrompt?: string;
};

/**
 * The refusal.
 *
 * A trust feature, not an error. It carries what was searched so the person can
 * see the refusal was the result of looking rather than of not trying, and it
 * offers somewhere to go next.
 */
export type RefusedAnswer = {
  status: 'refused';
  /** Plain first person. No apology, no hedging toward a half-answer. */
  text: string;
  /** Why the evidence was insufficient, in one sentence. */
  reason: string;
  /** Collections actually consulted. Shown so the refusal is auditable. */
  searched: string[];
  /** Adjacent material that does exist, when there is any. */
  related: Citation[];
  /** Questions the corpus can genuinely answer. */
  suggestions: string[];
};

export type DhammaAnswer = GroundedAnswer | RefusedAnswer;

/** Narrowing helper, so screens branch on one predicate rather than a string. */
export function isGrounded(answer: DhammaAnswer): answer is GroundedAnswer {
  return answer.status === 'grounded';
}

/**
 * A reflection the person wrote. Stays on device.
 *
 * Never uploaded, never analysed, never used to personalise anything. If that
 * changes, it needs saying out loud in the UI first.
 */
export type Reflection = {
  id: string;
  /** The prompt that occasioned it. */
  prompt: string;
  text: string;
  /** ISO 8601, UTC. */
  writtenAt: string;
};
