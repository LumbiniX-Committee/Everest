import { test } from 'node:test';
import assert from 'node:assert/strict';

import { WISDOM_LEVELS, reachedNewLevel, placeStanding, standingFor } from './index.ts';

test('a new pilgrim starts at the first level with nothing spent', () => {
  const s = standingFor(0);
  assert.equal(s.level, 1);
  assert.equal(s.title, 'Wayfarer');
  assert.equal(s.wisdom, 0);
  assert.equal(s.progress, 0);
});

test('the level is the highest threshold reached, not the nearest', () => {
  // 599 is one short of Seeker. Rounding to the nearest would promote it.
  assert.equal(standingFor(599).title, 'Pilgrim');
  assert.equal(standingFor(600).title, 'Seeker');
});

test('progress fills across the level it is in, not across the whole scale', () => {
  // Pilgrim runs 200–600, so 400 is halfway through it.
  const s = standingFor(400);
  assert.equal(s.level, 2);
  assert.equal(s.progress, 0.5);
  assert.equal(s.toNextLevel, 200);
  assert.equal(s.nextLevelAt, 600);
});

test('the top level is full and has nothing further to reach', () => {
  const top = WISDOM_LEVELS[WISDOM_LEVELS.length - 1];
  const s = standingFor(top.from + 50_000);
  assert.equal(s.level, top.level);
  assert.equal(s.nextLevelAt, null);
  assert.equal(s.toNextLevel, 0);
  assert.equal(s.progress, 1);
});

test('a nonsense balance degrades to zero rather than to NaN', () => {
  for (const bad of [-1, Number.NaN, Number.POSITIVE_INFINITY]) {
    const s = standingFor(bad);
    assert.equal(s.wisdom, 0);
    assert.equal(s.level, 1);
  }
});

test('a new level is a crossing, not an increase', () => {
  assert.equal(reachedNewLevel(150, 250), true);
  assert.equal(reachedNewLevel(250, 350), false);
  // The daily cap can clip a recognition to nothing; that must not read
  // as reaching a new level.
  assert.equal(reachedNewLevel(250, 250), false);
});

test('a place is mastered only when the story and every quest are done', () => {
  assert.equal(placeStanding(false, 4, 4).mastered, false);
  assert.equal(placeStanding(true, 3, 4).mastered, false);
  assert.equal(placeStanding(true, 4, 4).mastered, true);
});

test('a place with no quests is mastered by reading it, and does not divide by zero', () => {
  const s = placeStanding(true, 0, 0);
  assert.equal(s.progress, 1);
  assert.equal(s.mastered, true);
});

test('the story counts as one unit alongside the quests', () => {
  // Story done, one of three quests: two of four units.
  assert.equal(placeStanding(true, 1, 3).progress, 0.5);
});

test('quest counts are clamped to what the place actually has', () => {
  const s = placeStanding(true, 99, 2);
  assert.equal(s.questsCompleted, 2);
  assert.equal(s.mastered, true);
});
