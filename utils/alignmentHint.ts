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

const POSITION_THRESHOLD_M = 1.5;
const BEARING_THRESHOLD_DEG = 3;
const PITCH_THRESHOLD_DEG = 4;

export function alignmentHint(alignment: AlignmentState): string {
  if (alignment.phase === 'idle') return '';
  if (alignment.phase === 'unavailable') return 'Waiting for position and heading signal.';

  if (alignment.phase === 'locked') return 'Aligned. Record when the light is right.';

  const { distanceM, bearingDeltaDeg, pitchDeltaDeg } = alignment;

  // Position first — there is no point turning if you are standing in the wrong place
  if (distanceM != null && distanceM > POSITION_THRESHOLD_M) {
    if (distanceM > 50) {
      return `Move ${Math.round(distanceM)} m closer to the vantage.`;
    }
    if (distanceM > 10) {
      return `Move about ${Math.round(distanceM)} m closer.`;
    }
    return `${distanceM.toFixed(1)} m away. Walk slowly toward the vantage.`;
  }

  // Bearing second
  if (bearingDeltaDeg != null && Math.abs(bearingDeltaDeg) > BEARING_THRESHOLD_DEG) {
    const direction = bearingDeltaDeg > 0 ? 'right' : 'left';
    const amount = Math.abs(Math.round(bearingDeltaDeg));
    if (amount > 30) {
      return `Turn ${direction} — about ${amount}°.`;
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
