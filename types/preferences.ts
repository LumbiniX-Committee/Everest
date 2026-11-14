/**
 * User preferences.
 *
 * §52 names "a large settings system" as a non-goal, and this is written to
 * stay under that line: each value changes behaviour a person can
 * observe. Nothing here is a toggle for its own sake, and nothing is stored
 * that the app does not read.
 *
 * These live in AsyncStorage rather than SQLite (§37) — they are small, and
 * losing one costs a default rather than a record.
 */

/**
 * How close the device must sit to a vantage before the reticle reports lock.
 *
 * Forgiving exists for a specific reason: on a crowded festival day you cannot
 * always stand exactly where the original photographer stood, and a survey
 * taken from slightly off-axis is worth more than one not taken at all.
 */
export type AlignmentTolerance = 'strict' | 'standard' | 'forgiving';

/** Diacritics are the default: the names are Pali and Sanskrit, not English. */
export type ScriptPreference = 'diacritics' | 'plain';

export type DistanceUnit = 'metric' | 'imperial';

/**
 * When queued observations are allowed to upload. `manual` is not a power-user
 * flag — data roaming near Lumbini is expensive, and a pilgrim on a day pass
 * may want to decide for themselves when a batch of photographs leaves.
 */
export type OfflineSyncMode = 'wifi' | 'any' | 'manual';

/** Higher quality costs storage on a device that may be offline for days. */
export type PhotoQuality = 'standard' | 'high';

/** The two complete visual systems that ship with the app. */
/** 'outdoor' is the morning palette at sunlight contrast. */
export type ColorTheme = 'navy' | 'white' | 'outdoor';
export type InterfaceLanguage = 'en' | 'ne';

/** Self-declared, and never checked against any document. Sets prices and entry fees shown. */
export type VisitorType = 'unset' | 'foreign' | 'nepali';

/** Where this person wants to start. */
export type HomeHub = 'unset' | 'near-me' | 'lumbini' | 'kathmandu' | 'pokhara' | 'chitwan';

/**
 * Who stands at your position on the live map.
 *
 * - walker: the scanned person with a walk cycle (downloaded once)
 * - monk: the robed figure built from simple shapes, no download
 * - dot: only the blue position dot and heading arrow; no 3D figure is drawn,
 *   which is also the lightest on the battery
 */
export type MapFigure = 'walker' | 'monk' | 'dot';

/**
 * How much a place is asked to say when you arrive at it.
 *
 * The tiers select depth over material that is already sourced — a summary, the
 * facts table, the timeline, the scholarly sources, the canonical passages the
 * site rests on. None of them generate new claims about a site, which is why
 * `high` can be exhaustive without being less true than `basic`.
 *
 * `custom` is the odd one and deliberately so: instead of a fixed depth it
 * hands the question back to the person, and answers it from the canonical
 * corpus scoped to where they are standing.
 */
export type WisdomTier = 'basic' | 'medium' | 'high' | 'custom';

export type UserPreferences = {
  colorTheme: ColorTheme;
  interfaceLanguage: InterfaceLanguage;
  alignmentTolerance: AlignmentTolerance;
  hapticsEnabled: boolean;
  /** Release the shutter automatically once alignment holds. */
  autoCapture: boolean;
  scriptPreference: ScriptPreference;
  distanceUnit: DistanceUnit;
  offlineSyncMode: OfflineSyncMode;
  photoQuality: PhotoQuality;
  wisdomTier: WisdomTier;
  /** Open what a place holds the moment you reach it, without being asked. */
  autoWisdom: boolean;
  /** Start the recorded narration when that opens. */
  autoNarration: boolean;
  visitorType: VisitorType;
  homeHub: HomeHub;
  /** Who stands at your position on the live map. */
  mapFigure: MapFigure;
  /** Off unless the visitor turns it on. */
  shareCrashReports: boolean;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  // White is the default daylight palette; navy is available from Settings
  // for a person who prefers it.
  colorTheme: 'white',
  interfaceLanguage: 'en',
  alignmentTolerance: 'standard',
  hapticsEnabled: true,
  // Off by default. An automatic shutter takes the decision away from the
  // person holding the camera, and the witness loop is about their attention.
  autoCapture: false,
  scriptPreference: 'diacritics',
  distanceUnit: 'metric',
  // Wi-Fi only, because the alternative spends someone's mobile data without
  // asking. A person who wants otherwise can say so.
  offlineSyncMode: 'wifi',
  photoQuality: 'standard',
  // Medium, not basic. Someone who has travelled to Lumbini did not come for a
  // caption, and a person who wants less can say so in one tap — whereas nobody
  // discovers depth they were never shown.
  wisdomTier: 'medium',
  // On. Someone walking a site with a phone in their pocket should not have to
  // know there was something to open; reaching the place is the gesture.
  autoWisdom: true,
  // Also on, but narrower than it looks: playback respects the silent switch
  // (see services/audio), so a phone silenced on the way into a shrine stays
  // silent and the text is still there to read. That is what makes an automatic
  // narration defensible in a place people come to be quiet in.
  autoNarration: true,
  visitorType: 'unset',
  homeHub: 'unset',
  mapFigure: 'walker',
  shareCrashReports: false,
};

/**
 * Option lists for the preference screen, kept beside the types so a new
 * variant cannot be added to one without the other going stale.
 */
export const ALIGNMENT_TOLERANCE_OPTIONS: {
  value: AlignmentTolerance;
  label: string;
  hint: string;
}[] = [
  { value: 'strict', label: 'Strict', hint: 'Lock only on a close match to the vantage.' },
  { value: 'standard', label: 'Standard', hint: 'The balance most surveys are taken at.' },
  { value: 'forgiving', label: 'Forgiving', hint: 'Lock sooner when the exact spot is unreachable.' },
];

export const INTERFACE_LANGUAGE_OPTIONS: {
  value: InterfaceLanguage;
  label: string;
  hint: string;
}[] = [
  { value: 'en', label: 'English', hint: 'Visitor controls and guidance in English.' },
  { value: 'ne', label: 'नेपाली', hint: 'आगन्तुकका नियन्त्रण र निर्देशन नेपालीमा।' },
];

export const SCRIPT_OPTIONS: { value: ScriptPreference; label: string; hint: string }[] = [
  { value: 'diacritics', label: 'Sākṣī', hint: 'Names written with their diacritics.' },
  { value: 'plain', label: 'Sakshi', hint: 'Plain Latin, for devices with missing glyphs.' },
];

export const DISTANCE_UNIT_OPTIONS: { value: DistanceUnit; label: string; hint: string }[] = [
  { value: 'metric', label: 'Metric', hint: 'Metres and kilometres.' },
  { value: 'imperial', label: 'Imperial', hint: 'Feet and miles.' },
];

export const OFFLINE_SYNC_OPTIONS: { value: OfflineSyncMode; label: string; hint: string }[] = [
  { value: 'wifi', label: 'Wi-Fi only', hint: 'Upload when a wireless network is available.' },
  { value: 'any', label: 'Any connection', hint: 'Upload over mobile data as well.' },
  { value: 'manual', label: 'Manual', hint: 'Nothing leaves the device until you say so.' },
];

export const PHOTO_QUALITY_OPTIONS: { value: PhotoQuality; label: string; hint: string }[] = [
  { value: 'standard', label: 'Standard', hint: 'Smaller files, faster to upload.' },
  { value: 'high', label: 'High', hint: 'More detail for condition assessment.' },
];

export const WISDOM_TIER_OPTIONS: { value: WisdomTier; label: string; hint: string }[] = [
  { value: 'basic', label: 'Glance', hint: 'About 30 seconds: what this place is and one thing worth knowing.' },
  { value: 'medium', label: 'Story', hint: 'A few minutes: the history, the key facts, and what happened when.' },
  { value: 'high', label: 'Scholar', hint: 'Everything, with the scholarly sources and the canonical passages.' },
  { value: 'custom', label: 'Ask your own', hint: 'Put your question to the canon, about the place you are standing in.' },
];

export const VISITOR_TYPE_OPTIONS: { value: VisitorType; label: string; hint: string }[] = [
  { value: 'foreign', label: 'Visiting from abroad', hint: 'Prices in US dollars, and foreign visitor entry fees.' },
  { value: 'nepali', label: 'Nepali', hint: 'Prices in rupees, and entry fees for Nepali visitors.' },
];

export const HOME_HUB_OPTIONS: { value: HomeHub; label: string; hint: string }[] = [
  { value: 'near-me', label: 'Near me', hint: 'Start from where you are now.' },
  { value: 'lumbini', label: 'Lumbini', hint: 'The birthplace of the Buddha.' },
  { value: 'kathmandu', label: 'Kathmandu Valley', hint: 'Durbar squares, stupas and temples.' },
  { value: 'pokhara', label: 'Pokhara', hint: 'Lakes, peace pagoda and mountain views.' },
  { value: 'chitwan', label: 'Chitwan', hint: 'National park and Tharu culture.' },
];

export const MAP_FIGURE_OPTIONS: { value: MapFigure; label: string; hint: string }[] = [
  { value: 'walker', label: 'Walker', hint: 'A realistic person who walks at your pace.' },
  { value: 'monk', label: 'Monk', hint: 'A robed figure, drawn without a download.' },
  { value: 'dot', label: 'Dot', hint: 'A simple blue dot. Lightest on the battery.' },
];
