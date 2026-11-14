/**
 * Trail geometry for treks: drawing it lighter, placing stops and people on
 * it, and splitting a day into stages with estimated times.
 *
 * Pure. Distances use a local flat projection around each line, which over a
 * day's trail (under 20 km) differs from great-circle distance by far less
 * than the trail's own mapping error.
 */
import { haversine } from '../../shared/geo.ts';

export type LinePoint = readonly [longitude: number, latitude: number];
export type Located = { latitude: number; longitude: number };

const M_PER_DEG_LAT = 111_320;

/** A flat x/y in metres around a reference latitude. */
function projector(referenceLatitude: number) {
  const kx = M_PER_DEG_LAT * Math.cos((referenceLatitude * Math.PI) / 180);
  return (longitude: number, latitude: number): [number, number] => [longitude * kx, latitude * M_PER_DEG_LAT];
}

const meanLatitude = (line: readonly LinePoint[]) =>
  line.length ? line.reduce((sum, point) => sum + point[1], 0) / line.length : 0;

/**
 * Douglas–Peucker simplification, in metres.
 *
 * Keeps every point that sits more than `toleranceM` off the line through its
 * neighbours that survive, so switchbacks stay and straight runs collapse.
 * Iterative (no recursion limit on long lines) and always keeps both ends.
 * Returns the kept indices, so a profile sampled on the same line can be
 * thinned in step.
 */
export function simplifyIndices(line: readonly LinePoint[], toleranceM: number): number[] {
  if (line.length <= 2) return line.map((_, i) => i);
  const project = projector(meanLatitude(line));
  const xy = line.map(([lon, lat]) => project(lon, lat));
  const keep = new Uint8Array(line.length);
  keep[0] = 1;
  keep[line.length - 1] = 1;
  const stack: [number, number][] = [[0, line.length - 1]];
  const tolerance2 = toleranceM * toleranceM;
  while (stack.length) {
    const [start, end] = stack.pop()!;
    let worst = -1;
    let worstDistance2 = tolerance2;
    for (let i = start + 1; i < end; i += 1) {
      const d2 = segmentDistance2(xy[i], xy[start], xy[end]).distance2;
      if (d2 > worstDistance2) {
        worst = i;
        worstDistance2 = d2;
      }
    }
    if (worst !== -1) {
      keep[worst] = 1;
      stack.push([start, worst], [worst, end]);
    }
  }
  const out: number[] = [];
  keep.forEach((flag, i) => {
    if (flag) out.push(i);
  });
  return out;
}

/** The line with only the vertices Douglas–Peucker keeps. */
export function simplifyLine<T extends LinePoint>(line: readonly T[], toleranceM: number): T[] {
  return simplifyIndices(line, toleranceM).map((i) => line[i]);
}

function segmentDistance2(p: [number, number], a: [number, number], b: [number, number]): { distance2: number; t: number } {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length2 = dx * dx + dy * dy;
  const t = length2 === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length2));
  const x = a[0] + t * dx - p[0];
  const y = a[1] + t * dy - p[1];
  return { distance2: x * x + y * y, t };
}

const metres = (a: LinePoint, b: LinePoint) => haversine({ lat: a[1], lon: a[0] }, { lat: b[1], lon: b[0] });

/** Distance along the line from its start to each point. */
export function cumulativeAlong(line: readonly LinePoint[]): number[] {
  const out = [0];
  for (let i = 1; i < line.length; i += 1) out.push(out[i - 1] + metres(line[i - 1], line[i]));
  return out;
}

export type Snap = {
  /** The segment the position projects onto: from point `segment` to `segment + 1`. */
  segment: number;
  /** The line point nearest the snapped spot, for indexing a profile sampled on the line. */
  index: number;
  /** Metres from the start of the line to the snapped spot. */
  alongM: number;
  /** Metres from the position to the line. */
  distanceM: number;
  /** The snapped spot itself. */
  point: LinePoint;
};

/**
 * Snap a position to the nearest spot on the line, between vertices rather than
 * only at them: with vertices 120 m apart, snapping to the nearest point alone
 * can be 60 m out along the trail.
 *
 * `fromSegment` restricts the search to the line from there on, so a return
 * leg over the same ground is not mistaken for the way out.
 */
export function snapToLine(
  line: readonly LinePoint[],
  position: Located,
  along: readonly number[] = cumulativeAlong(line),
  fromSegment = 0,
): Snap | null {
  if (line.length === 0) return null;
  if (line.length === 1) {
    const distanceM = metres(line[0], [position.longitude, position.latitude]);
    return { segment: 0, index: 0, alongM: 0, distanceM, point: line[0] };
  }
  const project = projector(position.latitude);
  const p = project(position.longitude, position.latitude);
  let best = { segment: Math.max(0, Math.min(fromSegment, line.length - 2)), t: 0, distance2: Infinity };
  for (let i = Math.max(0, fromSegment); i < line.length - 1; i += 1) {
    const a = project(line[i][0], line[i][1]);
    const b = project(line[i + 1][0], line[i + 1][1]);
    const { distance2, t } = segmentDistance2(p, a, b);
    if (distance2 < best.distance2) best = { segment: i, t, distance2 };
  }
  const a = line[best.segment];
  const b = line[best.segment + 1];
  const point: LinePoint = [a[0] + (b[0] - a[0]) * best.t, a[1] + (b[1] - a[1]) * best.t];
  const segmentLength = along[best.segment + 1] - along[best.segment];
  return {
    segment: best.segment,
    index: best.t < 0.5 ? best.segment : best.segment + 1,
    alongM: along[best.segment] + segmentLength * best.t,
    distanceM: metres(point, [position.longitude, position.latitude]),
    point,
  };
}

/**
 * Each stop's place on the line, in walking order, chosen together.
 *
 * Taking each stop's nearest point after the previous one goes wrong when a
 * stop is placed approximately or a trail doubles back: one early mistake
 * pushes every later stop to the end. This picks the non-decreasing set of
 * vertices with the smallest total distance to the stops (dynamic programming,
 * O(stops × vertices)), which is the walking order that best fits all of them.
 */
export function orderStopsAlong(line: readonly LinePoint[], stops: readonly Located[]): number[] {
  const n = line.length;
  if (!n || !stops.length) return stops.map(() => 0);
  const project = projector(meanLatitude(line));
  const xy = line.map(([lon, lat]) => project(lon, lat));
  let previous = new Float64Array(n);
  const choice: Int32Array[] = [];
  for (let s = 0; s < stops.length; s += 1) {
    const [sx, sy] = project(stops[s].longitude, stops[s].latitude);
    const cost = new Float64Array(n);
    const from = new Int32Array(n);
    // Best previous stop placement at or before each point.
    let bestPrev = Infinity;
    let bestPrevIndex = 0;
    for (let i = 0; i < n; i += 1) {
      if (s > 0 && previous[i] < bestPrev) {
        bestPrev = previous[i];
        bestPrevIndex = i;
      }
      const d = Math.hypot(xy[i][0] - sx, xy[i][1] - sy);
      cost[i] = d + (s > 0 ? bestPrev : 0);
      from[i] = bestPrevIndex;
    }
    choice.push(from);
    previous = cost;
  }
  let end = 0;
  for (let i = 1; i < n; i += 1) if (previous[i] < previous[end]) end = i;
  const out = new Array<number>(stops.length);
  for (let s = stops.length - 1; s >= 0; s -= 1) {
    out[s] = end;
    end = choice[s][end];
  }
  return out;
}

/** Climb and descent between two profile samples, ignoring wobbles under 10 m as the build does. */
export function climbAndDescent(
  profile: readonly (number | null)[],
  start: number,
  end: number,
): { ascentM: number; descentM: number; highestM: number } | null {
  let anchor: number | null = null;
  let up = 0;
  let down = 0;
  let highest = -Infinity;
  let seen = 0;
  for (let i = Math.max(0, start); i <= end && i < profile.length; i += 1) {
    const value = profile[i];
    if (value == null) continue;
    seen += 1;
    if (value > highest) highest = value;
    if (anchor == null) {
      anchor = value;
      continue;
    }
    if (value - anchor >= 10) {
      up += value - anchor;
      anchor = value;
    } else if (anchor - value >= 10) {
      down += anchor - value;
      anchor = value;
    }
  }
  return seen > 1 ? { ascentM: Math.round(up), descentM: Math.round(down), highestM: Math.round(highest) } : null;
}

export type Pace = {
  /** Walking speed on the flat. */
  flatKmh: number;
  /** Metres of climb that add an hour. */
  climbMPerHour: number;
  /** Metres of descent that add an hour; null to ignore descent, as Naismith did. */
  descentMPerHour: number | null;
};

/** Naismith's rule as he wrote it: 5 km/h, plus an hour for every 600 m climbed. */
export const NAISMITH_PACE: Pace = { flatKmh: 5, climbMPerHour: 600, descentMPerHour: null };

/**
 * Naismith's rule slowed for a trekker carrying a day pack on Himalayan trails
 * and stone stairs: 3 km/h, an hour per 400 m up and per 2,000 m down. These
 * are the figures the route build uses (tools/data/build-treks.mjs), tuned so
 * day times land within about 40 minutes of commonly quoted stage times.
 */
export const TREK_PACE: Pace = { flatKmh: 3, climbMPerHour: 400, descentMPerHour: 2000 };

/** Walking hours by Naismith's rule with the given pace, without breaks. An estimate. */
export function naismithHours(distanceM: number, ascentM: number, descentM: number, pace: Pace = NAISMITH_PACE): number {
  return (
    distanceM / (pace.flatKmh * 1000) +
    ascentM / pace.climbMPerHour +
    (pace.descentMPerHour ? descentM / pace.descentMPerHour : 0)
  );
}

/** Above this, the estimate slows by a tenth for every further 1,000 m: thinner air, slower legs. */
export const ALTITUDE_SLOWING_FROM_M = 3500;

export function altitudeFactor(highestM: number | null): number {
  return highestM != null && highestM > ALTITUDE_SLOWING_FROM_M ? 1 + 0.1 * ((highestM - ALTITUDE_SLOWING_FROM_M) / 1000) : 1;
}

/** Rounded to the half hour: anything finer would claim a precision the rule does not have. */
export const toHalfHours = (hours: number) => Math.round(hours * 2) / 2;

export type Stage = {
  /** Positions in the stops list this stage runs between. */
  fromStop: number;
  toStop: number;
  /** Line indices of those stops. */
  fromIndex: number;
  toIndex: number;
  distanceM: number;
  /** Null where the elevation model has no values for this stretch. */
  ascentM: number | null;
  descentM: number | null;
  highestM: number | null;
  /** Estimated walking hours without breaks, to the half hour; null without a climb to base it on. */
  estimatedHours: number | null;
};

/**
 * Split a day at its stops into stages, each with distance along the trail,
 * climb, descent and an estimated time. Stops are placed with orderStopsAlong;
 * two stops on the same point (a there-and-back) make a zero-length stage,
 * which is dropped.
 */
export function splitStages(
  line: readonly LinePoint[],
  profile: readonly (number | null)[],
  stops: readonly Located[],
): Stage[] {
  if (line.length < 2 || stops.length < 2) return [];
  const along = cumulativeAlong(line);
  const indices = orderStopsAlong(line, stops);
  const stages: Stage[] = [];
  for (let s = 1; s < indices.length; s += 1) {
    const fromIndex = indices[s - 1];
    const toIndex = indices[s];
    if (toIndex <= fromIndex) continue;
    const distanceM = Math.round(along[toIndex] - along[fromIndex]);
    const climb = profile.length === line.length ? climbAndDescent(profile, fromIndex, toIndex) : null;
    stages.push({
      fromStop: s - 1,
      toStop: s,
      fromIndex,
      toIndex,
      distanceM,
      ascentM: climb?.ascentM ?? null,
      descentM: climb?.descentM ?? null,
      highestM: climb?.highestM ?? null,
      estimatedHours: climb
        ? toHalfHours(naismithHours(distanceM, climb.ascentM, climb.descentM, TREK_PACE) * altitudeFactor(climb.highestM))
        : null,
    });
  }
  return stages;
}

export type TrekDayLine = { line: readonly LinePoint[]; rest?: boolean };

/**
 * Which day's trail a position is on, if any: the nearest day within
 * `marginM`. For telling a trekker who has the wrong day selected which day
 * they are actually walking.
 */
export function locateOnTrek(days: readonly TrekDayLine[], position: Located, marginM: number): { dayIndex: number; distanceM: number } | null {
  let best: { dayIndex: number; distanceM: number } | null = null;
  for (let dayIndex = 0; dayIndex < days.length; dayIndex += 1) {
    const day = days[dayIndex];
    if (day.rest || day.line.length < 2) continue;
    const snap = snapToLine(day.line, position);
    if (snap && snap.distanceM <= marginM && (!best || snap.distanceM < best.distanceM)) {
      best = { dayIndex, distanceM: Math.round(snap.distanceM) };
    }
  }
  return best;
}

/**
 * The profile in `count` columns for a chart. Each column shows the highest
 * sample in its stretch, so a pass is never shaved off; a stretch with no
 * samples stays null (a gap), never zero.
 */
export function profileColumns(profile: readonly (number | null)[], count: number): (number | null)[] {
  const columns = Math.min(count, profile.length);
  return Array.from({ length: columns }, (_, i) => {
    const start = Math.floor((i * profile.length) / columns);
    const end = Math.max(start + 1, Math.floor(((i + 1) * profile.length) / columns));
    let high: number | null = null;
    for (let j = start; j < end; j += 1) {
      const value = profile[j];
      if (value != null && (high == null || value > high)) high = value;
    }
    return high;
  });
}
