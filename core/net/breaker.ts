/**
 * A circuit breaker for the knowledge API, as a pure state machine.
 *
 * ── The problem this exists to solve ────────────────────────────────────────
 *
 * When the server is *unreachable* rather than *refusing* — venue wifi with
 * client isolation, a moved DHCP lease, a laptop asleep — `fetch` does not fail
 * fast. It hangs until the request's own `AbortController` fires, which for the
 * synthesis budget is 30 seconds (services/dhamma sets it deliberately long so a
 * slow *success* is never abandoned). Without a breaker, every question on stage
 * would stall for those 30 seconds before falling back to the on-device engine.
 * The audience watches a spinner, and the fallback that was supposed to be
 * invisible becomes the whole experience.
 *
 * ── What the breaker does ───────────────────────────────────────────────────
 *
 * The caller probes reachability cheaply (a short `GET /health`) instead of
 * discovering unreachability through a 30 second synthesis timeout. This state
 * machine decides *when* a probe is even worth attempting:
 *
 *   - `up` and still fresh   → go straight to the real call, skip the probe.
 *   - `down` and still open  → skip the network entirely, answer on device.
 *   - otherwise              → probe once, and let the result set the state.
 *
 * So the stall is bounded to a single short probe (~3 s worst case) on the first
 * question, after which an unreachable server costs nothing per question for the
 * length of the cooldown. A reachable one is re-probed only after its freshness
 * lapses, so the healthy path pays one tiny request, not one per question.
 *
 * Pure and time-injected so `npm run verify` covers the decision that protects
 * the demo. No fetch, no Date.now, no imports.
 */

/** How long a successful probe is trusted before the next one is worth doing. */
export const UP_TTL_MS = 15_000;

/**
 * How long the breaker stays open after a failure before a probe is retried.
 *
 * Shorter than a demo section, so a server that comes back (someone rejoins the
 * wifi, the laptop wakes) is picked up within a question or two, but long enough
 * that a genuinely absent server is not re-probed on every keystroke.
 */
export const OPEN_MS = 20_000;

export type BreakerStatus = 'unknown' | 'up' | 'down';

export type BreakerState = {
  status: BreakerStatus;
  /** While `up`: the epoch ms until which the "up" result is trusted. */
  freshUntil: number;
  /** While `down`: the epoch ms until which the network is skipped. */
  openUntil: number;
};

/** What the caller should do next. */
export type BreakerDecision =
  /** Skip the probe and make the real call; the server was recently reachable. */
  | 'online'
  /** Skip the network entirely; the breaker is open. Answer on device. */
  | 'offline'
  /** Reachability is unknown or stale; probe `/health` before committing. */
  | 'probe';

export function initialBreaker(): BreakerState {
  return { status: 'unknown', freshUntil: 0, openUntil: 0 };
}

/**
 * Decide, given the clock, whether to skip the network, trust a recent success,
 * or probe. Reads state only; never mutates.
 */
export function decide(state: BreakerState, now: number): BreakerDecision {
  if (state.status === 'up' && now < state.freshUntil) return 'online';
  if (state.status === 'down' && now < state.openUntil) return 'offline';
  return 'probe';
}

/** A probe reached the server: trust it for UP_TTL_MS. */
export function onProbeSuccess(_state: BreakerState, now: number): BreakerState {
  return { status: 'up', freshUntil: now + UP_TTL_MS, openUntil: 0 };
}

/** A probe could not reach the server: open the breaker for OPEN_MS. */
export function onProbeFailure(_state: BreakerState, now: number): BreakerState {
  return { status: 'down', freshUntil: 0, openUntil: now + OPEN_MS };
}

/**
 * A real call failed *after* the breaker thought the server was up (it died
 * mid-session). Open the breaker so the next question does not pay the full
 * synthesis timeout a second time.
 */
export function onRemoteFailure(_state: BreakerState, now: number): BreakerState {
  return { status: 'down', freshUntil: 0, openUntil: now + OPEN_MS };
}
