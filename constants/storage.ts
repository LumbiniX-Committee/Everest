/**
 * Every persisted key in one place. Prefixed so a stray key is traceable, and
 * versioned so a breaking shape change can be migrated rather than guessed at.
 */
const PREFIX = 'sakshi.v1';

export const StorageKeys = {
  onboardingComplete: `${PREFIX}.onboarding.complete`,
  onboardingStage: `${PREFIX}.onboarding.stage`,
  permissionPrimerSeen: `${PREFIX}.permissions.primerSeen`,

  // Preferences. One key each rather than a single serialised blob: a value
  // added later then reads as absent and falls back to its default, instead of
  // failing to parse an older shape and losing every setting at once.
  prefAlignmentTolerance: `${PREFIX}.preferences.alignmentTolerance`,
  prefHapticsEnabled: `${PREFIX}.preferences.hapticsEnabled`,
  prefAutoCapture: `${PREFIX}.preferences.autoCapture`,
  prefScriptPreference: `${PREFIX}.preferences.scriptPreference`,
  prefDistanceUnit: `${PREFIX}.preferences.distanceUnit`,
  prefOfflineSyncMode: `${PREFIX}.preferences.offlineSyncMode`,
  prefPhotoQuality: `${PREFIX}.preferences.photoQuality`,
} as const;

/** Preference field → storage key. The settings screen iterates this. */
export const PreferenceKeys = {
  alignmentTolerance: StorageKeys.prefAlignmentTolerance,
  hapticsEnabled: StorageKeys.prefHapticsEnabled,
  autoCapture: StorageKeys.prefAutoCapture,
  scriptPreference: StorageKeys.prefScriptPreference,
  distanceUnit: StorageKeys.prefDistanceUnit,
  offlineSyncMode: StorageKeys.prefOfflineSyncMode,
  photoQuality: StorageKeys.prefPhotoQuality,
} as const;

export const DATABASE_NAME = 'sakshi.db';
