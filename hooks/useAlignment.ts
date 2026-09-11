import { useMemo } from 'react';

import { alignmentScore } from '@/core/alignment/score';
import { bearingDelta, bearingDegrees, distanceMeters } from '@/utils';
import type { AlignmentState, Coordinate, Vantage } from '@/types';

import { useCurrentPosition } from './useCurrentPosition';
import { useHeading, usePitch } from './useHeading';

/**
 * The alignment computation: how far is the observer from standing where the
 * vantage says to stand, pointed where it says to point.
 *
 * The scoring itself lives in `core/alignment/score.ts` (pure, unit-tested, the
 * spec's weighted 0.30·pos + 0.50·head + 0.20·pitch with a heading floor and a
 * GPS-accuracy gate). This hook only gathers live sensor input and hands it in,
 * so the number the reticle shows is exactly the number that governs lock and
 * that gets persisted with a capture.
 */

export type AlignmentInput = {
  /** Null is allowed so a screen can call this before it has resolved a vantage. */
  vantage: Vantage | null | undefined;
  /** Pass false to release the sensors when the screen is not visible. */
  active?: boolean;
  /** Manual heading nudge offset in degrees for compass drift correction. */
  nudgeDeg?: number;
};

export type AlignmentTelemetry = AlignmentState & {
  /** The same GPS fix used to calculate distance and lock. */
  coordinate: Coordinate | null;
  /** The same true-north heading used to calculate bearing error. */
  heading: number | null;
  /** The same device attitude used to calculate pitch error. */
  pitch: number | null;
};

export function useAlignment({
  vantage,
  active = true,
  nudgeDeg = 0,
}: AlignmentInput): AlignmentTelemetry {
  const { coordinate, accuracyM } = useCurrentPosition({ watch: active, highAccuracy: true });
  const heading = useHeading(active, nudgeDeg);
  const pitch = usePitch(active);

  return useMemo(
    () => ({
      ...computeAlignment({
        vantage,
        coordinate,
        gpsAccuracyM: accuracyM,
        heading,
        pitch,
        active,
      }),
      coordinate,
      heading,
      pitch,
    }),
    [vantage, coordinate, accuracyM, heading, pitch, active],
  );
}

/**
 * Pure core, exported so it can be exercised without mounting a component or
 * standing in a field in Lumbini.
 */
export function computeAlignment(input: {
  vantage: Vantage | null | undefined;
  coordinate: Coordinate | null;
  gpsAccuracyM: number | null;
  heading: number | null;
  pitch: number | null;
  active?: boolean;
}): AlignmentState {
  const { vantage, coordinate, gpsAccuracyM, heading, pitch, active = true } = input;

  if (!active || !vantage) {
    return {
      phase: 'idle',
      progress: 0,
      alignScore: 0,
      gpsAccuracyM,
      bearingDeltaDeg: null,
      distanceM: null,
      pitchDeltaDeg: null,
    };
  }

  // Without a position fix there is nothing to align against.
  if (coordinate == null) {
    return {
      phase: 'unavailable',
      progress: 0,
      alignScore: 0,
      gpsAccuracyM,
      bearingDeltaDeg: null,
      distanceM: null,
      pitchDeltaDeg: null,
    };
  }

  const distanceM = distanceMeters(coordinate, vantage.coordinate);
  // Far from the mark, steer toward the vantage; close in, match its fixed bearing.
  const targetBearing =
    distanceM > vantage.positionToleranceM
      ? bearingDegrees(coordinate, vantage.coordinate)
      : vantage.bearing;

  const bearingDeltaDeg = heading == null ? null : bearingDelta(heading, targetBearing);
  const pitchDeltaDeg = pitch == null ? null : vantage.pitch - pitch;

  const score = alignmentScore({
    distanceM,
    headingDeltaDeg: bearingDeltaDeg,
    pitchDeltaDeg,
    tolPosM: vantage.positionToleranceM,
    tolHeadingDeg: vantage.bearingToleranceDeg,
    gpsAccuracyM,
  });

  return {
    phase: score.canLock ? 'locked' : 'seeking',
    progress: score.align,
    alignScore: score.align,
    gpsAccuracyM,
    bearingDeltaDeg,
    distanceM,
    pitchDeltaDeg,
  };
}
