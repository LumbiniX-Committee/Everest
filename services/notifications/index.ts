import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

import { colors } from '@/theme';

/**
 * Local notifications only.
 *
 * Nothing here talks to a push service. An arrival is decided on the device,
 * from a geofence the device is already watching, so there is no server in the
 * loop and no push token to register.
 *
 * expo-notifications is loaded lazily rather than imported at the top of the
 * file. In Expo Go on Android the module *throws while evaluating* — push was
 * removed from Expo Go in SDK 53 — and because this file sits in the services
 * barrel, which the hooks barrel pulls in, which SurfaceTabBar imports, that
 * single throw took down every screen and filled the log with cascading
 * failures. A static import cannot be guarded after the fact; deferring the
 * require is what makes the guard reachable at all.
 */

const ARRIVAL_CHANNEL = 'arrivals';

/**
 * Expo Go cannot host this module, and web has no notification channels.
 *
 * Detected rather than assumed: `executionEnvironment` is `StoreClient` only
 * inside Expo Go, so a development build — which can host it — is unaffected.
 */
export const isSupported =
  Platform.OS !== 'web' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

type NotificationsModule = typeof import('expo-notifications');

let cached: NotificationsModule | null = null;

function load(): NotificationsModule | null {
  if (!isSupported) return null;
  if (cached) return cached;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('expo-notifications') as NotificationsModule;
    return cached;
  } catch {
    // A host that cannot provide the module is a reason to go quiet, not to
    // take the app down with it.
    return null;
  }
}

/**
 * Android requires a channel before any notification will display. Created at
 * startup rather than at send time, because the first arrival is exactly when
 * a missing channel would silently swallow the notification.
 */
export async function configure(): Promise<void> {
  const N = load();
  if (!N) return;

  try {
    N.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        // Deliberately silent. Someone standing in a temple precinct should not
        // have their phone chime; the banner is enough, and a sound here would
        // be the app intruding on the thing it is asking them to attend to.
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync(ARRIVAL_CHANNEL, {
        name: 'Arrivals',
        description: 'Shown once when you reach a precinct of the sacred site.',
        importance: N.AndroidImportance.DEFAULT,
        sound: null,
        vibrationPattern: [0, 120],
        lightColor: colors.sandstone,
      });
    }
  } catch (error) {
    console.warn('Failed to configure notifications:', error);
  }
}

export async function requestPermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  try {
    const existing = await N.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    return (await N.requestPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export async function hasPermission(): Promise<boolean> {
  const N = load();
  if (!N) return false;
  try {
    return (await N.getPermissionsAsync()).granted;
  } catch {
    return false;
  }
}

export type ArrivalNotification = {
  precinctId: string;
  title: string;
  body: string;
};

/**
 * Presents an arrival immediately.
 *
 * `trigger: null` fires now rather than scheduling — the geofence has already
 * decided the timing, and adding a delay on top of the OS's own 30 s–3 min
 * detection latency would put the notification well behind the person.
 */
export async function presentArrival({
  precinctId,
  title,
  body,
}: ArrivalNotification): Promise<void> {
  const N = load();
  if (!N) return;

  try {
    if (!(await hasPermission())) return;

    await N.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { precinctId, kind: 'arrival' },
        ...(Platform.OS === 'android' ? { channelId: ARRIVAL_CHANNEL } : {}),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('Failed to present arrival notification:', error);
  }
}

/** Clears delivered arrivals, so a stale banner cannot outlive the visit. */
export async function dismissArrivals(): Promise<void> {
  const N = load();
  if (!N) return;
  try {
    await N.dismissAllNotificationsAsync();
  } catch (error) {
    console.warn('Failed to dismiss notifications:', error);
  }
}
