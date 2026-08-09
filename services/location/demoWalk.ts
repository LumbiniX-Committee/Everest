import { demoPrecincts, demoSites } from '@/data';
import { bearingDegrees, distanceMeters } from '@/utils';
import type { Coordinate } from '@/types';

/**
 * A pilgrim walking Lumbini, for a device that is not in Lumbini.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * Demo mode used to be one coordinate: the app was told it was standing in the
 * middle of the Sacred Garden and left there. That is enough to prove a screen
 * renders, and it proves nothing at all about the app, because everything
 * interesting here is a *transition*. Arrival fires on entering a radius.
 * Wisdom unlocks on arrival. The re-arm margin only matters once you have left.
 * Pradakṣiṇā is by definition a path. A stationary pin exercises none of it.
 *
 * So this walks. It produces the same `Fix` shape `expo-location` does, at the
 * same cadence, and `services/location` hands it to callers through the same
 * `watchPosition` they already use — which means nothing downstream knows or
 * cares that the walk is synthetic. Geofencing, arrival announcements, the
 * nearest-site readout, merit, the map figure and its trail all respond because
 * they are responding to position, exactly as they will on site.
 *
 * ── What it is not ──────────────────────────────────────────────────────────
 *
 * Not a mock and not a fixture. It never stands in for a service, never returns
 * a canned answer, and nothing branches on it beyond the one switch in
 * `watchPosition`. If a screen misbehaves during the demo walk, it will
 * misbehave in the Sacred Garden.
 */

/** Comfortable walking pace on level ground. */
const WALK_MPS = 1.35;

/**
 * How much faster than life the demo runs.
 *
 * Lumbini's Sacred Garden to the Eternal Flame is a real half-kilometre, which
 * is seven minutes of watching a dot at true pace. Three times over covers the
 * ground in a length someone will actually sit through, and the *order* and
 * *proportion* of events — which is what the demo is for — are untouched by it.
 */
const PACE = 3;

/** One synthetic fix per tick. Close to what a phone delivers while walking. */
export const DEMO_TICK_MS = 600;

/** Metres of ground covered between two consecutive fixes. */
const METRES_PER_TICK = WALK_MPS * PACE * (DEMO_TICK_MS / 1000);

/** Ticks spent standing at a site. Long enough to read what arrival put up. */
const PAUSE_TICKS = 12;

/** Radius of the circumambulation walked around the Maya Devi Temple. */
const CIRCUIT_RADIUS_M = 20;

/**
 * Horizontal noise, in metres, added to every fix.
 *
 * Deliberately present rather than a clean line. A perfect track never crosses
 * a geofence boundary twice, so it never exercises the hysteresis and re-arm
 * margins that exist precisely because real GPS does. Small enough not to break
 * a circuit, large enough to be honest about what the sensor gives you.
 */
const JITTER_M = 0.9;

export type DemoActivity =
  | { kind: 'walking'; towardsSiteId: string }
  | { kind: 'pausing'; atSiteId: string }
  | { kind: 'circling'; aroundSiteId: string; degrees: number };

export type DemoStep = {
  coordinate: Coordinate;
  /** Degrees from true north, in the direction of travel. */
  headingDeg: number;
  /** Ground speed at this fix. Zero while standing. */
  speedMps: number;
  activity: DemoActivity;
  /** Index into the itinerary, and its length — the walk's own progress bar. */
  index: number;
  total: number;
};

/**
 * The itinerary, in the order a first-time pilgrim actually walks it.
 *
 * South gate to the pond, the pond to the temple, a clockwise circuit of the
 * birthplace, the pillar, the vihāra remains, then north up the central canal
 * to the East Monastic Zone. It returns to the pond so the demo can loop
 * without teleporting, and so a second pass demonstrates the arrival cooldown
 * rather than re-announcing everything.
 *
 * The ids are the ones in `data/generated/sites.ts`, which is the list `@/data`
 * actually exports. `data/demo/sites.ts` still exists on disk with a *different*
 * set of ids (`ashoka-pillar`, `puskarini-pond`, `bodhi-tree`) and is no longer
 * exported by `data/demo/index.ts` — an itinerary written against those names
 * resolves nothing and silently skips every leg. If a waypoint here stops
 * resolving, check which of the two files the name came from.
 *
 * The Marker Stone is not a waypoint: it shares its coordinate with the temple
 * that encloses it, so a leg to it has zero length. Its arrival still fires —
 * it has the tightest reach of the five and the walk passes straight through it.
 */
const ITINERARY: readonly (
  | { at: string }
  | { circle: string }
  | { start: Coordinate }
)[] = [
  // A little south of the Puskarini, roughly where the south gate path enters.
  { start: { latitude: 27.46836, longitude: 83.27572 } },
  { at: 'puskarini' },
  { at: 'maya-devi-temple' },
  { circle: 'maya-devi-temple' },
  { at: 'ashokan-pillar' },
  { at: 'vihara-remains' },
  { at: 'myanmar-temple' },
  { at: 'gautami-nuns-temple' },
  { at: 'puskarini' },
];

function siteCoordinate(id: string): Coordinate | null {
  return demoSites.find((s) => s.id === id)?.coordinate ?? null;
}

/**
 * A waypoint naming a site that does not exist is a silently skipped leg, and a
 * walk that quietly visits four of its eight stops looks like a short walk
 * rather than a bug. Checked at module load so it surfaces in development
 * instead of on someone's phone.
 */
if (__DEV__) {
  const missing = ITINERARY.flatMap((leg) =>
    'at' in leg ? [leg.at] : 'circle' in leg ? [leg.circle] : [],
  ).filter((id) => !siteCoordinate(id));
  if (missing.length > 0) {
    console.warn(
      `demoWalk: itinerary names ${missing.length} unknown site(s): ${[...new Set(missing)].join(', ')}`,
    );
  }
}

/** Metres east/north of a point, back to degrees. Flat-earth is fine at 1 km. */
function offset(from: Coordinate, eastM: number, northM: number): Coordinate {
  const latRad = (from.latitude * Math.PI) / 180;
  return {
    latitude: from.latitude + northM / 111_320,
    longitude: from.longitude + eastM / (111_320 * Math.cos(latRad)),
  };
}

/**
 * A seeded generator, so the walk is the same walk every time.
 *
 * `Math.random` would make the demo unreproducible: a bug seen once during a
 * run could not be walked into again, which is the one thing a demo track is
 * good for.
 */
function noise(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x1_0000_0000 - 0.5;
  };
}

function interpolate(a: Coordinate, b: Coordinate, t: number): Coordinate {
  return {
    latitude: a.latitude + (b.latitude - a.latitude) * t,
    longitude: a.longitude + (b.longitude - a.longitude) * t,
  };
}

/**
 * Expand the itinerary into one entry per fix.
 *
 * Precomputed rather than integrated live. Playback then has no state beyond an
 * index, which means the walk cannot drift, a paused demo resumes exactly where
 * it stopped, and the whole track is available up front for the map to draw as
 * a route before the pilgrim has walked any of it.
 */
function buildItinerary(): DemoStep[] {
  const steps: Omit<DemoStep, 'index' | 'total'>[] = [];
  const jitter = noise(0x5a4b53);

  let position: Coordinate | null = null;
  let heading = 0;

  const push = (
    coordinate: Coordinate,
    headingDeg: number,
    speedMps: number,
    activity: DemoActivity,
  ) => {
    steps.push({
      coordinate: offset(coordinate, jitter() * 2 * JITTER_M, jitter() * 2 * JITTER_M),
      headingDeg,
      speedMps,
      activity,
    });
  };

  for (const leg of ITINERARY) {
    if ('start' in leg) {
      position = leg.start;
      continue;
    }

    if ('circle' in leg) {
      const centre = siteCoordinate(leg.circle);
      if (!centre || !position) continue;

      // Enter the circuit from wherever we are standing, and go clockwise —
      // anticlockwise never completes a pradakṣiṇā, and the app teaches that
      // rather than failing it. The demo walks the one that completes.
      const entry = bearingDegrees(centre, position);
      const circumference = 2 * Math.PI * CIRCUIT_RADIUS_M;
      const count = Math.max(16, Math.ceil(circumference / METRES_PER_TICK));

      // Walk out to the circle rather than appearing on it. The pause before
      // this leg leaves the pilgrim standing on the monument itself, and
      // stepping straight onto a 20 m radius was a fix twenty metres from the
      // last one — a third of a second at 33 m/s. Nothing downstream treats
      // that as walking, and on the map it read as the figure blinking sideways.
      const entryPoint = offset(
        centre,
        CIRCUIT_RADIUS_M * Math.sin((entry * Math.PI) / 180),
        CIRCUIT_RADIUS_M * Math.cos((entry * Math.PI) / 180),
      );
      const approach = Math.max(1, Math.ceil(distanceMeters(position, entryPoint) / METRES_PER_TICK));
      const approachFrom = position;
      const approachHeading = bearingDegrees(position, entryPoint);
      for (let i = 1; i <= approach; i += 1) {
        push(interpolate(approachFrom, entryPoint, i / approach), approachHeading, WALK_MPS, {
          kind: 'walking',
          towardsSiteId: leg.circle,
        });
      }
      position = entryPoint;

      for (let i = 1; i <= count; i += 1) {
        const swept = (i / count) * 360;
        const theta = ((entry + swept) * Math.PI) / 180;
        const point = offset(
          centre,
          CIRCUIT_RADIUS_M * Math.sin(theta),
          CIRCUIT_RADIUS_M * Math.cos(theta),
        );
        // Facing along the circle, which is 90° off the radius when walking it.
        heading = (entry + swept + 90) % 360;
        push(point, heading, WALK_MPS, {
          kind: 'circling',
          aroundSiteId: leg.circle,
          degrees: Math.round(swept),
        });
        position = point;
      }
      continue;
    }

    const target = siteCoordinate(leg.at);
    if (!target) continue;
    if (!position) {
      position = target;
      continue;
    }

    const legMetres = distanceMeters(position, target);
    const count = Math.max(1, Math.ceil(legMetres / METRES_PER_TICK));
    heading = bearingDegrees(position, target);
    const from = position;

    for (let i = 1; i <= count; i += 1) {
      push(interpolate(from, target, i / count), heading, WALK_MPS, {
        kind: 'walking',
        towardsSiteId: leg.at,
      });
    }

    for (let i = 0; i < PAUSE_TICKS; i += 1) {
      push(target, heading, 0, { kind: 'pausing', atSiteId: leg.at });
    }

    position = target;
  }

  return steps.map((step, index) => ({ ...step, index, total: steps.length }));
}

let itinerary: DemoStep[] | null = null;

function track(): DemoStep[] {
  if (!itinerary) itinerary = buildItinerary();
  return itinerary;
}

/**
 * The whole walk as a line, for the map to draw before it is walked.
 *
 * Thinned: the map does not need every fix to show the shape of a route, and
 * the array crosses into the WebView as injected JavaScript.
 */
export function demoRoute(): [number, number][] {
  return track()
    .filter((_, i) => i % 4 === 0)
    .map((s) => [s.coordinate.longitude, s.coordinate.latitude]);
}

/** Precincts the walk passes through, named for the demo's own narration. */
export function demoPrecinctNames(): string[] {
  const ids = new Set(
    ITINERARY.flatMap((leg) => ('at' in leg ? [leg.at] : 'circle' in leg ? [leg.circle] : [])),
  );
  return demoPrecincts
    .filter((p) => p.siteIds.some((id) => ids.has(id)))
    .map((p) => p.name);
}

type Listener = (step: DemoStep) => void;

const listeners = new Set<Listener>();
let timer: ReturnType<typeof setInterval> | null = null;
let cursor = 0;
let current: DemoStep | null = null;
/**
 * When true the tick fires but does not advance the cursor.
 *
 * The walker stays at the exact coordinate it reached, still emitting that
 * same fix on every tick so arrival hooks do not see a position gap. Resuming
 * restarts the advance from wherever the itinerary left off.
 */
let paused = false;

/** The most recent synthetic fix, or null before the walk has started. */
export function currentStep(): DemoStep | null {
  return current;
}

/**
 * Fixes to play before the itinerary resumes.
 *
 * Set by `goToSite` when somewhere off the route is asked for. Drained one tick
 * at a time so a teleported dwell is delivered at the same cadence as a walked
 * one — anything downstream watching for an arrival sees the same shape of
 * event either way.
 */
let override: DemoStep[] | null = null;

function tick(): void {
  if (override && override.length > 0) {
    current = override.shift() as DemoStep;
    if (override.length === 0) override = null;
    listeners.forEach((listener) => listener(current as DemoStep));
    return;
  }

  const steps = track();
  if (steps.length === 0) return;
  current = steps[cursor];

  // While paused: re-emit the same fix every tick so arrival hooks keep the
  // site id active, but do not advance — the walker stays put until resume().
  if (!paused) {
    cursor = (cursor + 1) % steps.length;
  }

  listeners.forEach((listener) => listener(current as DemoStep));
}

/** Begin, or restart from the south gate. Idempotent while already running. */
export function start(): void {
  if (timer) return;
  tick();
  timer = setInterval(tick, DEMO_TICK_MS);
}

export function stop(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

/** Back to the gate, keeping the walk running if it already was. */
export function restart(): void {
  cursor = 0;
  current = null;
  override = null;
  paused = false;
  if (timer) tick();
}

/**
 * Freeze the walker at its current position.
 *
 * The tick still fires — the same fix is re-emitted so the arrival state
 * does not drop — but the cursor does not advance until resume() is called.
 * Has no effect when the walk is not running.
 */
export function pause(): void {
  paused = true;
}

/** Unfreeze. The walk continues from the step it stopped on. */
export function resume(): void {
  paused = false;
}

export function isPaused(): boolean {
  return paused;
}

/** Every site the walk stops at, in the order it reaches them. */
export function itinerarySiteIds(): string[] {
  const seen: string[] = [];
  for (const step of track()) {
    const id =
      step.activity.kind === 'pausing'
        ? step.activity.atSiteId
        : step.activity.kind === 'circling'
          ? step.activity.aroundSiteId
          : null;
    if (id && !seen.includes(id)) seen.push(id);
  }
  return seen;
}

/**
 * Send the walker to a site, without walking there.
 *
 * The walk is a demonstration, and a demonstration nobody can steer is a video.
 * Someone showing the app should be able to say "now we are at the pillar" and
 * be at the pillar, rather than wait ninety seconds for the itinerary to arrive.
 *
 * Two cases, and the second is the one that was missing. A site *on* the
 * itinerary jumps to the moment the walk arrives at it — the first fix standing
 * there — so the arrival transition fires exactly as it would have on foot.
 *
 * A site the walk never visits used to return false and do nothing at all,
 * which is what "the target location isn't set" was: the picker offers all
 * twelve sites and the itinerary only stops at seven, so five of them silently
 * did nothing. Those now get a synthesised dwell — the same standing fixes the
 * itinerary would have produced — played before the walk resumes from the
 * nearest point on its route.
 */
export function goToSite(siteId: string): boolean {
  const steps = track();
  const target = siteCoordinate(siteId);
  if (!target) return false;

  const onRoute = steps.findIndex(
    (s) => s.activity.kind === 'pausing' && s.activity.atSiteId === siteId,
  );

  if (onRoute >= 0) {
    override = null;
    cursor = onRoute;
  } else {
    // Stand here for the usual dwell, then rejoin the walk wherever it passes
    // closest — so the itinerary continues from somewhere plausible rather than
    // snapping back across Lumbini on the next tick.
    override = Array.from({ length: PAUSE_TICKS }, (_, i) => ({
      coordinate: target,
      headingDeg: 0,
      speedMps: 0,
      activity: { kind: 'pausing', atSiteId: siteId } as DemoActivity,
      index: i,
      total: PAUSE_TICKS,
    }));
    cursor = nearestIndexTo(target);
  }

  if (timer) tick();
  else current = override?.[0] ?? steps[cursor];
  return true;
}

/** The point on the itinerary closest to a coordinate, for rejoining it. */
function nearestIndexTo(target: Coordinate): number {
  const steps = track();
  let best = 0;
  let bestDistance = Infinity;
  for (let i = 0; i < steps.length; i += 1) {
    const d = distanceMeters(steps[i].coordinate, target);
    if (d < bestDistance) {
      bestDistance = d;
      best = i;
    }
  }
  return best;
}

export function isRunning(): boolean {
  return timer !== null;
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener);
  if (current) listener(current);
  return () => {
    listeners.delete(listener);
  };
}
