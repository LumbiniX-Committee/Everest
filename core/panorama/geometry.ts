/**
 * Geometry for the 360° "Look around" view.
 *
 * Every angle here is a compass angle: degrees clockwise from true north.
 * A panorama is an equirectangular image; `u` runs 0→1 across it, left to
 * right, and `v` runs 0→1 down it. Turning right in the scene moves to a larger
 * `u`, so a panorama is placed in the world by one number, `northU`: the column
 * that faces true north.
 *
 * Framework-free so it can be tested under plain Node.
 */

const RAD = Math.PI / 180;

/** Wraps any angle into [0, 360). */
export function wrapDegrees(deg: number): number {
  const wrapped = deg % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

/** The signed turn from `from` to `to`, in (-180, 180]. */
export function angleDelta(from: number, to: number): number {
  const d = wrapDegrees(to - from);
  return d > 180 ? d - 360 : d;
}

/** The compass direction of an image column. */
export function azimuthAtU(u: number, northU: number): number {
  return wrapDegrees((u - northU) * 360);
}

/** The image column facing a compass direction, in [0, 1). */
export function uAtAzimuth(azimuth: number, northU: number): number {
  const u = (northU + wrapDegrees(azimuth) / 360) % 1;
  return u < 0 ? u + 1 : u;
}

/** Degrees above the horizon of an image row. Row 0.5 is the horizon. */
export function elevationAtV(v: number): number {
  return (0.5 - v) * 180;
}

export type LookDirection = {
  /** Where the back of the phone faces, clockwise from the sensor's north. */
  azimuth: number;
  /** Degrees above the horizon. */
  elevation: number;
};

/**
 * Where the phone's back camera faces, from a W3C-style device rotation
 * (alpha about the vertical, beta about the device's x, gamma about its y;
 * degrees). That is the frame expo-sensors' DeviceMotion reports.
 *
 * The direction is computed from the whole rotation rather than read off alpha,
 * because alpha alone is meaningless when the phone is held upright, which is
 * exactly how someone looks around: there the Euler angles hit gimbal lock and
 * alpha swings while the camera barely moves.
 *
 * The back camera is the device's -z axis. In the world frame x is east, y is
 * north and z is up.
 */
export function lookFromRotation(alpha: number, beta: number, gamma: number): LookDirection {
  const a = alpha * RAD;
  const b = beta * RAD;
  const g = gamma * RAD;
  const east = -Math.sin(g) * Math.cos(a) - Math.cos(g) * Math.sin(b) * Math.sin(a);
  const north = -Math.sin(g) * Math.sin(a) + Math.cos(g) * Math.sin(b) * Math.cos(a);
  const up = -Math.cos(g) * Math.cos(b);
  return {
    azimuth: wrapDegrees(Math.atan2(east, north) / RAD),
    elevation: Math.asin(Math.max(-1, Math.min(1, up))) / RAD,
  };
}

/**
 * Moves an angle a fraction of the way towards a target along the short arc,
 * so averaging 359° and 1° gives 0°, not 180°.
 */
export function easeAngle(current: number | null, target: number, fraction: number): number {
  if (current == null) return wrapDegrees(target);
  return wrapDegrees(current + angleDelta(current, target) * fraction);
}

/**
 * A compass reading is only a good reference for the camera direction while
 * the phone is held roughly upright; flat on a palm it reports where the top
 * edge faces, not where the camera looks.
 */
export function compassUsableAt(elevation: number): boolean {
  return Math.abs(elevation) <= 45;
}

/** Within this distance of where a panorama was taken, the scene matches it. */
export const ON_SITE_RADIUS_M = 250;
