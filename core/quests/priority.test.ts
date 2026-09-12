import assert from 'node:assert/strict';
import test from 'node:test';

import { rankQuestsByCoverage } from './priority.ts';

const quests = [
  { id: 'bundled-first', tasks: [{ targetId: 'site-a' }] },
  { id: 'oldest', tasks: [{ targetId: 'vantage-old' }] },
  { id: 'urgent', tasks: [{ targetId: 'vantage-urgent' }] },
  { id: 'unknown', tasks: [{}] },
];

test('coverage priority puts custodian urgency and survey age before bundled order', () => {
  const ranked = rankQuestsByCoverage(quests, [
    { vantageId: 'vantage-old', siteId: 'site-b', priority: 400 },
    { vantageId: 'vantage-urgent', siteId: 'site-c', priority: 1_000_002 },
    { vantageId: 'vantage-a', siteId: 'site-a', priority: 20 },
  ], (target) => target.startsWith('site-') ? target : undefined);
  assert.deepEqual(ranked.map((quest) => quest.id), ['urgent', 'oldest', 'bundled-first', 'unknown']);
});

test('empty coverage preserves bundled offline order', () => {
  const ranked = rankQuestsByCoverage(quests, [], () => undefined);
  assert.deepEqual(ranked.map((quest) => quest.id), quests.map((quest) => quest.id));
});
