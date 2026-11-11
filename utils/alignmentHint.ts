import { meaningfulDistanceM } from '@/core';
import type { AlignmentState } from '@/types';

/**
 * Alignment hint generator.
 *
 * Produces a single plain-language instruction from the current alignment
 * state. The hint tells the observer exactly one thing to do next, in the
 * priority order: position → bearing → pitch → hold.
 *
 * These are instrument prompts, not encouragement. "Rotate left 8°" is
 * actionable; "You're almost there!" is not.
 */

const POSITION_THRESHOLD_M = 2;
const BEARING_THRESHOLD_DEG = 3;
const PITCH_THRESHOLD_DEG = 4;

export function alignmentHint(alignment: AlignmentState): string {
  if (alignment.phase === 'idle') return '';
  if (alignment.phase === 'unavailable') return 'Waiting for position and heading signal.';

  if (alignment.phase === 'locked') return 'Aligned. Record when the light is right.';

  const { distanceM, bearingDeltaDeg, pitchDeltaDeg } = alignment;

  // Position first — there is no point turning if you are standing in the wrong place.
  // Inside the GPS uncertainty a distance is noise, so it is never quoted.
  const away = distanceM == null ? null : meaningfulDistanceM(distanceM, alignment.gpsAccuracyM);
  if (away != null && distanceM != null && distanceM > (alignment.tolPosM ?? POSITION_THRESHOLD_M)) {
    if (away > 50) return `Walk about ${away} m toward the mark.`;
    return `Walk about ${away} m toward the mark, slowly.`;
  }

  // Bearing second
  if (bearingDeltaDeg != null && Math.abs(bearingDeltaDeg) > BEARING_THRESHOLD_DEG) {
    const direction = bearingDeltaDeg > 0 ? 'right' : 'left';
    const amount = Math.abs(Math.round(bearingDeltaDeg));
    if (amount > 30) {
      return `Turn ${direction}, about ${amount}°.`;
    }
    return `Rotate ${direction} ${amount}°.`;
  }

  // Pitch third
  if (pitchDeltaDeg != null && Math.abs(pitchDeltaDeg) > PITCH_THRESHOLD_DEG) {
    const direction = pitchDeltaDeg > 0 ? 'up' : 'down';
    return `Tilt ${direction} ${Math.abs(Math.round(pitchDeltaDeg))}°.`;
  }

  return 'Hold steady.';
}
