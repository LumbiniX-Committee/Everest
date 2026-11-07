/**
 * Making phone sensor readings fit for close-up guidance.
 *
 * A single GPS fix can jump several metres from the last one, and a phone compass
 * can be tens of degrees out until it is calibrated. Guiding someone onto a mark
 * a few metres wide needs both facts handled, not hidden.
 */
import { haversine } from '../../shared/geo.ts';

export type PositionEstimate = {
  latitude: number;
  longitude: number;
  /** One standard deviation of the estimate, in metres. */
  accuracyM: number;
  timestamp: number;
};

/** About a brisk walk. Sets how far the estimate may have moved between fixes. */
const WALKING_SPEED_MPS = 1.5;
/** Used when the phone reports no accuracy at all: assume a poor fix, not a perfect one. */
const UNKNOWN_ACCURACY_M = 25;
/** A jump this large is a new place, such as switching a demo walk, not noise to average away. */
const RESET_DISTANCE_M = 200;

/**
 * Blends a new GPS fix into the running estimate, weighted by how precise each is.
 *
 * A one-dimensional Kalman filter applied to latitude and longitude together: the
 * estimate's uncertainty grows with time at walking speed, then shrinks toward the
 * new fix in proportion to that fix's own reported accuracy. A precise fix moves
 * the estimate most of the way; a vague one barely moves it.
 */
export function smoothFix(
  previous: PositionEstimate | null,
  fix: { latitude: number; longitude: number; accuracyM: number | null; timestamp: number },
): PositionEstimate {
  const measured = fix.accuracyM ?? UNKNOWN_ACCURACY_M;
  if (!previous) return { latitude: fix.latitude, longitude: fix.longitude, accuracyM: measured, timestamp: fix.timestamp };

  const jump = haversine({ lat: previous.latitude, lon: previous.longitude }, { lat: fix.latitude, lon: fix.longitude });
  if (jump > RESET_DISTANCE_M) {
    return { latitude: fix.latitude, longitude: fix.longitude, accuracyM: measured, timestamp: fix.timestamp };
  }

  const dt = Math.max(0, (fix.timestamp - previous.timestamp) / 1000);
  const priorVariance = previous.accuracyM ** 2 + (WALKING_SPEED_MPS * dt) ** 2;
  const measurementVariance = measured ** 2;
  const gain = priorVariance / (priorVariance + measurementVariance);

  return {
    latitude: previous.latitude + gain * (fix.latitude - previous.latitude),
    longitude: previous.longitude + gain * (fix.longitude - previous.longitude),
    accuracyM: Math.sqrt((1 - gain) * priorVariance),
    timestamp: fix.timestamp,
  };
}

export type HeadingQuality = 'good' | 'fair' | 'poor';

/**
 * How far to trust the compass.
 *
 * iOS reports heading accuracy in degrees. Android reports a level from 0 (unreliable)
 * to 3 (high). Either way, an unknown accuracy is treated as fair, not good.
 */
export function headingQuality(accuracy: number | null | undefined, platform: 'ios' | 'android' | 'web'): HeadingQuality {
  if (accuracy == null || accuracy < 0) return 'fair';
  if (platform === 'android') return accuracy >= 3 ? 'good' : accuracy === 2 ? 'fair' : 'poor';
  return accuracy <= 10 ? 'good' : accuracy <= 25 ? 'fair' : 'poor';
}

/** A lock has to hold this long before it counts, so passing through one does not. */
export const LOCK_HOLD_MS = 800;
/** And it is kept through a brief wobble shorter than this. */
export const LOCK_RELEASE_MS = 500;

/**
 * The honest version of "how far to the mark".
 *
 * Inside the GPS uncertainty, a distance is noise: saying "0.8 m" when the fix is
 * good to ±6 m claims a precision nobody has. Returns null when the visitor is as
 * close as the readings can tell, otherwise whole metres.
 */
export function meaningfulDistanceM(distanceM: number, accuracyM: number | null): number | null {
  const floor = Math.max(2, accuracyM ?? 0);
  return distanceM <= floor ? null : Math.round(distanceM);
}
