/**
 * The generated trek data keeps the promises the screens rely on.
 * Rebuild with `npm run data:treks` if any of these fail after a seed edit.
 */
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { TREKS } from '../../data/generated/treks.ts';

test('each trek has days, stops and a drawable line', () => {
  assert.ok(TREKS.length >= 3);
  for (const trek of TREKS) {
    assert.ok(trek.days.length >= 5, trek.id);
    for (const day of trek.days.filter((d) => !d.rest)) {
      assert.ok(day.line.length > 10, `${trek.id} day ${day.day} has no line`);
    }
  }
});

test('unmeasured stays null, never 0', () => {
  for (const trek of TREKS) {
    for (const stop of trek.stops) assert.notEqual(stop.elevationM, 0, `${trek.id}/${stop.id}`);
    for (const day of trek.days) {
      if (day.distanceM != null) assert.ok(day.distanceM > 0, `${trek.id} day ${day.day}`);
      if (day.distanceM == null) assert.equal(day.hours, null, `${trek.id} day ${day.day} has hours without a distance`);
      assert.ok(day.profile.every((value) => value !== 0), `${trek.id} day ${day.day} profile`);
    }
  }
});

test('altitudes are plausible for where these treks go', () => {
  const highest = Object.fromEntries(TREKS.map((trek) => [trek.id, trek.totals.highest?.elevationM ?? null]));
  // Poon Hill tops out near 3,200 m, Kyanjin Ri near 4,600 m, Kala Patthar near 5,600 m.
  assert.ok(highest['poon-hill']! > 3000 && highest['poon-hill']! < 3400);
  assert.ok(highest['langtang-valley']! > 4300 && highest['langtang-valley']! < 4800);
  assert.ok(highest['everest-base-camp']! > 5400 && highest['everest-base-camp']! < 5700);
});

test('day distances are close to the published route lengths', () => {
  const km = (id: string) => (TREKS.find((t) => t.id === id)!.totals.distanceM ?? 0) / 1000;
  // Guidebooks: Poon Hill circuit about 40-55 km, Langtang return about 60-80 km, EBC return about 120-135 km.
  assert.ok(km('poon-hill') > 35 && km('poon-hill') < 60, `poon-hill ${km('poon-hill')}`);
  assert.ok(km('langtang-valley') > 55 && km('langtang-valley') < 90, `langtang ${km('langtang-valley')}`);
  assert.ok(km('everest-base-camp') > 100 && km('everest-base-camp') < 145, `ebc ${km('everest-base-camp')}`);
});

test('essentials keep their source and licence, and never invent a phone', async () => {
  const { ESSENTIALS } = await import('../../data/generated/essentials.ts');
  assert.ok(ESSENTIALS.length > 500);
  const licences = new Set(['CDLA-Permissive-2.0', 'Apache-2.0', 'CC0-1.0']);
  for (const item of ESSENTIALS) {
    assert.ok(licences.has(item.license), `${item.id} ${item.license}`);
    assert.ok(item.source.length > 0);
    assert.ok(item.phone === null || /\d{6,}/.test(item.phone), `${item.id} phone ${item.phone}`);
    assert.ok(item.confidence >= 0.8);
  }
  // Treks list places to stay at their overnight stops.
  assert.ok(ESSENTIALS.some((item) => item.area === 'everest-base-camp' && item.near === 'namche' && item.kind === 'stay'));
});
