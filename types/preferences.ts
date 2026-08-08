/**
 * User preferences.
 *
 * §52 names "a large settings system" as a non-goal, and this is written to
 * stay under that line: seven values, each one changing behaviour a person can
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

export type UserPreferences = {
  alignmentTolerance: AlignmentTolerance;
  hapticsEnabled: boolean;
  /** Release the shutter automatically once alignment holds. */
  autoCapture: boolean;
  scriptPreference: ScriptPreference;
  distanceUnit: DistanceUnit;
  offlineSyncMode: OfflineSyncMode;
  photoQuality: PhotoQuality;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
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
