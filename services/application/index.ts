import { reloadAppAsync } from 'expo';

/** Reload the current bundle after a boot-time preference changes. */
export async function reload(reason: string): Promise<void> {
  await reloadAppAsync(reason);
}
