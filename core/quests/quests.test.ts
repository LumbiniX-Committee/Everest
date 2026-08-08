import { test } from 'node:test';
import assert from 'node:assert/strict';

import { evaluateQuest, inWindow, parseHHMM, QUEST_PROXIMITY_MULTIPLE, type QuestSite } from './registry.ts';
import { StillnessTracker, stillnessTargetMs, ACCEL_VARIANCE_THRESHOLD } from './stillness.ts';
import { checkRiddle, normaliseAnswer } from './riddles.ts';
import { destination } from '../../shared/geo.ts';
import type { Quest, Coords, RiddleAnswer } from '../../shared/types.ts';

const CENTRE: Coords = { lat: 27.469609, lon: 83.275831 };
const sites = new Map<string, QuestSite>([['maya-devi-temple', { coords: CENTRE, geofence_m: 30 }]]);

const baseQuest = (over: Partial<Quest>): Quest => ({
  id: 'q.x',
  family: 'attention',
  title: { en: '', ne: '' },
  description: { en: '', ne: '' },
  ne_review: 'pending',
  site_id: 'maya-devi-temple',
  merit: 30,
  ...over,
});

// --- registry ---------------------------------------------------------------

test('inWindow handles a normal daytime window', () => {
  const w = { from: '05:30', to: '07:00' };
  assert.equal(inWindow(w, parseHHMM('06:00')), true);
  assert.equal(inWindow(w, parseHHMM('05:29')), false);
  assert.equal(inWindow(w, parseHHMM('07:01')), false);
});

test('inWindow handles a window wrapping past midnight', () => {
  const w = { from: '22:00', to: '02:00' };
  assert.equal(inWindow(w, parseHHMM('23:30')), true);
  assert.equal(inWindow(w, parseHHMM('01:00')), true);
  assert.equal(inWindow(w, parseHHMM('12:00')), false);
});

test('a nearby quest with no window is available', () => {
  const q = baseQuest({});
  const s = evaluateQuest(q, { pos: destination(CENTRE, 0, 20), sites });
  assert.equal(s.availability, 'available');
  assert.ok(s.distance_m! <= 30);
});

test('a far quest is too_far', () => {
  const q = baseQuest({});
  const far = destination(CENTRE, 0, 30 * QUEST_PROXIMITY_MULTIPLE + 50);
  const s = evaluateQuest(q, { pos: far, sites });
  assert.equal(s.availability, 'too_far');
});

test('q.first-light outside its window is outside_window', () => {
  const q = baseQuest({ id: 'q.first-light', family: 'witness', window: { from: '05:30', to: '07:00' } });
  const near = destination(CENTRE, 0, 10);
  assert.equal(evaluateQuest(q, { pos: near, minutesOfDay: parseHHMM('12:00'), sites }).availability, 'outside_window');
  assert.equal(evaluateQuest(q, { pos: near, minutesOfDay: parseHHMM('06:00'), sites }).availability, 'available');
});

test('a completed quest reports completed regardless of proximity', () => {
  const q = baseQuest({});
  const s = evaluateQuest(q, { pos: destination(CENTRE, 0, 5000), completed: new Set(['q.x']), sites });
  assert.equal(s.availability, 'completed');
});

// --- stillness --------------------------------------------------------------

test('stillness completes after ten minutes of screen-off, still, inside', () => {
  const t = new StillnessTracker();
  const target = stillnessTargetMs(false);
  const good = { screenOn: false, accelVariance: 0.005, insideGeofence: true };
  assert.equal(t.update({ ...good, nowMs: 0 }).active, true);
  assert.equal(t.update({ ...good, nowMs: target - 1 }).complete, false);
  assert.equal(t.update({ ...good, nowMs: target }).complete, true);
});

test('turning the screen on resets the held time', () => {
  const t = new StillnessTracker();
  const target = stillnessTargetMs(false);
  t.update({ screenOn: false, accelVariance: 0, insideGeofence: true, nowMs: 0 });
  // screen on midway — reset
  const broken = t.update({ screenOn: true, accelVariance: 0, insideGeofence: true, nowMs: target / 2 });
  assert.equal(broken.active, false);
  assert.equal(broken.heldMs, 0);
  // resume; the clock starts over, so target/2 more is not yet enough
  t.update({ screenOn: false, accelVariance: 0, insideGeofence: true, nowMs: target / 2 + 1 });
  assert.equal(t.update({ screenOn: false, accelVariance: 0, insideGeofence: true, nowMs: target }).complete, false);
});

test('movement above the variance threshold is not stillness', () => {
  const t = new StillnessTracker();
  const s = t.update({ screenOn: false, accelVariance: ACCEL_VARIANCE_THRESHOLD + 0.1, insideGeofence: true, nowMs: 0 });
  assert.equal(s.active, false);
});

test('debug timers collapse ten minutes to twenty seconds', () => {
  assert.equal(stillnessTargetMs(true), 20_000);
  assert.equal(stillnessTargetMs(false), 600_000);
});

// --- riddles ----------------------------------------------------------------

const riddle: RiddleAnswer = {
  accept: ['horse', 'घोडा'],
  hint: { en: 'Seek further, traveller — it was never a lion.', ne: '...' },
};

test('answer matching is tolerant of case, spacing and articles', () => {
  assert.equal(normaliseAnswer('  The Horse. '), 'horse');
  assert.equal(checkRiddle(riddle, 'HORSE').correct, true);
  assert.equal(checkRiddle(riddle, ' a horse ').correct, true);
  assert.equal(checkRiddle(riddle, 'घोडा').correct, true);
});

test('a wrong answer returns a hint, never a failure', () => {
  const r = checkRiddle(riddle, 'lion');
  assert.equal(r.correct, false);
  assert.ok(r.hint);
  assert.equal(r.hint!.en.startsWith('Seek further'), true);
});

test('a wrong answer falls back to the shared register when the riddle has no hint', () => {
  const noHint = { accept: ['horse'] } as RiddleAnswer;
  const r = checkRiddle(noHint, 'lion', 2);
  assert.equal(r.correct, false);
  assert.ok(r.hint && r.hint.en.length > 0);
});
