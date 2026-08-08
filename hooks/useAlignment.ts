import { useMemo } from 'react';

import { bearingDelta, bearingDegrees, distanceMeters } from '@/utils';
import type { AlignmentState, Coordinate, Vantage } from '@/types';

import { useCurrentPosition } from './useCurrentPosition';
import { useHeading, usePitch } from './useHeading';

/**
 * The alignment computation: how far is the observer from standing where the
 * vantage says to stand, pointed where it says to point.
 *
 * Three independent axes must all be satisfied before we report `locked`:
 *   position — within the vantage's metre tolerance
 *   bearing  — within its degree tolerance
 *   pitch    — within a fixed tilt tolerance
 *
 * `progress` is the worst of the three, not the average. A photograph taken
 * from the right spot at the wrong angle is not two-thirds comparable; it is
 * not comparable. The reticle should reflect that.
 */

/** Degrees of tilt error tolerated. Constant across vantages — it is a device limit, not a site one. */
const PITCH_TOLERANCE_DEG = 8;

/** Once a reading is this far out, `progress` sits at 0 rather than going negative. */
const POSITION_FLOOR_MULTIPLE = 8;
const BEARING_FLOOR_MULTIPLE = 8;

function axisProgress(error: number, tolerance: number, floorMultiple: number): number {
  if (tolerance <= 0) return 0;
  const ceiling = tolerance * floorMultiple;
  if (error <= tolerance) return 1;
  if (error >= ceiling) return 0;
  // Linear between "just outside tolerance" and "hopeless".
  return 1 - (error - tolerance) / (ceiling - tolerance);
}

export type AlignmentInput = {
  /** Null is allowed so a screen can call this before it has resolved a vantage. */
  vantage: Vantage | null | undefined;
  /** Pass false to release the sensors when the screen is not visible. */
  active?: boolean;
  /** Manual heading nudge offset in degrees for compass drift correction. */
  nudgeDeg?: number;
};

export function useAlignment({ vantage, active = true, nudgeDeg = 0 }: AlignmentInput): AlignmentState {
  const { coordinate } = useCurrentPosition({ watch: active, highAccuracy: true });
  const heading = useHeading(active, nudgeDeg);
  const pitch = usePitch(active);

  return useMemo(
    () => computeAlignment({ vantage, coordinate, heading, pitch, active }),
    [vantage, coordinate, heading, pitch, active],
  );
}

/**
 * Pure core, exported so it can be exercised without mounting a component or
 * standing in a field in Lumbini.
 */
export function computeAlignment(input: {
  vantage: Vantage | null | undefined;
  coordinate: Coordinate | null;
  heading: number | null;
  pitch: number | null;
  active?: boolean;
}): AlignmentState {
  const { vantage, coordinate, heading, pitch, active = true } = input;

  if (!active || !vantage) {
    return {
      phase: 'idle',
      progress: 0,
      bearingDeltaDeg: null,
      distanceM: null,
      pitchDeltaDeg: null,
    };
  }

  // Without GPS coordinate there is no position signal to align against.
  if (coordinate == null) {
    return {
      phase: 'unavailable',
      progress: 0,
      bearingDeltaDeg: null,
      distanceM: null,
      pitchDeltaDeg: null,
    };
  }

  const distanceM = distanceMeters(coordinate, vantage.coordinate);
  const targetBearing =
    distanceM > vantage.positionToleranceM
      ? bearingDegrees(coordinate, vantage.coordinate)
      : vantage.bearing;

  const bearingDeltaDeg = heading == null ? null : bearingDelta(heading, targetBearing);
  const pitchDeltaDeg = pitch == null ? null : vantage.pitch - pitch;

  const positionScore = axisProgress(distanceM, vantage.positionToleranceM, POSITION_FLOOR_MULTIPLE);
  const bearingScore =
    bearingDeltaDeg == null
      ? 0
      : axisProgress(
          Math.abs(bearingDeltaDeg),
          vantage.bearingToleranceDeg,
          BEARING_FLOOR_MULTIPLE,
        );
  // A missing pitch reading must not block a lock — it degrades to "assume level".
  const pitchScore =
    pitchDeltaDeg == null ? 1 : axisProgress(Math.abs(pitchDeltaDeg), PITCH_TOLERANCE_DEG, 6);

  const progress = Math.min(positionScore, bearingScore, pitchScore);
  const locked = progress >= 1;

  return {
    phase: locked ? 'locked' : 'seeking',
    progress,
    bearingDeltaDeg,
    distanceM,
    pitchDeltaDeg,
  };
}
