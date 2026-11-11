/**
 * A multi-day trekking route.
 *
 * Measured values are null when they could not be measured: a day whose trail
 * the router could not find has no distance, rather than a straight-line guess.
 */
export type TrekStopKind = 'trailhead' | 'village' | 'viewpoint' | 'pass' | 'monastery' | 'basecamp';

export type TrekStop = {
  id: string;
  name: string;
  kind: TrekStopKind;
  coordinate: { latitude: number; longitude: number };
  /** True when the position is OpenStreetMap's; false when it is the seed's rough one. */
  mapped: boolean;
  osmId: string | null;
  /** From a 90 m elevation model, not a survey. */
  elevationM: number | null;
  note: string;
};

export type TrekDay = {
  day: number;
  from: string | null;
  to: string | null;
  via: string[];
  /** A rest day spent at one place for acclimatisation. */
  rest: boolean;
  sleep: string | null;
  sleepElevationM: number | null;
  /** Height gained (or lost) since last night's bed. */
  sleepGainM: number | null;
  /** Sleeping above 3,000 m and more than 500 m higher than last night. */
  fastGain: boolean;
  distanceM: number | null;
  ascentM: number | null;
  descentM: number | null;
  highestM: number | null;
  /** Estimated walking hours, without breaks. */
  hours: number | null;
  note: string;
  /** [longitude, latitude] pairs along the trail. */
  line: [number, number][];
  /** Altitude every 120 m along the line. */
  profile: (number | null)[];
};

export type TrekPermit = {
  name: string;
  /** Rupees as published, or null where sources disagree. */
  feeNpr: { foreign?: number; saarc?: number; nepali?: number } | null;
  where: string;
  note: string;
};

export type Trek = {
  id: string;
  name: string;
  nameNepali: string;
  hub: 'lumbini' | 'kathmandu' | 'pokhara' | 'chitwan' | null;
  region: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
  summary: string;
  seasons: { best: string; avoid: string };
  access: { start: string; finish: string };
  permits: TrekPermit[];
  safety: string[];
  sources: { label: string; url: string }[];
  /** When the permit fees and rules were last checked. */
  checked: string;
  totals: {
    days: number;
    distanceM: number | null;
    ascentM: number | null;
    descentM: number | null;
    walkingHours: number | null;
    highest: { stopId: string; elevationM: number | null } | null;
  };
  stops: TrekStop[];
  days: TrekDay[];
};
