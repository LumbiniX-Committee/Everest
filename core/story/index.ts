/**
 * core/story — a place's material, arranged as a sequence of beats.
 *
 * The game layer wants a guide who says one short thing, waits for NEXT, and
 * says the next one — a short sequence ending in a discovery. Composite places
 * may carry more chapters because collapsing eight monuments into one beat
 * would recreate the umbrella-story problem this module now solves. This builds that
 * sequence, and the whole design rests on one constraint: it invents nothing.
 * Every beat is a projection of material the app already holds and can cite —
 * the site record, its facts table, the narration in `seed/`, the canonical
 * passages `dhammaForSite` returns. A guide that improvised historical claims
 * about Lumbini would be the exact failure the Dhamma surface refuses, moved
 * to a screen where it looks friendlier.
 *
 * So this file has no prose of its own about any place. It decides *ordering*
 * and *shape*: which material becomes the opening, which becomes the turn, and
 * which is held back to be the discovery. Where a site lacks the material for a
 * beat, the beat is dropped rather than filled — brevity is earned by the
 * material rather than enforced by discarding authored monument chapters.
 *
 * Pure: no react, no data imports. The caller passes the material in, which is
 * what lets this be tested against a fixture and reused by any surface.
 */

export type StoryBeatKind =
  /** Where you are, and why it is a place at all. */
  | 'arrival'
  /** What happened here, from the record. */
  | 'history'
  /** The thing or person the place is organised around. */
  | 'detail'
  /** What the canon says, with its citation. */
  | 'wisdom'
  /** The closing turn — what you now hold that you did not. */
  | 'discovery';

export type StoryBeat = {
  kind: StoryBeatKind;
  /** Two or three words. A chapter mark, not a sentence. */
  eyebrow: string;
  /** The line the guide says. One idea. */
  body: string;
  /** Set on `wisdom` — the passage in its own language, shown above the gloss. */
  original?: string;
  /** Set on `wisdom` — the source id the citation resolves against. */
  sourceId?: string;
};

/** What a place can offer a sequence, in the shape `significanceOf` returns. */
export type StoryMaterial = {
  siteName: string;
  siteSummary?: string;
  narration?: string;
  facts: { label: string; value: string }[];
  story?: { title: string; eyebrow?: string; body: string }[];
  dhamma: { question?: string; answer: string; original?: string; citations?: { sourceId: string }[] }[];
};

/**
 * The first sentence of a passage, for a beat that has to fit on a card.
 *
 * Cuts on the sentence boundary rather than at a character count, because a
 * narration truncated mid-clause reads as broken rather than brief. Falls back
 * to the whole text when there is no boundary to cut on — a short line is not a
 * problem to solve.
 */
function firstSentence(text: string, max = 190): string {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;

  const window = trimmed.slice(0, max);
  const stop = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '), window.lastIndexOf('! '));
  if (stop > 60) return window.slice(0, stop + 1);

  const space = window.lastIndexOf(' ');
  return `${window.slice(0, space > 60 ? space : max)}…`;
}

/** The sentence after the first, so the history beat does not repeat the arrival. */
function secondSentence(text: string): string | null {
  const parts = text
    .trim()
    .split(/(?<=[.!?])\s+/)
    .filter((s) => s.trim().length > 0);
  if (parts.length < 2) return null;
  return firstSentence(parts.slice(1).join(' '));
}

/**
 * Build the sequence.
 *
 * Order is fixed — arrival, history, detail, wisdom, discovery — because it is
 * the shape of the thing: you stand somewhere, you learn what happened, you are
 * shown the object it turns on, you hear what the tradition made of it, and you
 * leave holding something. Beats with no material behind them are omitted, so a
 * thin site gives a short honest sequence rather than a padded one.
 */
export function buildStory(material: StoryMaterial): StoryBeat[] {
  const beats: StoryBeat[] = [];
  const { siteName, siteSummary, narration, facts, story = [], dhamma } = material;

  const opening = narration ?? siteSummary;
  if (opening) {
    beats.push({ kind: 'arrival', eyebrow: 'You have arrived', body: firstSentence(opening) });
  }

  if (story.length > 0) {
    // Composite places deserve more than one umbrella paragraph. Each authored
    // chapter becomes a stop in the guided sequence; nothing is improvised.
    story.forEach((chapter) => {
      beats.push({
        kind: 'history',
        eyebrow: chapter.eyebrow ?? chapter.title,
        body: firstSentence(chapter.body, 240),
      });
    });
  } else {
    // The history beat comes from the *rest* of the narration, which is where
    // the record actually is; the summary is a label and has no second sentence.
    const continuation = narration ? secondSentence(narration) : null;
    if (continuation) {
      beats.push({ kind: 'history', eyebrow: 'What happened here', body: continuation });
    }
  }

  // The facts table is already a list of the things a place turns on, written
  // as label and value. Two of them is a beat; the whole table is a document.
  const detail = facts.slice(0, 2);
  if (detail.length > 0) {
    beats.push({
      kind: 'detail',
      eyebrow: detail.length === 1 ? 'Look for' : 'Look for',
      body: detail.map((f) => `${f.label}: ${f.value}`).join('\n'),
    });
  }

  const passage = dhamma[0];
  if (passage) {
    beats.push({
      kind: 'wisdom',
      eyebrow: 'From the canon',
      body: firstSentence(passage.answer, 240),
      original: passage.original,
      sourceId: passage.citations?.[0]?.sourceId,
    });
  }

  // Always last, and always present when anything preceded it: the sequence has
  // to close, and closing is the moment the game marks as unlocked.
  if (beats.length > 0) {
    beats.push({
      kind: 'discovery',
      eyebrow: 'Wisdom unlocked',
      body: siteName,
    });
  }

  return beats;
}
