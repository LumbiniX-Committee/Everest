import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildStory, type StoryMaterial } from './index.ts';

function material(over: Partial<StoryMaterial> = {}): StoryMaterial {
  return {
    siteName: 'Maya Devi Temple',
    siteSummary: 'The birthplace marker and the nativity sculpture.',
    narration:
      'The temple encloses the spot venerated as the birthplace of the Buddha. Excavation revealed brick structures built in phases from the third century BCE. The present shelter was rebuilt in 2003.',
    facts: [
      { label: 'Enshrines', value: 'Marker Stone' },
      { label: 'Earliest phase', value: '3rd c. BCE' },
      { label: 'Rebuilt', value: '2003' },
    ],
    dhamma: [
      {
        answer: 'Here the Blessed One was born.',
        original: 'hida bhagavaṃ jāte ti',
        citations: [{ sourceId: 'rummindei' }],
      },
    ],
    ...over,
  };
}

test('a full sequence runs arrival to discovery, in that order', () => {
  const beats = buildStory(material());
  assert.deepEqual(
    beats.map((b) => b.kind),
    ['arrival', 'history', 'detail', 'wisdom', 'discovery'],
  );
});

test('the sequence never runs past five beats', () => {
  const beats = buildStory(material({ facts: Array.from({ length: 20 }, (_, i) => ({ label: `L${i}`, value: `V${i}` })) }));
  assert.ok(beats.length <= 5, `got ${beats.length} beats`);
});

test('history does not repeat the opening line', () => {
  const beats = buildStory(material());
  const arrival = beats.find((b) => b.kind === 'arrival')!;
  const history = beats.find((b) => b.kind === 'history')!;
  assert.notEqual(arrival.body, history.body);
  assert.ok(!history.body.startsWith('The temple encloses'));
});

test('a beat with no material behind it is dropped, not filled', () => {
  const beats = buildStory(material({ facts: [], dhamma: [] }));
  const kinds = beats.map((b) => b.kind);
  assert.ok(!kinds.includes('detail'));
  assert.ok(!kinds.includes('wisdom'));
  // What remains is still a sequence that closes.
  assert.deepEqual(kinds, ['arrival', 'history', 'discovery']);
});

test('a site with nothing to say produces no sequence at all', () => {
  const beats = buildStory({ siteName: 'Nowhere', facts: [], dhamma: [] });
  assert.deepEqual(beats, []);
});

test('a one-sentence narration yields an arrival but no history', () => {
  const beats = buildStory(material({ narration: 'A single line about the place.' }));
  assert.deepEqual(
    beats.map((b) => b.kind),
    ['arrival', 'detail', 'wisdom', 'discovery'],
  );
});

test('the summary stands in when there is no narration', () => {
  const beats = buildStory(material({ narration: undefined }));
  const arrival = beats.find((b) => b.kind === 'arrival')!;
  assert.equal(arrival.body, 'The birthplace marker and the nativity sculpture.');
});

test('the passage carries its own language and its citation through', () => {
  const wisdom = buildStory(material()).find((b) => b.kind === 'wisdom')!;
  assert.equal(wisdom.original, 'hida bhagavaṃ jāte ti');
  assert.equal(wisdom.sourceId, 'rummindei');
});

test('a long opening is cut on a sentence boundary, not mid-clause', () => {
  const long = `${'A fairly long opening clause about the place that runs on. '.repeat(6)}Then more.`;
  const arrival = buildStory(material({ narration: long })).find((b) => b.kind === 'arrival')!;
  assert.ok(arrival.body.endsWith('.'), arrival.body);
  assert.ok(arrival.body.length <= 200);
});

test('the discovery names the place, because that is what was unlocked', () => {
  const beats = buildStory(material());
  assert.equal(beats.at(-1)!.body, 'Maya Devi Temple');
});
