/**
 * Provenance.
 *
 * One `Source` type serves the whole app — a pillar inscription cited by a
 * Dhamma answer and an excavation report cited by a site detail screen are the
 * same kind of object, and the reader should not have to learn two vocabularies
 * to check either one.
 *
 * That shared shape is the point. It is what lets `SourceCard` render on both
 * surfaces, and what keeps the app's central claim honest: nothing is asserted
 * without something the reader can go and verify.
 */

/**
 * What kind of evidence this is.
 *
 * Ordered loosely by directness — an inscription is a primary artefact, a
 * commentary is somebody's reading of one. The UI shows this so a reader can
 * weigh two citations that disagree.
 */
export type SourceKind =
  /** Excavation reports, site records, stratigraphy. */
  | 'archaeological'
  /** Text cut into stone or metal at the site. The most direct evidence. */
  | 'inscription'
  /** Canonical Pali or Sanskrit text. */
  | 'sutta'
  /** Later exegesis of a canonical text. */
  | 'commentary'
  /** Measured survey, conservation assessment, condition report. */
  | 'survey'
  /** A dated photograph — what Then / Now is built from. */
  | 'photograph'
  /** Institutional record: inscription lists, management plans. */
  | 'record';

export type Source = {
  id: string;
  kind: SourceKind;
  title: string;
  /** Author, translator, or institution. Never blank — anonymity is itself a fact. */
  attribution: string;
  /** Free-form: "249 BCE", "1896", "2019-03". Not parsed, only displayed. */
  date?: string;
  /** Page, plate, catalogue or inventory number. */
  reference?: string;
  /**
   * Where the reader can go next. Only set when it genuinely resolves — a dead
   * link is worse than no link on a screen whose whole job is verifiability.
   */
  url?: string;
  /**
   * Stated limitation. Contested readings, translation disputes, dating
   * uncertainty. Rendered prominently rather than buried, because a caveat the
   * reader does not see is not a caveat.
   */
  caveat?: string;
};

/**
 * A pointer from a claim to a source, optionally narrowing to a place within it.
 *
 * Kept separate from `Source` so the same source can be cited many times at
 * different loci without duplicating the record.
 */
export type Citation = {
  sourceId: string;
  /** "line 3", "plate XII", "p. 45". Shown after the source title. */
  locator?: string;
};

/** Human-readable label for each kind. Single definition, used by every badge. */
export const SOURCE_KIND_LABELS: Record<SourceKind, string> = {
  archaeological: 'Archaeology',
  inscription: 'Inscription',
  sutta: 'Sutta',
  commentary: 'Commentary',
  survey: 'Survey',
  photograph: 'Photograph',
  record: 'Record',
};
