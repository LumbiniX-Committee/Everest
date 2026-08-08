/** Geographic point. Decimal degrees, WGS-84. */
export type Coordinate = {
  latitude: number;
  longitude: number;
};

/** How confident we are in a site's provenance. Shown, never hidden. */
export type SourceTier = 'archaeological' | 'documented' | 'community';

export type ConditionStatus = 'stable' | 'watch' | 'open' | 'resolved';

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
  summary: string;
  description: string;
  coordinate: Coordinate;
  /** Metres above sea level, where surveyed. */
  elevation?: number;
  sourceTier: SourceTier;
  /** Free-text provenance, e.g. "Lumbini Development Trust survey, 2019". */
  sourceNote?: string;
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
  /** Why this viewpoint was chosen. Shown before capture. */
  note?: string;
  /** Timestamp of the earliest observation in the series, if any. */
  seriesBegan?: string;
  /** Historical/reference image URI for dissolve slider and ghost overlay. */
  referenceUrl?: string;
  referenceLocal?: string;
};

/** A single recorded witness event at a vantage. */
export type Observation = {
  id: string;
  vantageId: string;
  siteId: string;
  /** ISO 8601, always UTC. */
  capturedAt: string;
  /** Local file URI of the photograph. */
  photoUri: string;
  coordinate: Coordinate;
  /** Bearing actually recorded at capture. */
  bearing: number;
  pitch: number;
  /** Metres between the observer and the vantage at capture. */
  positionErrorM: number;
  /** Degrees between recorded and target bearing at capture. */
  bearingErrorDeg: number;
  /** Observer's own note on what changed. */
  note?: string;
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
export type HistoricalImage = {
  id: string;
  siteId: string;
  /** The vantage this was shot from, where that is known. */
  vantageId?: string;
  /** Bundled asset (`require(...)`) or a remote/local URI. */
  image: number | string;
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

/** Where the reticle is in its alignment cycle. */
export type AlignmentPhase = 'idle' | 'seeking' | 'locked' | 'unavailable';

export type AlignmentState = {
  phase: AlignmentPhase;
  /** 0–1. How aligned the device is overall. Drives the reticle. */
  progress: number;
  /** Signed degrees to turn. Negative is left. */
  bearingDeltaDeg: number | null;
  /** Metres to the vantage. */
  distanceM: number | null;
  pitchDeltaDeg: number | null;
};
