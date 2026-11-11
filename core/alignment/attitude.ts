/**
 * Device attitude, expressed as the camera's angle above the horizon.
 *
 * Vantage pitch targets are camera elevations: a few degrees either side of
 * level. DeviceMotion's beta is not that. It reads 0° with the phone flat on a
 * table and 90° with it held upright, so comparing the two directly put every
 * upright phone about 90° off target and pitch could never contribute to a lock.
 */
export function cameraElevationDeg(betaDeg: number): number {
  return betaDeg - 90;
}
