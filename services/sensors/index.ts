import { DeviceMotion, Magnetometer } from 'expo-sensors';

import { normalizeBearing } from '@/utils';

/**
 * Sensor service — heading and attitude.
 *
 * Two independent readings feed alignment:
 *   heading — where the device is pointed, from the magnetometer.
 *   pitch   — how it is tilted, from device motion.
 *
 * The magnetometer is noisy and, near iron structures, actively wrong. Every
 * reading is smoothed before it reaches the reticle, otherwise the lock
 * indicator flickers and the user cannot tell a real lock from jitter.
 */

export type Heading = {
  /** Degrees clockwise from magnetic north, 0–360. */
  degrees: number;
};

export type Attitude = {
  /** Degrees from level. Positive is nose-up. */
  pitch: number;
  /** Degrees of rotation about the viewing axis. */
  roll: number;
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

const HEADING_SMOOTHING = 0.15;
const PITCH_SMOOTHING = 0.2;

/**
 * Stream a smoothed compass heading. Returns an unsubscribe function that is
 * safe to call unconditionally.
 */
export function watchHeading(onHeading: (heading: Heading) => void, intervalMs = 100): () => void {
  let smoothed: number | null = null;

  Magnetometer.setUpdateInterval(intervalMs);
  const subscription = Magnetometer.addListener(({ x, y }) => {
    // atan2(y, x) gives the angle to magnetic north in the device plane.
    const raw = normalizeBearing((Math.atan2(y, x) * 180) / Math.PI);
    smoothed = smoothAngle(smoothed, raw, HEADING_SMOOTHING);
    onHeading({ degrees: smoothed });
  });

  return () => subscription.remove();
}

/** Stream a smoothed pitch and roll. */
export function watchAttitude(onAttitude: (attitude: Attitude) => void, intervalMs = 100): () => void {
  let pitch: number | null = null;
  let roll: number | null = null;

  DeviceMotion.setUpdateInterval(intervalMs);
  const subscription = DeviceMotion.addListener(({ rotation }) => {
    if (!rotation) return;
    const toDeg = 180 / Math.PI;
    pitch = smoothAngle(pitch, rotation.beta * toDeg, PITCH_SMOOTHING);
    roll = smoothAngle(roll, rotation.gamma * toDeg, PITCH_SMOOTHING);
    // Report in −180…180 so "level" reads as 0, not 360.
    onAttitude({
      pitch: pitch > 180 ? pitch - 360 : pitch,
      roll: roll > 180 ? roll - 360 : roll,
    });
  });

  return () => subscription.remove();
}

export async function isHeadingAvailable(): Promise<boolean> {
  try {
    return await Magnetometer.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function isAttitudeAvailable(): Promise<boolean> {
  try {
    return await DeviceMotion.isAvailableAsync();
  } catch {
    return false;
  }
}
