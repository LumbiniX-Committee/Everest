import { DeviceMotion } from 'expo-sensors';
import * as Location from 'expo-location';

import { removeWatch, silenceWatchRemovalRejections } from '../location/watchTeardown';

import { normalizeBearing } from '@/utils';

/**
 * Sensor service — heading and attitude.
 *
 * Two independent readings feed alignment:
 *   heading — where the device is pointed, from expo-location's compass.
 *   pitch   — how it is tilted, from device motion.
 *
 * Heading comes from `Location.watchHeadingAsync`, which is tilt-compensated and
 * reports true north — not the raw magnetometer x/y, which in portrait (the app's
 * only posture) is not a compass heading at all. Magnetic declination at Lumbini
 * is under 1°, so no declination correction is applied; do not "fix" that.
 *
 * The reading is still jittery, so it is smoothed on the unit vector before it
 * reaches the reticle, otherwise the lock indicator flickers and the user cannot
 * tell a real lock from noise. Accuracy is reported so a poor compass can prompt
 * a calibration.
 */

export type Heading = {
  /** Degrees clockwise from true north, 0–360. */
  degrees: number;
  /**
   * Reported heading accuracy. iOS: degrees of uncertainty (lower is better).
   * Android: a 0–3 enum (3 is best). Null when the platform gives nothing.
   */
  accuracy: number | null;
};

export type Attitude = {
  /** Degrees from level. Positive is nose-up. */
  pitch: number;
  /** Degrees of rotation about the viewing axis. */
  roll: number;
};

type DeviceMotionData = {
  rotation?: {
    alpha?: number;
    beta: number;
    gamma: number;
  };
};

/**
 * Circular exponential smoothing. Averaging 359° and 1° must give 0°, not 180°,
 * so we smooth the unit vector rather than the angle.
 */
function smoothAngle(previous: number | null, next: number, alpha: number): number {
  if (previous == null) return next;
  const toRad = Math.PI / 180;
  const px = Math.cos(previous * toRad);
  const py = Math.sin(previous * toRad);
  const nx = Math.cos(next * toRad);
  const ny = Math.sin(next * toRad);
  const x = px + (nx - px) * alpha;
  const y = py + (ny - py) * alpha;
  return normalizeBearing((Math.atan2(y, x) * 180) / Math.PI);
}

// Input from watchHeadingAsync is already platform-filtered and tilt-compensated,
// so smoothing can be lighter than the raw-magnetometer path needed. Tune on device.
const HEADING_SMOOTHING = 0.3;
const PITCH_SMOOTHING = 0.2;

/**
 * Stream a smoothed true-north heading from expo-location. Returns an
 * unsubscribe that is safe to call before the subscription resolves.
 */
export function watchHeading(onHeading: (heading: Heading) => void): () => void {
  let smoothed: number | null = null;
  let subscription: Location.LocationSubscription | null = null;
  let cancelled = false;

  // Heading watches tear down through the same expo-location subscriber as
  // position watches, so they raise the same unhandled rejection.
  silenceWatchRemovalRejections();

  Location.watchHeadingAsync((data) => {
    // trueHeading is -1 when unavailable; fall back to magnetic north.
    const source = data.trueHeading >= 0 ? data.trueHeading : data.magHeading;
    const raw = normalizeBearing(source);
    smoothed = smoothAngle(smoothed, raw, HEADING_SMOOTHING);
    onHeading({ degrees: smoothed, accuracy: data.accuracy ?? null });
  })
    .then((sub) => {
      if (cancelled) {
        removeWatch(sub);
        return;
      }
      subscription = sub;
    })
    .catch((err) => {
      console.warn('[sensors] watchHeading unavailable:', err);
    });

  return () => {
    cancelled = true;
    removeWatch(subscription);
    subscription = null;
  };
}

/** Stream a smoothed pitch and roll. Safe on all platforms (web fallback). */
export function watchAttitude(onAttitude: (attitude: Attitude) => void, intervalMs = 100): () => void {
  let pitch: number | null = null;
  let roll: number | null = null;

  try {
    if (typeof DeviceMotion?.addListener !== 'function') {
      return () => {};
    }

    DeviceMotion.setUpdateInterval?.(intervalMs);
    const subscription = DeviceMotion.addListener(({ rotation }: DeviceMotionData) => {
      if (!rotation) return;
      const toDeg = 180 / Math.PI;
      pitch = smoothAngle(pitch, rotation.beta * toDeg, PITCH_SMOOTHING);
      roll = smoothAngle(roll, rotation.gamma * toDeg, PITCH_SMOOTHING);
      onAttitude({
        pitch: pitch > 180 ? pitch - 360 : pitch,
        roll: roll > 180 ? roll - 360 : roll,
      });
    });

    return () => subscription?.remove?.();
  } catch (err) {
    console.warn('[sensors] watchAttitude unavailable on this platform:', err);
    return () => {};
  }
}

export async function isHeadingAvailable(): Promise<boolean> {
  try {
    if (typeof Location?.watchHeadingAsync !== 'function') return false;
    // The compass needs location services enabled to report true north.
    return await Location.hasServicesEnabledAsync();
  } catch {
    return false;
  }
}

export async function isAttitudeAvailable(): Promise<boolean> {
  try {
    if (typeof DeviceMotion?.isAvailableAsync !== 'function') return false;
    return await DeviceMotion.isAvailableAsync();
  } catch {
    return false;
  }
}
