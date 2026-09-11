import { reloadAppAsync } from 'expo';
import * as Linking from 'expo-linking';

/** Reload the current bundle after a boot-time preference changes. */
export async function reload(reason: string): Promise<void> {
  await reloadAppAsync(reason);
}

/** Opens the authenticated web portal without putting its URL in a screen. */
export async function openCustodianPortal(): Promise<void> {
  const base = (process.env.EXPO_PUBLIC_PORTAL_URL ?? '').trim().replace(/\/$/, '');
  if (!base || base.includes('your-portal.example')) {
    throw new Error('Set EXPO_PUBLIC_PORTAL_URL to the deployed Sākṣī portal.');
  }
  await Linking.openURL(`${base}/custodian`);
}
