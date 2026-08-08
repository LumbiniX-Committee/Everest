/**
 * app/src/quests/stillness.ts — the q.stillness detector.
 *
 * Sit ten minutes at the Puskarini with the phone face down. Merit accrues while
 * the app is NOT being used — this is the quest that gets a reaction from the
 * judges (05-CONTENT-SPEC §5, A-MAP-AND-GAME 4.3).
 *
 * "Still" means all three at once: the screen is off, accelerometer variance is
 * below a threshold (the phone is set down, not in a pocket on a walk), and the
 * pilgrim is inside the geofence. Break any one and the held time resets — you
 * cannot bank stillness by walking away.
 *
 * DEBUG_SHORT_TIMERS collapses ten minutes to twenty seconds so it is demoable
 * on stage in under a minute. Flip it back before shipping.
 */

export const STILLNESS_MS = 10 * 60 * 1000;
export const STILLNESS_DEBUG_MS = 20 * 1000;
export const DEBUG_SHORT_TIMERS = false;

/** Accelerometer variance below this (in g²) counts as "set down and still". */
export const ACCEL_VARIANCE_THRESHOLD = 0.02;

export function stillnessTargetMs(debug: boolean = DEBUG_SHORT_TIMERS): number {
  return debug ? STILLNESS_DEBUG_MS : STILLNESS_MS;
}

export interface StillnessSample {
  screenOn: boolean;
  /** Recent accelerometer variance, g². */
  accelVariance: number;
  insideGeofence: boolean;
  nowMs: number;
}

export interface StillnessState {
  /** true while all conditions hold. */
  active: boolean;
  heldMs: number;
  complete: boolean;
}

export class StillnessTracker {
  private startedAt: number | null = null;
  private completed = false;
  private readonly targetMs: number;

  constructor(debug: boolean = DEBUG_SHORT_TIMERS) {
    this.targetMs = stillnessTargetMs(debug);
  }

  update(s: StillnessSample): StillnessState {
    const still = !s.screenOn && s.accelVariance <= ACCEL_VARIANCE_THRESHOLD && s.insideGeofence;

    if (!still) {
      this.startedAt = null; // any break resets the held time
      return { active: false, heldMs: 0, complete: this.completed };
    }

    if (this.startedAt == null) this.startedAt = s.nowMs;
    const heldMs = s.nowMs - this.startedAt;
    if (heldMs >= this.targetMs) this.completed = true;
    return { active: true, heldMs, complete: this.completed };
  }

  get isComplete(): boolean {
    return this.completed;
  }
}
