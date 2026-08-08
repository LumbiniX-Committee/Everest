/** Geographic point. Decimal degrees, WGS-84. */
export type Coordinate = {
  latitude: number;
  longitude: number;
};

/** How confident we are in a site's provenance. Shown, never hidden. */
export type SourceTier = 'archaeological' | 'documented' | 'community';

export type ConditionStatus = 'stable' | 'watch' | 'open' | 'resolved';

/** Which part of the property a site sits in (04-ARCHITECTURE schema). */
export type Zone = 'sacred_garden' | 'monastic_east' | 'monastic_west' | 'greater_lumbini';

/**
 * Whether photography is permitted at a site. Charter #8: capture is hard-disabled
 * where this is `restricted` or `prohibited`, inside the geofence.
 */
export type PhotographyPolicy = 'allowed' | 'restricted' | 'prohibited';

/** A labelled fact shown in the site detail's data table. */
export type SiteFact = { label: string; value: string };

/**
 * A heritage site in and around Lumbini — a temple, stupa, pillar, excavation,
 * or monastic zone plot.
 */
export type HeritageSite = {
  id: string;
  /** Latin-script name used throughout the UI. */
  name: string;
  /** Devanagari name, rendered in Anek where present. */
  nameNepali?: string;
  /** One line. Shown under the name in lists. */
  /** Pali name, where one exists (e.g. "Māyādevī"). */
  namePali?: string;
  summary: string;
  description: string;
  coordinate: Coordinate;
  /** Which zone of the property this site sits in. */
  zone?: Zone;
  /** Significance tier: 1 primary, 2 secondary, 3 contextual. */
  tier?: 1 | 2 | 3;
  /**
   * Geofence radius in metres — how close counts as "arrived" / "on site".
   * Per-site (20–60 m) rather than a global constant, so a pillar and a temple
   * complex don't share one radius. Feeds geofencing and the photography lockout.
   */
  radiusMeters?: number;
  /** Whether capture is permitted here. Charter #8. */
  photography?: PhotographyPolicy;
  /** Metres above sea level, where surveyed. */
  elevation?: number;
  /** Labelled facts for the site detail table. */
  facts?: SiteFact[];
  sourceTier: SourceTier;
  /**
   * Ids into the shared source registry, resolved with `resolveSources`.
   *
   * Ids rather than prose so the same artefact cited here and by a Dhamma
   * answer resolves to one record, and a correction lands in one place.
   */
  sourceIds?: string[];
  condition: ConditionStatus;
  /** Vantage point ids belonging to this site. */
  vantageIds: string[];
};

/**
 * A fixed photographic viewpoint. The whole premise of Sākṣī: return to this
 * exact spot, at this exact bearing, and the photographs become comparable.
 */
export type Vantage = {
  id: string;
  siteId: string;
  label: string;
  coordinate: Coordinate;
  /** Target compass bearing in degrees, 0–360, true north. */
  bearing: number;
  /** Target device pitch in degrees. 0 is level. */
  pitch: number;
  /** How close, in metres, the observer must stand. */
  positionToleranceM: number;
  /** How close, in degrees, the bearing must match. */
  bearingToleranceDeg: number;
  /** Horizontal field of view of the reference framing, in degrees. */
  hfovDeg?: number;
  /** Why this viewpoint was chosen. Shown before capture. */
  note?: string;
  /** Timestamp of the earliest observation in the series, if any. */
  seriesBegan?: string;
  /** Historical/reference image URI for dissolve slider and ghost overlay. */
  referenceUrl?: string;
  referenceLocal?: string;
};

/**
 * Whether the observer has said what they saw.
 *
 * `no-change` is a finding, not an absence of one. In condition monitoring a
 * dated photograph with "nothing has changed here" attached is evidence of
 * stability, and a series of them is how you establish that a site is holding.
 * Collapsing it into `unreviewed` would throw that away.
 */
export type ObservationAssessment =
  /** Recorded, but the observer has not yet said what they saw. */
  | 'unreviewed'
  /** Looked, and found nothing changed. A positive finding. */
  | 'no-change'
  /** Something was noticed; a condition report is attached. */
  | 'reported';

/** A single recorded witness event at a vantage. */
export type Observation = {
  id: string;
  vantageId: string;
  siteId: string;
  /** ISO 8601, always UTC. */
  capturedAt: string;
  /** Local file URI of the photograph. */
  photoUri: string;
  /** The observer's own GPS fix at capture — not the catalogued vantage point. */
  coordinate: Coordinate;
  /** Bearing actually recorded at capture. */
  bearing: number;
  pitch: number;
  /**
   * Metres between the observer and the vantage at capture. Null when there was
   * no position fix (a by-eye capture) — a missing signal is not zero error.
   */
  positionErrorM: number | null;
  /** Degrees between recorded and target bearing. Null on a by-eye capture. */
  bearingErrorDeg: number | null;
  /**
   * The weighted alignment score at the moment of capture (0–1), or null if
   * there was no signal. Persisted so "median align score 0.86 across N" is real.
   */
  alignScore?: number | null;
  /** GPS accuracy in metres at capture, or null when unknown. */
  gpsAccuracyM?: number | null;
  /**
   * How the shot was framed: `aligned` passed the tolerance gate; `manual` was
   * framed by eye with the gate bypassed. Never faked — a manual capture does
   * not claim to be comparable within tolerance.
   */
  gateMode?: 'aligned' | 'manual';
  /** Observer's own note on what changed. */
  note?: string;
  /** What the observer said about what they saw. */
  assessment: ObservationAssessment;
  /** False until the observation has left the device. */
  synced: boolean;
};

/**
 * A dated photograph of a site, used as the "then" half of Then / Now.
 *
 * `vantageId` is what makes a comparison honest rather than suggestive. An
 * image shot from an unknown position can sit beside a modern one and imply a
 * change that is really just a change of angle, so the UI states plainly when
 * the historical viewpoint is only approximate.
 */
/**
 * Evidence tier — Charter #6. Every plate declares one, and the UI shows it, so
 * a viewer can always tell a photograph from a reconstruction. The four tiers,
 * strongest to weakest:
 *   historical_photograph  — a real historical photo. Nothing generated.
 *   survey_drawing         — a measured plan/section/facsimile from a survey.
 *   conditioned_reconstruction — image-to-image, conditioned on a cited source.
 *   artistic_impression    — informed by evidence but not conditioned on an image.
 */
export type EvidenceTier =
  | 'historical_photograph'
  | 'survey_drawing'
  | 'conditioned_reconstruction'
  | 'artistic_impression';

export type HistoricalImage = {
  id: string;
  siteId: string;
  /** The vantage this was shot from, where that is known. */
  vantageId?: string;
  /**
   * Charter #6. Required for any image that is not a live capture — the label is
   * rendered on the comparison so a reconstruction is never read as a photograph.
   */
  evidenceTier?: EvidenceTier;
  /** Credit line shown with the image. */
  attribution?: string;
  /**
   * Bundled asset (`require(...)`) or a remote/local URI.
   *
   * Optional so the comparison can be built and reviewed before the archive
   * imagery is cleared. When absent the UI draws a labelled placeholder that
   * says so — it never dresses a stand-in up as a photograph, because a
   * comparison the reader cannot trust is worse than one that is honestly
   * incomplete.
   */
  image?: number | string;
  /** Free-form: "1899", "c. 1930", "March 1975". Displayed, not parsed. */
  date: string;
  /** ISO 8601 where the exact date is known, for ordering the series. */
  capturedAt?: string;
  caption: string;
  /** Required. A historical image without provenance is decoration. */
  sourceId: string;
  /**
   * False when the viewpoint is inferred rather than surveyed. Drives a visible
   * qualifier on the comparison — never hidden to make the pairing look better.
   */
  viewpointConfirmed: boolean;
};

/**
 * Where the reticle is in its alignment cycle.
 *
 * `manual` is the honest "match by eye" escape hatch (04-ARCHITECTURE §5, mandated
 * demo insurance): the gate is bypassed by the user, so it is NOT a lock and must
 * never be coloured lapis or recorded as a perfect measurement.
 */
export type AlignmentPhase = 'idle' | 'seeking' | 'locked' | 'manual' | 'unavailable';

export type AlignmentState = {
  phase: AlignmentPhase;
  /** 0–1. How aligned the device is overall. Drives the reticle. */
  progress: number;
  /**
   * The weighted alignment score (04-ARCHITECTURE §5) at this instant. Same
   * number that governs lock and that is persisted with a capture. In `manual`
   * mode this is still the real measured score (or 0 when there is no signal) —
   * never faked to 1.
   */
  alignScore: number;
  /** Reported GPS accuracy in metres, or null when unknown. */
  gpsAccuracyM: number | null;
  /** Signed degrees to turn. Negative is left. */
  bearingDeltaDeg: number | null;
  /** Metres to the vantage. */
  distanceM: number | null;
  pitchDeltaDeg: number | null;
};
