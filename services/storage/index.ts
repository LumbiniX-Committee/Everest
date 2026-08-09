import AsyncStorage from '@react-native-async-storage/async-storage';

import { PreferenceKeys } from '@/constants';
import {
  ALIGNMENT_TOLERANCE_OPTIONS,
  DEFAULT_USER_PREFERENCES,
  DISTANCE_UNIT_OPTIONS,
  OFFLINE_SYNC_OPTIONS,
  PHOTO_QUALITY_OPTIONS,
  WISDOM_TIER_OPTIONS,
  SCRIPT_OPTIONS,
  type UserPreferences,
} from '@/types';

/**
 * Key–value storage for small preferences and flags.
 *
 * Observations and site data belong in SQLite (`services/database`); this is
 * only for things small enough to lose without consequence. Every method
 * swallows failures and returns a fallback — a corrupt preference must never
 * stop the app from launching.
 */

export async function getString(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setString(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Non-fatal by design.
  }
}

export async function getBoolean(key: string, fallback = false): Promise<boolean> {
  const raw = await getString(key);
  if (raw == null) return fallback;
  return raw === 'true';
}

export async function setBoolean(key: string, value: boolean): Promise<void> {
  await setString(key, value ? 'true' : 'false');
}

export async function getJSON<T>(key: string, fallback: T): Promise<T> {
  const raw = await getString(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function setJSON(key: string, value: unknown): Promise<void> {
  try {
    await setString(key, JSON.stringify(value));
  } catch {
    // Non-fatal by design.
  }
}

export async function remove(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    // Non-fatal by design.
  }
}

/* ------------------------------------------------------------------------- *
 * User preferences
 * ------------------------------------------------------------------------- */

/**
 * Reads every preference at once.
 *
 * Each value is validated against its allowed set rather than cast. A key can
 * hold anything — an older build's vocabulary, a half-written value, a manual
 * edit — and a bad one must degrade to its default rather than reach a screen
 * that will switch on it.
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const entries = await Promise.all(
    (Object.keys(PreferenceKeys) as (keyof UserPreferences)[]).map(
      async (field) => [field, await getString(PreferenceKeys[field])] as const,
    ),
  );

  const raw = Object.fromEntries(entries) as Record<keyof UserPreferences, string | null>;

  return {
    alignmentTolerance: oneOf(raw.alignmentTolerance, ALIGNMENT_TOLERANCE_OPTIONS, 'alignmentTolerance'),
    hapticsEnabled: bool(raw.hapticsEnabled, 'hapticsEnabled'),
    autoCapture: bool(raw.autoCapture, 'autoCapture'),
    scriptPreference: oneOf(raw.scriptPreference, SCRIPT_OPTIONS, 'scriptPreference'),
    distanceUnit: oneOf(raw.distanceUnit, DISTANCE_UNIT_OPTIONS, 'distanceUnit'),
    offlineSyncMode: oneOf(raw.offlineSyncMode, OFFLINE_SYNC_OPTIONS, 'offlineSyncMode'),
    photoQuality: oneOf(raw.photoQuality, PHOTO_QUALITY_OPTIONS, 'photoQuality'),
    wisdomTier: oneOf(raw.wisdomTier, WISDOM_TIER_OPTIONS, 'wisdomTier'),
  };
}

function oneOf<K extends keyof UserPreferences, V extends string>(
  raw: string | null,
  options: { value: V }[],
  field: K,
): UserPreferences[K] {
  const match = options.find((o) => o.value === raw);
  return (match ? match.value : DEFAULT_USER_PREFERENCES[field]) as UserPreferences[K];
}

function bool(raw: string | null, field: keyof UserPreferences): boolean {
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  return DEFAULT_USER_PREFERENCES[field] as boolean;
}

export async function setUserPreference<K extends keyof UserPreferences>(
  field: K,
  value: UserPreferences[K],
): Promise<void> {
  await setString(PreferenceKeys[field], String(value));
}

/**
 * Clears every preference key so the next read returns defaults.
 *
 * Deliberately removes rather than writing the defaults back: an absent key and
 * a key holding its default value then mean the same thing, and a later change
 * to a default reaches everyone who never chose otherwise.
 */
export async function resetUserPreferences(): Promise<void> {
  await Promise.all(Object.values(PreferenceKeys).map((key) => remove(key)));
}
