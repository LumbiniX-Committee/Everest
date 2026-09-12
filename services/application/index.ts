import { reloadAppAsync } from 'expo';
import * as Linking from 'expo-linking';
import * as Updates from 'expo-updates';

/**
 * Reload the current bundle after a boot-time preference changes.
 *
 * `expo`'s `reloadAppAsync` calls `globalThis.expo?.reloadAppAsync` internally
 * — optional-chained, so on a build where that native bridge is not wired up
 * it silently resolves having done nothing at all. That is exactly the
 * "toggling the theme does nothing" failure this exists to catch: the
 * preference is already saved correctly (see `services/storage`) the moment
 * this is called, so a reload that quietly no-ops leaves someone staring at
 * an unchanged screen with no idea their choice took effect at all.
 *
 * Checked for explicitly rather than relied on, with `expo-updates` — a
 * longer-established reload path — tried second. Its own `reloadAsync`
 * rejects in Expo Go or dev mode by design, so it is only attempted outside
 * `__DEV__`. If neither path is available, this throws, so a caller can tell
 * the person to restart by hand instead of the change simply appearing to do
 * nothing.
 */
export async function reload(reason: string): Promise<void> {
  const bridge = (globalThis as { expo?: { reloadAppAsync?: unknown } }).expo;
  if (typeof bridge?.reloadAppAsync === 'function') {
    await reloadAppAsync(reason);
    return;
  }

  if (!__DEV__ && Updates.isEnabled) {
    await Updates.reloadAsync();
    return;
  }

  throw new Error('This build cannot reload itself automatically.');
}

/** Opens the authenticated web portal without putting its URL in a screen. */
export async function openCustodianPortal(): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_PORTAL_URL ?? '').trim().replace(/\/$/, '');
  if (!base || base.includes('your-portal.example')) {
    throw new Error('Set EXPO_PUBLIC_PORTAL_URL to the deployed Sākṣī portal.');
  }
  await Linking.openURL(`${base}/custodian`);
}
