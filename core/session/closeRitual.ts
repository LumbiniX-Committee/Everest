/**
 * app/src/session/closeRitual.ts — the moment the app closes itself.
 *
 * After twenty minutes of continuous use inside a sacred-zone geofence, the app
 * fades to a single line — "You came here to see this place. We'll be here when
 * you get back." — and one Close button (07-DESIGN-SYSTEM §7). It is the only
 * honest expression of the second noble truth a piece of software can make, and
 * the most memorable thirty seconds of the demo.
 *
 * "Continuous use inside a sacred zone" — leaving the zone resets the clock;
 * we are not nagging someone who put the app away. Debug-shortenable for stage.
 */

export const CLOSE_RITUAL_MS = 20 * 60 * 1000;
export const CLOSE_RITUAL_DEBUG_MS = 30 * 1000;

export function closeRitualTargetMs(debug = false): number {
  return debug ? CLOSE_RITUAL_DEBUG_MS : CLOSE_RITUAL_MS;
}

export interface SessionSample {
  /** In-app AND inside a sacred-zone geofence. */
  insideSacredZone: boolean;
  nowMs: number;
}

export interface SessionCloseState {
  shouldClose: boolean;
  elapsedMs: number;
}

export class SessionCloseTracker {
  private startedAt: number | null = null;
  private fired = false;
  private readonly targetMs: number;

  constructor(debug = false) {
    this.targetMs = closeRitualTargetMs(debug);
  }

  update(s: SessionSample): SessionCloseState {
    if (!s.insideSacredZone) {
      this.startedAt = null;
      return { shouldClose: false, elapsedMs: 0 };
    }
    if (this.startedAt == null) this.startedAt = s.nowMs;
    const elapsedMs = s.nowMs - this.startedAt;
    const shouldClose = !this.fired && elapsedMs >= this.targetMs;
    if (shouldClose) this.fired = true;
    return { shouldClose, elapsedMs };
  }

  /** Call when the user dismisses the card so it does not immediately re-fire. */
  reset(): void {
    this.startedAt = null;
    this.fired = false;
  }
}
