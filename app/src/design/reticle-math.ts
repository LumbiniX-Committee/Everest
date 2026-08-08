/**
 * app/src/design/reticle-math.ts — the reticle's pure geometry.
 *
 * Split out of Reticle.tsx (which imports react-native and so cannot be tested
 * until B's build lands) so the maths behind the signature element is verifiable
 * today. See reticle-math.test.ts.
 *
 * Source: 07-DESIGN-SYSTEM §4, 04-ARCHITECTURE §5.
 */

import { color } from './tokens.ts';

/** The alignment gate from 04 §5: brackets snap and cross to lapis here. */
export const ALIGN_LOCK_THRESHOLD = 0.75;

/**
 * How far each corner bracket sits from the frame edge, in px. Proportional to
 * `1 - align`, so the reticle physically closes as the shot comes right.
 */
export function bracketGap(align: number, maxGap: number): number {
  const a = align < 0 ? 0 : align > 1 ? 1 : align;
  return Math.round(maxGap * (1 - a));
}

/**
 * Amber (`seek`) while aligning, lapis (`lock`) once the gate opens. `lock`
 * appears nowhere else in the app — that is the whole point of it.
 */
export function reticleColor(align: number): string {
  return align >= ALIGN_LOCK_THRESHOLD ? color.lock : color.seek;
}
