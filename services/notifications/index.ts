import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { colors } from '@/theme';

/**
 * Local notifications only.
 *
 * Nothing here talks to a push service. An arrival is decided on the device,
 * from a geofence the device is already watching, so there is no server in the
 * loop and no push token to register.
 */

const ARRIVAL_CHANNEL = 'arrivals';

/**
 * Android requires a channel before any notification will display. Created at
 * startup rather than at send time, because the first arrival is exactly when
 * a missing channel would silently swallow the notification.
 */
export async function configure(): Promise<void> {
  Notifications.setNotificationHandler({
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
    await Notifications.setNotificationChannelAsync(ARRIVAL_CHANNEL, {
      name: 'Arrivals',
      description: 'Shown once when you reach a precinct of the sacred site.',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: null,
      vibrationPattern: [0, 120],
      lightColor: colors.sandstone,
    });
  }
}

export async function requestPermission(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  if (!existing.canAskAgain) return false;
  const next = await Notifications.requestPermissionsAsync();
  return next.granted;
}

export async function hasPermission(): Promise<boolean> {
  return (await Notifications.getPermissionsAsync()).granted;
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
  if (!(await hasPermission())) return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { precinctId, kind: 'arrival' },
      ...(Platform.OS === 'android' ? { channelId: ARRIVAL_CHANNEL } : {}),
    },
    trigger: null,
  });
}

/** Clears delivered arrivals, so a stale banner cannot outlive the visit. */
export async function dismissArrivals(): Promise<void> {
  await Notifications.dismissAllNotificationsAsync();
}
