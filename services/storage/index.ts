import AsyncStorage from '@react-native-async-storage/async-storage';

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
