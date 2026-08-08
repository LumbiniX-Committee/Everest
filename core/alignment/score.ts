import { clamp01 } from '../../shared/geo.ts';

/**
 * The alignment score — 04-ARCHITECTURE §5.
 *
 * One number governs both the on-screen reticle and whether the shutter unlocks,
 * so there is only ever one truth about how well aligned a capture is. The pitch
 * claim "median align score 0.86 across N captures" is the same number the user
 * saw at the moment of capture.
 *
 *   align = 0.30·sPos + 0.50·sHead + 0.20·sPitch    (heading matters most)
 *
 * Lock requires align ≥ 0.75 AND a GPS fix good to ≤ 15 m AND a heading floor of
 * sHead ≥ 0.5. The heading floor is the honest part of "don't let a great GPS fix
 * lock a photo that faces the wrong way", without letting GPS — the noisiest
 * axis — veto an otherwise perfect alignment the way a strict min() would.
 */

export const WEIGHT_POS = 0.3;
export const WEIGHT_HEAD = 0.5;
export const WEIGHT_PITCH = 0.2;

export const ALIGN_LOCK_THRESHOLD = 0.75;
/** Heading must be at least half-satisfied before a lock is possible. */
export const HEADING_FLOOR = 0.5;
/** Device tilt tolerance, degrees. Constant — a device limit, not a site one. */
export const PITCH_TOLERANCE_DEG = 10;
/** A fix worse than this cannot be trusted to place the observer. */
export const MAX_GPS_ACCURACY_M = 15;

export type AlignmentScoreInput = {
  /** Metres from the vantage, or null when there is no position fix. */
  distanceM: number | null;
  /** Signed degrees between heading and target, or null when no compass. */
  headingDeltaDeg: number | null;
  /** Signed degrees between pitch and target, or null when no motion sensor. */
  pitchDeltaDeg: number | null;
  tolPosM: number;
  tolHeadingDeg: number;
  /** Reported GPS accuracy in metres, or null when unknown. */
  gpsAccuracyM: number | null;
};

export type AlignmentScore = {
  sPos: number;
  sHead: number;
  sPitch: number;
  /** Weighted 0–1. Persisted with every capture. */
  align: number;
  /** True only when every gate passes. */
  canLock: boolean;
  /** What is holding lock back, for the hint text. Null when locked. */
  blockedBy: 'position' | 'heading' | 'pitch' | 'gps' | null;
};

export function alignmentScore(input: AlignmentScoreInput): AlignmentScore {
  const { distanceM, headingDeltaDeg, pitchDeltaDeg, tolPosM, tolHeadingDeg, gpsAccuracyM } = input;

  // Missing position or heading scores 0 — they are required, not assumed.
  const sPos = distanceM == null || tolPosM <= 0 ? 0 : clamp01(1 - distanceM / tolPosM);
  const sHead =
    headingDeltaDeg == null || tolHeadingDeg <= 0
      ? 0
      : clamp01(1 - Math.abs(headingDeltaDeg) / tolHeadingDeg);
  // A missing pitch reading degrades to "assume level" rather than blocking.
  const sPitch =
    pitchDeltaDeg == null ? 1 : clamp01(1 - Math.abs(pitchDeltaDeg) / PITCH_TOLERANCE_DEG);

  const align = WEIGHT_POS * sPos + WEIGHT_HEAD * sHead + WEIGHT_PITCH * sPitch;

  // Gate order mirrors what the hint should tell the user to fix first.
  let blockedBy: AlignmentScore['blockedBy'] = null;
  if (gpsAccuracyM == null || gpsAccuracyM > MAX_GPS_ACCURACY_M) blockedBy = 'gps';
  else if (sHead < HEADING_FLOOR) blockedBy = 'heading';
  else if (align < ALIGN_LOCK_THRESHOLD) {
    // Name the weakest contributing axis.
    blockedBy = sPos <= sPitch && sPos <= sHead ? 'position' : sPitch < sHead ? 'pitch' : 'heading';
  }

  return { sPos, sHead, sPitch, align, canLock: blockedBy === null, blockedBy };
}
