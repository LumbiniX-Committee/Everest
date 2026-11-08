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
  prefColorTheme: `${PREFIX}.preferences.colorTheme`,
  prefInterfaceLanguage: `${PREFIX}.preferences.interfaceLanguage`,
  prefAlignmentTolerance: `${PREFIX}.preferences.alignmentTolerance`,
  prefHapticsEnabled: `${PREFIX}.preferences.hapticsEnabled`,
  prefAutoCapture: `${PREFIX}.preferences.autoCapture`,
  prefScriptPreference: `${PREFIX}.preferences.scriptPreference`,
  prefDistanceUnit: `${PREFIX}.preferences.distanceUnit`,
  prefOfflineSyncMode: `${PREFIX}.preferences.offlineSyncMode`,
  prefPhotoQuality: `${PREFIX}.preferences.photoQuality`,
  prefWisdomTier: `${PREFIX}.preferences.wisdomTier`,
  prefAutoWisdom: `${PREFIX}.preferences.autoWisdom`,
  prefAutoNarration: `${PREFIX}.preferences.autoNarration`,
  prefVisitorType: `${PREFIX}.preferences.visitorType`,
  prefHomeHub: `${PREFIX}.preferences.homeHub`,

  /** The last Pro entitlement this phone confirmed with the server. */
  planEntitlement: `${PREFIX}.plan.entitlement`,
  /** The Home screen's getting-started guide has been dismissed. */
  homeGuideDismissed: `${PREFIX}.home.guideDismissed`,
  /** Crash reports kept on this phone until sent, or forever if sharing is off. */
  crashReports: `${PREFIX}.diagnostics.crashReports`,
  prefShareCrashReports: `${PREFIX}.preferences.shareCrashReports`,

  /**
   * Which sites have had their story sequence read through to the end, as a
   * JSON map of site id to ISO timestamp.
   *
   * Kept out of the merit ledger deliberately. The ledger records acts of
   * attention and is append-only; this is interface state — whether a place
   * still has an unread story to offer — and re-reading one is not a second act
   * worth recording.
   */
  storiesRead: `${PREFIX}.tirtha.storiesRead`,

  /**
   * When each precinct last produced an arrival notification, as a JSON map of
   * precinct id to ISO timestamp. Without this, walking the boundary of the
   * Sacred Garden re-notifies on every crossing.
   */
  arrivalsLastNotified: `${PREFIX}.arrivals.lastNotified`,

  /**
   * This installation's id — see services/device.
   *
   * The only key here without the version prefix, deliberately. The prefix
   * exists so a breaking change to a stored *shape* can be migrated; this value
   * has no shape, and its single useful property is that it never changes.
   * Bumping the prefix would silently re-identify every install and break the
   * grouping the id exists for, so it does not carry one.
   */
  deviceId: 'sakshi.device.id',

  /** Last public, redacted vantage-priority response for offline quest order. */
  coveragePriority: `${PREFIX}.tirtha.coveragePriority`,
  /** Google Map Tiles sessions, reused until they expire (about two weeks). */
  googleTileSessions: `${PREFIX}.map.googleTileSessions`,
  /** Offline map packs saved on the phone: which areas, how many tiles, when. */
  offlineMapPacks: `${PREFIX}.map.offlinePacks`,
  /** Last known custodian steps on the visitor's own reports, for offline viewing. */
  reportTimelines: `${PREFIX}.reports.timelines`,
} as const;

/** Preference field → storage key. The settings screen iterates this. */
export const PreferenceKeys = {
  colorTheme: StorageKeys.prefColorTheme,
  interfaceLanguage: StorageKeys.prefInterfaceLanguage,
  alignmentTolerance: StorageKeys.prefAlignmentTolerance,
  hapticsEnabled: StorageKeys.prefHapticsEnabled,
  autoCapture: StorageKeys.prefAutoCapture,
  scriptPreference: StorageKeys.prefScriptPreference,
  distanceUnit: StorageKeys.prefDistanceUnit,
  offlineSyncMode: StorageKeys.prefOfflineSyncMode,
  photoQuality: StorageKeys.prefPhotoQuality,
  wisdomTier: StorageKeys.prefWisdomTier,
  autoWisdom: StorageKeys.prefAutoWisdom,
  autoNarration: StorageKeys.prefAutoNarration,
  visitorType: StorageKeys.prefVisitorType,
  homeHub: StorageKeys.prefHomeHub,
  shareCrashReports: StorageKeys.prefShareCrashReports,
} as const;

export const DATABASE_NAME = 'sakshi.db';
