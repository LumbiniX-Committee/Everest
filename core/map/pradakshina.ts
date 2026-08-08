/**
 * app/src/map/pradakshina.ts — clockwise circumambulation detection.
 *
 * Compute the signed angular sum of the pilgrim's bearing from the monument
 * centroid as they walk. Clockwise accumulates positive (this is why
 * shared/geo.ts::angleDiff must keep positive = clockwise). Completion needs a
 * near-full clockwise circuit with little backtracking.
 *
 * Direction matters — anticlockwise never completes, but it is NEVER a failure.
 * It returns { complete: false, teach: 'direction' } so the app can say why,
 * briefly and without lecturing (05-CONTENT-SPEC §5).
 *
 * Two thresholds are documented and they disagree: 05 §5 says ≥330° with ≤30°
 * reverse; A-MAP-AND-GAME 5.2 says ±350°. Reconciled in favour of the quest
 * definition (05 §5), with the alternative exposed as a named constant so the
 * choice is visible, not buried.
 */

import type { Coords } from '../../shared/types.ts';
import { bearing, angleDiff, haversine } from '../../shared/geo.ts';

/** 05-CONTENT-SPEC §5 — the shipped thresholds. */
export const PRADAKSHINA_MIN_DEG = 330;
export const PRADAKSHINA_MAX_REVERSE_DEG = 30;
/** A-MAP-AND-GAME 5.2 alternative, kept visible for the record. Not used. */
export const PRADAKSHINA_ALT_MIN_DEG = 350;
/** A track straying past this multiple of the radius is not circumambulating. */
export const STRAY_RADIUS_MULTIPLE = 2;

export type PradakshinaTeach = 'direction' | 'incomplete' | 'strayed';

export interface PradakshinaResult {
  complete: boolean;
  /** Net signed degrees. Positive = clockwise. */
  degrees: number;
  direction: 'clockwise' | 'anticlockwise' | 'none';
  /** Degrees travelled against the dominant direction. */
  reverse_deg: number;
  /** Present only when !complete — a gentle nudge, never a penalty. */
  teach?: PradakshinaTeach;
}

/**
 * Evaluate a whole track at once. (The live detector calls this on a sliding
 * buffer; evaluating the full track is the same maths and is what the tests use.)
 */
export function evaluatePradakshina(
  centroid: Coords,
  radiusM: number,
  track: Coords[],
): PradakshinaResult {
  if (track.length < 2) {
    return { complete: false, degrees: 0, direction: 'none', reverse_deg: 0, teach: 'incomplete' };
  }

  // Straying too far from the monument means this is not a circuit.
  const strayLimit = radiusM * STRAY_RADIUS_MULTIPLE;
  for (const p of track) {
    if (haversine(centroid, p) > strayLimit) {
      return { complete: false, degrees: 0, direction: 'none', reverse_deg: 0, teach: 'strayed' };
    }
  }

  let signed = 0;
  let cwTravel = 0;
  let ccwTravel = 0;
  let prev = bearing(centroid, track[0]);
  for (let i = 1; i < track.length; i++) {
    const b = bearing(centroid, track[i]);
    const delta = angleDiff(prev, b); // + = clockwise
    signed += delta;
    if (delta > 0) cwTravel += delta;
    else ccwTravel += -delta;
    prev = b;
  }

  const direction = signed > 0 ? 'clockwise' : signed < 0 ? 'anticlockwise' : 'none';
  const absTotal = Math.abs(signed);
  const reverse = direction === 'clockwise' ? ccwTravel : cwTravel;

  const result: PradakshinaResult = {
    complete: false,
    degrees: Math.round(signed),
    direction,
    reverse_deg: Math.round(reverse),
  };

  if (direction === 'anticlockwise') {
    // Went the wrong way. Not a failure — an instruction.
    result.teach = 'direction';
    return result;
  }
  if (absTotal >= PRADAKSHINA_MIN_DEG && reverse <= PRADAKSHINA_MAX_REVERSE_DEG) {
    result.complete = true;
    return result;
  }
  result.teach = 'incomplete';
  return result;
}
