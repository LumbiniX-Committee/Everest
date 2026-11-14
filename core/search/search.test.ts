import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addRecent,
  buildSearchIndex,
  dedupeRemote,
  editDistance,
  fold,
  groupHits,
  searchIndex,
  type SearchDoc,
} from './index.ts';

const DOCS: SearchDoc[] = [
  { key: 'site:maya', kind: 'heritage', name: 'Maya Devi Temple', nameNepali: 'माया देवी मन्दिर', coordinate: { latitude: 27.4696, longitude: 83.2758 }, boost: 4 },
  { key: 'site:pillar', kind: 'heritage', name: 'Ashokan Pillar', nameNepali: 'अशोक स्तम्भ', coordinate: { latitude: 27.4697, longitude: 83.2756 } },
  { key: 'site:kdbs', kind: 'heritage', name: 'Kathmandu Durbar Square', nameNepali: 'काठमाडौँ दरबार क्षेत्र', coordinate: { latitude: 27.7045, longitude: 85.3071 } },
  { key: 'site:pdbs', kind: 'heritage', name: 'Patan Durbar Square', coordinate: { latitude: 27.6727, longitude: 85.3253 } },
  { key: 'place:swayambhu', kind: 'place', name: 'Swayambhu', coordinate: { latitude: 27.7149, longitude: 85.2904 } },
  { key: 'place:boudha', kind: 'place', name: 'Boudhanath', coordinate: { latitude: 27.7215, longitude: 85.362 } },
  { key: 'place:bhaktapur', kind: 'place', name: 'Bhaktapur Durbar Square', coordinate: { latitude: 27.672, longitude: 85.428 } },
  { key: 'place:temple-pokhara', kind: 'place', name: 'Bindhyabasini Temple', coordinate: { latitude: 28.2386, longitude: 83.9956 } },
  { key: 'ess:mayahotel', kind: 'essential', name: 'Hotel Maya Lumbini', detail: 'stay', coordinate: { latitude: 27.48, longitude: 83.28 } },
  { key: 'trek:ebc', kind: 'trek', name: 'Everest Base Camp', nameNepali: 'सगरमाथा आधार शिविर' },
  { key: 'stop:namche', kind: 'trek', name: 'Namche Bazaar', aliases: ['Everest Base Camp'], coordinate: { latitude: 27.805, longitude: 86.713 } },
  { key: 'app:saksi', kind: 'place', name: 'Sākṣī Centre' },
];
const index = buildSearchIndex(DOCS);
const top = (query: string, near?: { latitude: number; longitude: number }) => searchIndex(index, query, { near })[0]?.doc.key;

test('fold removes diacritics and Latin spelling variants', () => {
  assert.equal(fold('Sākṣī'), 'saksi');
  assert.equal(fold('Sakshi'), 'saksi');
  assert.equal(fold('Swayambhu'), fold('swayambu'));
  assert.equal(fold('Kathmandu'), fold('Katmandu'));
  assert.equal(fold('  Maya–Devi! '), 'maya devi');
  assert.equal(fold('माया देवी'), 'माया देवी');
});

test('edit distance counts swaps once and stops past the bound', () => {
  assert.equal(editDistance('pillar', 'pilalr', 2), 1);
  assert.equal(editDistance('temple', 'tempel', 2), 1);
  assert.equal(editDistance('kitten', 'sitting', 3), 3);
  assert.equal(editDistance('abcdef', 'uvwxyz', 1), 2);
});

test('diacritic-insensitive and transliteration-tolerant', () => {
  assert.equal(top('saksi'), 'app:saksi');
  assert.equal(top('sakshi'), 'app:saksi');
  assert.equal(top('katmandu durbar'), 'site:kdbs');
});

test('aliases: Swayambhu by any name people use', () => {
  for (const query of ['swayambhu', 'swayambhunath', 'syambhunath', 'monkey temple', 'Monkey']) {
    assert.equal(top(query), 'place:swayambhu', query);
  }
  assert.equal(top('bodnath'), 'place:boudha');
  assert.equal(top('ashoka pillar'), 'site:pillar');
  assert.equal(top('ebc'), 'trek:ebc');
});

test('Devanagari names match Devanagari queries', () => {
  assert.equal(top('माया'), 'site:maya');
  assert.equal(top('अशोक'), 'site:pillar');
  assert.equal(top('सगरमाथा'), 'trek:ebc');
});

test('typos are tolerated, short words are not guessed', () => {
  assert.equal(top('pilar'), 'site:pillar');
  assert.equal(top('ashokn pillar'), 'site:pillar');
  assert.equal(top('boudhnath'), 'place:boudha');
  assert.equal(top('bhaktpur'), 'place:bhaktapur');
  // Three letters with a typo match nothing rather than anything.
  assert.equal(searchIndex(index, 'xyz').length, 0);
});

test('ranking: exact beats prefix beats fuzzy, heritage before others', () => {
  const maya = searchIndex(index, 'maya').map((hit) => hit.doc.key);
  // The heritage site leads the hotel that also says Maya.
  assert.deepEqual(maya.slice(0, 2), ['site:maya', 'ess:mayahotel']);
  const durbar = searchIndex(index, 'durbar square').map((hit) => hit.doc.key);
  assert.ok(durbar.indexOf('site:kdbs') < durbar.indexOf('place:bhaktapur'));
  // Typing the start of a word finds it before the word is finished.
  assert.equal(top('nam'), 'stop:namche');
});

test('distance breaks ties toward what is near', () => {
  const inPatan = { latitude: 27.673, longitude: 85.325 };
  const inKathmandu = { latitude: 27.7045, longitude: 85.3071 };
  assert.equal(top('durbar square', inPatan), 'site:pdbs');
  assert.equal(top('durbar square', inKathmandu), 'site:kdbs');
  const hit = searchIndex(index, 'patan', { near: inPatan })[0];
  assert.ok(hit.distanceM != null && hit.distanceM < 100);
  assert.equal(searchIndex(index, 'patan')[0].distanceM, null);
});

test('groups keep heritage first and cap each group', () => {
  const groups = groupHits(searchIndex(index, 'temple'), { place: 1 });
  assert.equal(groups[0].kind, 'heritage');
  assert.equal(groups.find((group) => group.kind === 'place')?.hits.length, 1);
});

test('OpenStreetMap results already listed locally are dropped', () => {
  const remote = [
    { id: 'osm-1', name: 'Swayambhunath', coordinate: { latitude: 27.7151, longitude: 85.2906 } },
    { id: 'osm-2', name: 'Swayambhu Bus Stop', coordinate: { latitude: 27.75, longitude: 85.35 } },
    { id: 'osm-3', name: 'Thamel', coordinate: { latitude: 27.715, longitude: 85.312 } },
    { id: 'osm-4', name: 'Thamel', coordinate: { latitude: 27.7151, longitude: 85.3121 } },
  ];
  assert.deepEqual(dedupeRemote(remote, DOCS).map((place) => place.id), ['osm-2', 'osm-3']);
});

test('recent searches: newest first, no repeats, bounded', () => {
  let list = addRecent([], { key: 'a', kind: 'place', name: 'A', detail: null, coordinate: null });
  list = addRecent(list, { key: 'b', kind: 'place', name: 'B', detail: null, coordinate: null });
  list = addRecent(list, { key: 'a', kind: 'place', name: 'A', detail: null, coordinate: null }, 2);
  assert.deepEqual(list.map((item) => item.key), ['a', 'b']);
});

test('the real catalogue answers quickly', async () => {
  type Named = { id: string; name: string; nameNepali?: string | null; coordinate: { latitude: number; longitude: number } };
  // Sites and places import the app's `@/` alias, which this typecheck does not
  // resolve; Node strips the types and loads them fine.
  const load = (path: string) => import(new URL(path, import.meta.url).href) as Promise<Record<string, Named[]>>;
  const [{ demoSites }, { PLACES }, { ESSENTIALS }] = await Promise.all([
    load('../../data/generated/sites.ts'),
    load('../../data/generated/places.ts'),
    import('../../data/generated/essentials.ts'),
  ]);
  const docs: SearchDoc[] = [
    ...demoSites.map((site) => ({ key: `site:${site.id}`, kind: 'heritage' as const, name: site.name, nameNepali: site.nameNepali, coordinate: site.coordinate })),
    ...PLACES.map((place) => ({ key: `place:${place.id}`, kind: 'place' as const, name: place.name, nameNepali: place.nameNepali, coordinate: place.coordinate })),
    ...ESSENTIALS.map((item) => ({ key: `ess:${item.id}`, kind: 'essential' as const, name: item.name, coordinate: item.coordinate })),
  ];
  const real = buildSearchIndex(docs);
  const queries = ['s', 'sw', 'swa', 'sway', 'swaya', 'swayam', 'monkey temple', 'kasthamandap', 'boudhanath', 'pharmacy'];
  const round = () => {
    const started = performance.now();
    for (const query of queries) searchIndex(real, query);
    return (performance.now() - started) / queries.length;
  };
  round(); // warm up
  // The best of five rounds, so a busy test machine does not fail it.
  const perQuery = Math.min(round(), round(), round(), round(), round());
  // About 3 ms here on a laptop. A low-end phone is roughly ten times slower,
  // so 15 ms keeps a keystroke there well under 150 ms.
  assert.ok(perQuery < 15, `${perQuery.toFixed(1)} ms per query`);
  assert.equal(searchIndex(real, 'maya devi')[0].doc.name, 'Maya Devi Temple');
});
