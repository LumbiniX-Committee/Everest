import { StorageKeys } from '@/constants';

import { getString, setString } from '../storage';

/**
 * A stable id for this installation.
 *
 * It exists so a series of observations can be grouped: "did the same device
 * record this vantage before?" is a reasonable question of a photographic
 * record, and without this the server cannot tell one contributor from a
 * hundred. See supabase/migrations/0004_device_identity.sql.
 *
 * What it is not:
 *
 *   * Not a person. A phone gets handed to a friend; a person carries two
 *     phones. This groups captures, it does not attribute them, and nothing in
 *     the UI should render it as "you".
 *   * Not authentication. It is sent as an ordinary column by a client holding
 *     the publishable key, so any value can be claimed. Nothing may be
 *     authorised on the strength of it.
 *   * Not permanent. Clearing app storage produces a new one. A person who
 *     reinstalls becomes a new device, and that is a limitation to state rather
 *     than paper over.
 */

const DEVICE_ID_KEY = StorageKeys.deviceId;

let pending: Promise<string> | null = null;

/**
 * A random UUID v4, generated without a native module.
 *
 * expo-crypto would be the better source, but adding it means a native build,
 * and a build cannot reach devices already running an over-the-air update —
 * the same constraint that shaped the image picker guard. `Math.random` is not
 * cryptographically strong and must never be used here for anything secret.
 *
 * That is acceptable precisely because this value is not a secret and grants
 * nothing. It needs to be unlikely to collide across installs, and 122 bits of
 * weak randomness is ample for that. If a future change gives this id any
 * authority, this function is the first thing that has to be replaced.
 */
function randomId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const value = Math.floor(Math.random() * 16);
    // Variant bits: 'y' must be one of 8, 9, a, b for a well-formed v4.
    const digit = char === 'x' ? value : (value & 0x3) | 0x8;
    return digit.toString(16);
  });
}

/**
 * Reads the id, generating and persisting one on first call.
 *
 * The in-flight promise is cached rather than the value, so two callers racing
 * at launch — a sync pass and a capture, say — cannot each generate an id and
 * leave the second overwriting the first. Whoever asks first wins, and both get
 * the same answer.
 */
export function getDeviceId(): Promise<string> {
  if (!pending) {
    pending = (async () => {
      const existing = await getString(DEVICE_ID_KEY);
      if (existing) return existing;

      const created = randomId();
      await setString(DEVICE_ID_KEY, created);
      return created;
    })().catch((error) => {
      // Let the next caller retry rather than caching a rejected promise, which
      // would leave every later sync attributing its rows to nothing.
      pending = null;
      throw error;
    });
  }
  return pending;
}

/**
 * The id if one has already been stored, else null — never generating one.
 *
 * For read-only callers (a diagnostics screen) that should not bring an
 * identity into existence merely by looking for it.
 */
export async function peekDeviceId(): Promise<string | null> {
  return getString(DEVICE_ID_KEY);
}
