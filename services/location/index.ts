import * as Location from 'expo-location';

import * as demoWalk from './demoWalk';
import { removeWatch, silenceWatchRemovalRejections } from './watchTeardown';

import type { Coordinate } from '@/types';

export * as demo from './demoWalk';

/** The Sacred Garden, between the temple and the pillar. Where the demo begins. */
export const LUMBINI_COORDINATE: Coordinate = {
  longitude: 83.27585,
  latitude: 27.46907,
};

/**
 * Demo mode: fixes come from a scripted walk instead of the GPS.
 *
 * Module state rather than a store, because `watchPosition` is called from
 * hooks, from the geofencing task and potentially from a headless context, and
 * all of them have to agree about which source is live. The switch is made in
 * one place — `watchPosition` below — so no screen has to know about it.
 */
let demoMode = false;
const demoListeners = new Set<() => void>();

export function isDemoMode(): boolean {
  return demoMode;
}

export function setDemoMode(active: boolean): void {
  if (demoMode === active) return;
  demoMode = active;
  if (active) {
    // Fresh from the gate each time it is switched on. Resuming a walk somebody
    // left halfway through a week ago is not a demonstration of anything.
    demoWalk.restart();
    demoWalk.start();
  } else {
    demoWalk.stop();
  }
  demoListeners.forEach((listener) => listener());
}

export function subscribeDemoMode(listener: () => void): () => void {
  demoListeners.add(listener);
  return () => {
    demoListeners.delete(listener);
  };
}

function demoFix(step: demoWalk.DemoStep): Fix {
  return {
    coordinate: step.coordinate,
    // What a phone reports under open sky, so anything keyed on accuracy sees a
    // plausible number rather than a suspiciously perfect one.
    accuracyM: 4.5,
    timestamp: Date.now(),
  };
}

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
  if (demoMode) {
    const step = demoWalk.currentStep();
    return step
      ? demoFix(step)
      : { coordinate: LUMBINI_COORDINATE, accuracyM: 4.5, timestamp: Date.now() };
  }

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

/** The real thing: expo-location's watch, wrapped in its own teardown. */
function watchDevice(onFix: (fix: Fix) => void, options: WatchOptions): () => void {
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

/**
 * Stream fixes. Returns an unsubscribe function that is safe to call even if
 * the subscription never started, so callers can use it directly as an effect
 * cleanup without null checks.
 *
 * This is the *only* place demo mode is honoured, and it is why the demo is
 * worth anything: a caller asks for positions and gets positions. It also
 * follows the switch — toggling demo mode mid-watch swaps the source under a
 * live subscription rather than requiring every screen to resubscribe, so the
 * map does not go blank for a second each time the button is pressed.
 */
export function watchPosition(
  onFix: (fix: Fix) => void,
  options: WatchOptions = {},
): () => void {
  let stopDevice: (() => void) | null = null;
  let stopDemo: (() => void) | null = null;

  const attach = () => {
    if (demoMode) {
      stopDevice?.();
      stopDevice = null;
      demoWalk.start();
      stopDemo ??= demoWalk.subscribe((step) => onFix(demoFix(step)));
    } else {
      stopDemo?.();
      stopDemo = null;
      stopDevice ??= watchDevice(onFix, options);
    }
  };

  attach();
  const unsubscribeToggle = subscribeDemoMode(attach);

  return () => {
    unsubscribeToggle();
    stopDevice?.();
    stopDemo?.();
  };
}
