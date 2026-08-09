import * as Location from 'expo-location';

import { removeWatch, silenceWatchRemovalRejections } from './watchTeardown';

import type { Coordinate } from '@/types';

/**
 * Location service.
 *
 * Thin on purpose: it converts Expo's shape into our `Coordinate`, and it never
 * requests permission itself — that is `services/permissions`' job, called from
 * a screen that has already explained why.
 */

export type Fix = {
  coordinate: Coordinate;
  /** Metres of horizontal uncertainty, when the platform reports it. */
  accuracyM: number | null;
  /** Epoch milliseconds. */
  timestamp: number;
};

function toFix(position: Location.LocationObject): Fix {
  return {
    coordinate: {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    },
    accuracyM: position.coords.accuracy ?? null,
    timestamp: position.timestamp,
  };
}

/** A single fix. Returns null rather than throwing when location is refused. */
export async function getCurrentFix(): Promise<Fix | null> {
  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return toFix(position);
  } catch {
    return null;
  }
}

export type WatchOptions = {
  /** Minimum metres moved before a new fix is delivered. */
  distanceIntervalM?: number;
  /** Minimum milliseconds between fixes. */
  timeIntervalMs?: number;
  /** High accuracy costs battery — only worth it while aligning to a vantage. */
  highAccuracy?: boolean;
};

/**
 * Stream fixes. Returns an unsubscribe function that is safe to call even if
 * the subscription never started, so callers can use it directly as an effect
 * cleanup without null checks.
 */
export function watchPosition(
  onFix: (fix: Fix) => void,
  options: WatchOptions = {},
): () => void {
  let subscription: Location.LocationSubscription | null = null;
  let cancelled = false;

  // expo-location drops the promise from its own teardown call; this is the
  // only place that rejection can be caught. See watchTeardown.ts.
  silenceWatchRemovalRejections();

  Location.watchPositionAsync(
    {
      accuracy: options.highAccuracy ? Location.Accuracy.BestForNavigation : Location.Accuracy.Balanced,
      distanceInterval: options.distanceIntervalM ?? 2,
      timeInterval: options.timeIntervalMs ?? 1000,
    },
    (position) => onFix(toFix(position)),
  )
    .then((sub) => {
      // Cleanup ran before the watch finished starting: shut down the watch we
      // were just handed rather than leaking it.
      if (cancelled) {
        removeWatch(sub);
        return;
      }
      subscription = sub;
    })
    .catch(() => {
      // Permission refused or provider unavailable. Callers degrade on their own.
    });

  return () => {
    cancelled = true;
    removeWatch(subscription);
    subscription = null;
  };
}
