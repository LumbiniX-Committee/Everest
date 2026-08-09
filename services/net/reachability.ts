import {
  decide,
  initialBreaker,
  onProbeFailure,
  onProbeSuccess,
  onRemoteFailure,
  type BreakerState,
} from '@/core/net/breaker';

/**
 * Is the knowledge API worth calling right now?
 *
 * Wraps the pure breaker in `core/net` with the two impure things it needs: a
 * clock and a `fetch`. This is the guard every remote AI call checks first, so
 * an unreachable server costs one short probe rather than one 30 second
 * synthesis timeout per question. See `core/net/breaker.ts` for the reasoning.
 *
 * The state is module-level on purpose. The breaker is a property of "this
 * device's link to that server right now", not of any one question, so all of
 * dhamma, guide and reflect share it: the first question that finds the server
 * down spares every question after it.
 */

let state: BreakerState = initialBreaker();

/**
 * A short timeout, deliberately far below the synthesis budget.
 *
 * `/health` returns a tiny JSON body, so a reachable server answers in well
 * under this even over a phone's mobile data. Anything slower is a stand-in for
 * "cannot be reached", which is exactly what we want to fail fast on.
 */
const PROBE_TIMEOUT_MS = 3000;

/**
 * Resolve true only when the server is reachable enough to be worth a real call.
 *
 * Never throws. A probe that times out or errors opens the breaker and returns
 * false, so the caller falls through to the on-device engine immediately.
 */
export async function apiReachable(apiUrl: string): Promise<boolean> {
  if (!apiUrl) return false;

  const verdict = decide(state, Date.now());
  if (verdict === 'online') return true;
  if (verdict === 'offline') return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`health ${response.status}`);
    state = onProbeSuccess(state, Date.now());
    return true;
  } catch {
    state = onProbeFailure(state, Date.now());
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Report that a real call failed after the probe said the server was up.
 *
 * The server died mid-session. This opens the breaker so the next question skips
 * the network rather than paying the full synthesis timeout to rediscover it.
 */
export function noteRemoteFailure(): void {
  state = onRemoteFailure(state, Date.now());
}

/** Reset the breaker. For tests and for a manual "try the server again" action. */
export function resetReachability(): void {
  state = initialBreaker();
}
