import assert from 'node:assert/strict';
import { test } from 'node:test';

import { exitRadius, MAX_DECISIVE_ACCURACY_M, resolvePresence, type PresenceCandidate } from './presence.ts';

// Two monuments 39 m apart, as in the Sacred Garden: a 20 m stone and a 30 m temple.
const at = (stone: number, temple: number): PresenceCandidate[] => [
  { id: 'stone', distanceM: stone, reachM: 20 },
  { id: 'temple', distanceM: temple, reachM: 30 },
];

test('enters the nearest site whose reach contains the fix', () => {
  assert.equal(resolvePresence(null, at(15, 54), 5), 'stone');
  assert.equal(resolvePresence(null, at(45, 25), 5), 'temple');
  assert.equal(resolvePresence(null, at(25, 64), 5), null);
});

test('jitter across the entry radius does not end a visit', () => {
  // 20 m reach exits at 30 m: a walk of 19 → 24 → 19 → 28 m stays "at stone".
  let id: string | null = null;
  for (const d of [19, 24, 19, 28]) id = resolvePresence(id, at(d, 39 + d), 8);
  assert.equal(id, 'stone');
  assert.equal(exitRadius(20), 30);
  assert.equal(resolvePresence(id, at(31, 70), 8), null);
});

test('walking onto a neighbour switches without leaving the first exit band', () => {
  // Still within the stone's 30 m exit band, but inside the temple's reach and nearer to it.
  assert.equal(resolvePresence('stone', at(26, 14), 6), 'temple');
  // Inside the temple's reach but still nearer the stone: stay put.
  assert.equal(resolvePresence('stone', at(12, 28), 6), 'stone');
});

test('a fix too coarse to place someone changes nothing', () => {
  const coarse = MAX_DECISIVE_ACCURACY_M + 1;
  assert.equal(resolvePresence(null, at(5, 40), coarse), null, 'no arrival from a coarse fix');
  assert.equal(resolvePresence('stone', at(200, 220), coarse), 'stone', 'no departure from one either');
});

test('unknown accuracy is decisive, not disqualifying', () => {
  assert.equal(resolvePresence(null, at(10, 49), null), 'stone');
});

test('a previous site absent from the candidates is dropped', () => {
  assert.equal(resolvePresence('gone', at(25, 64), 5), null);
});
