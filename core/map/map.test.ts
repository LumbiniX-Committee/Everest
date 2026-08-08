import { test } from 'node:test';
import assert from 'node:assert/strict';

import { GeofenceWatcher, nearestSite, EXIT_HYSTERESIS } from './geofence.ts';
import {
  evaluatePradakshina,
  PRADAKSHINA_MIN_DEG,
  PRADAKSHINA_MAX_REVERSE_DEG,
} from './pradakshina.ts';
import { destination } from '../../shared/geo.ts';
import type { Coords } from '../../shared/types.ts';

const CENTRE: Coords = { lat: 27.469609, lon: 83.275831 };
const SITES = [{ id: 'maya-devi-temple', coords: CENTRE, geofence_m: 30 }];

// --- geofence ---------------------------------------------------------------

test('enter fires once when crossing the radius inward', () => {
  const w = new GeofenceWatcher(SITES);
  const far = destination(CENTRE, 0, 100); // 100 m north, outside
  const near = destination(CENTRE, 0, 10); // 10 m north, inside
  assert.deepEqual(w.update(far, 1000), []);
  const ev = w.update(near, 2000);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].type, 'enter');
  assert.deepEqual(w.insideNow(), ['maya-devi-temple']);
});

test('hysteresis: sitting on the boundary does not flap', () => {
  const w = new GeofenceWatcher(SITES);
  w.update(destination(CENTRE, 0, 10), 0); // enter
  let fired = 0;
  // jitter between just inside and just outside the entry radius (30 m),
  // but never past the exit radius (30 × 1.15 = 34.5 m)
  for (let t = 1; t <= 20; t++) {
    const d = t % 2 === 0 ? 29 : 33;
    fired += w.update(destination(CENTRE, 0, d), t * 1000).length;
  }
  assert.equal(fired, 0, 'no enter/exit events within the hysteresis band');
  assert.deepEqual(w.insideNow(), ['maya-devi-temple']);
});

test('exit only fires past r × 1.15', () => {
  const w = new GeofenceWatcher(SITES);
  w.update(destination(CENTRE, 0, 10), 0); // enter
  // just outside entry radius but within hysteresis → still inside
  assert.deepEqual(w.update(destination(CENTRE, 0, 33), 1000), []);
  // past the exit radius → exit
  const ev = w.update(destination(CENTRE, 0, 40), 2000);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].type, 'exit');
  assert.ok(30 * EXIT_HYSTERESIS < 40);
});

test('dwell fires once after the configured duration', () => {
  const w = new GeofenceWatcher(SITES, { dwellMs: 600_000 });
  w.update(destination(CENTRE, 0, 10), 0); // enter at t=0
  assert.deepEqual(w.update(destination(CENTRE, 0, 10), 300_000), []); // 5 min: no dwell
  const ev = w.update(destination(CENTRE, 0, 10), 600_000); // 10 min
  assert.equal(ev.length, 1);
  assert.equal(ev[0].type, 'dwell');
  // does not fire again
  assert.deepEqual(w.update(destination(CENTRE, 0, 10), 900_000), []);
});

test('nearestSite reports distance, label and compass', () => {
  const pos = destination(CENTRE, 45, 200); // 200 m NE of the temple
  const n = nearestSite(pos, SITES)!;
  assert.equal(n.site.id, 'maya-devi-temple');
  assert.ok(Math.abs(n.distance_m - 200) < 2);
  assert.equal(n.label, '200 m');
  assert.equal(n.compass, 'south-west'); // the site is SW of a point NE of it
});

// --- pradakshina ------------------------------------------------------------

/** A ring of positions around the centroid, from bearing `from` to `to`. */
function arc(from: number, to: number, stepDeg: number, radius = 12): Coords[] {
  const pts: Coords[] = [];
  const dir = to >= from ? 1 : -1;
  for (let b = from; dir > 0 ? b <= to : b >= to; b += dir * stepDeg) {
    pts.push(destination(CENTRE, ((b % 360) + 360) % 360, radius));
  }
  return pts;
}

test('a full clockwise circle completes', () => {
  const r = evaluatePradakshina(CENTRE, 12, arc(0, 360, 10));
  assert.equal(r.complete, true);
  assert.equal(r.direction, 'clockwise');
  assert.ok(r.degrees >= PRADAKSHINA_MIN_DEG);
});

test('the same circle anticlockwise teaches direction, never fails', () => {
  const r = evaluatePradakshina(CENTRE, 12, arc(360, 0, 10));
  assert.equal(r.complete, false);
  assert.equal(r.direction, 'anticlockwise');
  assert.equal(r.teach, 'direction');
});

test('excess backtracking does not complete', () => {
  // 0→200 clockwise, back to 160 (40° reverse, > 30), forward to 360
  const track = [...arc(0, 200, 10), ...arc(190, 160, 10), ...arc(170, 360, 10)];
  const r = evaluatePradakshina(CENTRE, 12, track);
  assert.equal(r.complete, false);
  assert.ok(r.reverse_deg > PRADAKSHINA_MAX_REVERSE_DEG);
  assert.equal(r.teach, 'incomplete');
});

test('a small clockwise backtrack still completes', () => {
  // 0→200, back to 185 (15° reverse, ≤ 30), on to 360
  const track = [...arc(0, 200, 10), ...arc(195, 185, 5), ...arc(190, 360, 10)];
  const r = evaluatePradakshina(CENTRE, 12, track);
  assert.equal(r.complete, true);
  assert.ok(r.reverse_deg <= PRADAKSHINA_MAX_REVERSE_DEG);
});

test('a track that strays past 2× radius is rejected', () => {
  const track = [...arc(0, 120, 10), destination(CENTRE, 130, 40), ...arc(140, 360, 10)];
  const r = evaluatePradakshina(CENTRE, 12, track);
  assert.equal(r.complete, false);
  assert.equal(r.teach, 'strayed');
});

test('an incomplete arc reports incomplete', () => {
  const r = evaluatePradakshina(CENTRE, 12, arc(0, 180, 10));
  assert.equal(r.complete, false);
  assert.equal(r.teach, 'incomplete');
});
