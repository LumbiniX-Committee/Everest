import { test } from 'node:test';
import assert from 'node:assert/strict';

import { ChaityavaliRegister } from './register.ts';

test('witnessing a site records it once, then counts distinct days', () => {
  const r = new ChaityavaliRegister();
  r.witness('ashokan-pillar', '2026-08-08T04:00:00Z');
  r.witness('ashokan-pillar', '2026-08-08T09:00:00Z'); // same day
  r.witness('ashokan-pillar', '2026-08-09T04:00:00Z'); // next day
  assert.equal(r.size(), 1);
  const entry = r.list()[0];
  assert.equal(entry.site_id, 'ashokan-pillar');
  assert.equal(entry.first_witnessed_at, '2026-08-08T04:00:00Z');
  assert.equal(entry.days_visited, 2);
});

test('captures bind to a site and de-duplicate', () => {
  const r = new ChaityavaliRegister();
  r.bindCapture('puskarini', 'cap-1', '2026-08-08T04:00:00Z');
  r.bindCapture('puskarini', 'cap-1', '2026-08-08T04:05:00Z'); // dup
  r.bindCapture('puskarini', 'cap-2', '2026-08-08T04:10:00Z');
  assert.equal(r.has('puskarini'), true);
  assert.deepEqual(r.list()[0].capture_ids, ['cap-1', 'cap-2']);
});

test('the register is ordered by first darśana', () => {
  const r = new ChaityavaliRegister();
  r.witness('b', '2026-08-09T00:00:00Z');
  r.witness('a', '2026-08-08T00:00:00Z');
  assert.deepEqual(r.list().map((e) => e.site_id), ['a', 'b']);
});
