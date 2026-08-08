/**
 * Every persisted key in one place. Prefixed so a stray key is traceable, and
 * versioned so a breaking shape change can be migrated rather than guessed at.
 */
const PREFIX = 'sakshi.v1';

export const StorageKeys = {
  onboardingComplete: `${PREFIX}.onboarding.complete`,
  onboardingStage: `${PREFIX}.onboarding.stage`,
  permissionPrimerSeen: `${PREFIX}.permissions.primerSeen`,
} as const;

export const DATABASE_NAME = 'sakshi.db';
