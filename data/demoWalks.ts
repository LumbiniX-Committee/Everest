/**
 * The demo walks' itineraries, kept free of imports so tools/gen-walk-paths.mjs
 * can read them under plain Node and fetch the mapped footpath for every leg.
 * The walker itself lives in services/location/demoWalk.ts.
 */
export type Coordinate = { latitude: number; longitude: number };

export type DemoLeg = { at: string } | { circle: string } | { start: Coordinate };

export type DemoWalkDefinition = {
  id: string;
  name: string;
  precinctId: string;
  legs: readonly DemoLeg[];
};

/**
 * The itinerary, in the order a first-time pilgrim actually walks it.
 *
 * South gate to the pond, the pond to the temple, a clockwise circuit of the
 * birthplace, the pillar, the vihāra remains, then north up the central canal
 * to the East Monastic Zone. It returns to the pond so the demo can loop
 * without teleporting, and so a second pass demonstrates the arrival cooldown
 * rather than re-announcing everything.
 *
 * The ids are the ones in `data/generated/sites.ts`, which is the list `@/data`
 * actually exports (`data/demo/sites.ts`, an earlier draft with a different id
 * scheme — `ashoka-pillar`, `puskarini-pond`, `bodhi-tree` — has been deleted;
 * an itinerary written against those names would have resolved nothing and
 * silently skipped every leg).
 *
 * The Marker Stone shares the temple coordinate, but remains an explicit dwell
 * waypoint. That zero-distance pause is intentional: it opens the stone's own
 * story instead of silently treating an enclosed monument as part of the
 * temple's umbrella story.
 */
export const WALK_DEFINITIONS: readonly DemoWalkDefinition[] = [
  {
    id: 'sacred-garden',
    name: 'Sacred Garden walk',
    precinctId: 'sacred-garden',
    legs: [
      { start: { latitude: 27.46795, longitude: 83.27572 } },
      { at: 'puskarini' },
      { at: 'maya-devi-temple' },
      { at: 'marker-stone' },
      { circle: 'maya-devi-temple' },
      { at: 'ashokan-pillar' },
      { at: 'vihara-remains' },
      { at: 'puskarini' },
    ],
  },
  {
    id: 'monastic-east',
    name: 'East Monastic Zone walk',
    precinctId: 'monastic-east',
    legs: [
      { start: { latitude: 27.47435, longitude: 83.27805 } },
      { at: 'gautami-nuns-temple' },
      { at: 'myanmar-temple' },
      { at: 'gautami-nuns-temple' },
    ],
  },
  {
    id: 'monastic-west',
    name: 'West Monastic Zone walk',
    precinctId: 'monastic-west',
    legs: [
      { start: { latitude: 27.4772, longitude: 83.27175 } },
      { at: 'korean-temple' },
      { at: 'china-temple' },
      { at: 'korean-temple' },
    ],
  },
  {
    id: 'world-peace-pagoda',
    name: 'World Peace Pagoda walk',
    precinctId: 'world-peace-pagoda',
    legs: [
      { start: { latitude: 27.49685, longitude: 83.27626 } },
      { at: 'world-peace-pagoda' },
      { circle: 'world-peace-pagoda' },
    ],
  },
  {
    id: 'tilaurakot',
    name: 'Tilaurakot rampart walk',
    precinctId: 'tilaurakot',
    legs: [
      { start: { latitude: 27.5721, longitude: 83.0536 } },
      { at: 'tilaurakot' },
      { circle: 'tilaurakot' },
    ],
  },
  {
    id: 'ramagrama',
    name: 'Ramagrama stupa walk',
    precinctId: 'ramagrama',
    legs: [
      { start: { latitude: 27.50105, longitude: 83.687 } },
      { at: 'ramagrama' },
      { circle: 'ramagrama' },
    ],
  },
  {
    id: 'patan-durbar-square',
    name: 'Patan nineteen-monument walk',
    precinctId: 'patan-durbar-square',
    legs: [
      { start: { latitude: 27.67225, longitude: 85.32545 } },
      { at: 'patan-bhai-dega' },
      { at: 'patan-lakshminarayan-temple' },
      { at: 'patan-sundari-chowk' },
      { at: 'patan-lohari-hiti' },
      { at: 'patan-ganesh-temple' },
      { at: 'patan-mul-chowk' },
      { at: 'patan-degutale-1560' },
      { at: 'patan-narayan-temple' },
      { at: 'patan-degutale-1562' },
      { at: 'patan-hari-shankar-temple' },
      { at: 'patan-char-narayan-temple' },
      { at: 'patan-bishwanath-1626' },
      { at: 'patan-chyasin-dega' },
      { at: 'patan-keshav-narayan-chowk' },
      { at: 'patan-krishna-mandir' },
      { at: 'patan-vishwanath-1666' },
      { at: 'patan-kiskisila-temple' },
      { at: 'patan-bhimsen-temple' },
      { at: 'manga-hiti' },
      { at: 'patan-durbar-square' },
      { circle: 'patan-durbar-square' },
    ],
  },
  {
    id: 'changu-narayan',
    name: 'Changu Narayan temple walk',
    precinctId: 'changu-narayan',
    legs: [
      { start: { latitude: 27.71475, longitude: 85.4279 } },
      { at: 'changu-narayan' },
      { circle: 'changu-narayan' },
    ],
  },
  {
    id: 'kathmandu-durbar-square',
    name: 'Kathmandu forty-landmark walk',
    precinctId: 'kathmandu-durbar-square',
    legs: [
      { start: { latitude: 27.70295, longitude: 85.30672 } },
      { at: 'ktm-ashok-vinayak' }, { at: 'ktm-kasthamandap' }, { at: 'ktm-simha-sattal' },
      { at: 'ktm-kumari-ghar' }, { at: 'ktm-gaddi-baithak' }, { at: 'ktm-basantapur-durbar' },
      { at: 'ktm-maju-dega' }, { at: 'ktm-trailokya-mohan' }, { at: 'ktm-jagannath-temple' },
      { at: 'ktm-mahendreshwar-temple' }, { at: 'ktm-kotilingeshwar-temple' },
      { at: 'ktm-krishna-temple' }, { at: 'ktm-kal-bhairav' }, { at: 'ktm-shiva-parvati-temple' },
      { at: 'ktm-kabindrapur' }, { at: 'ktm-indrapur-temple' }, { at: 'ktm-gopinath-temple' },
      { at: 'ktm-saraswati-temple' }, { at: 'ktm-laxmi-narayan-temple' }, { at: 'ktm-chyasin-dega' },
      { at: 'ktm-kageshwar-temple' }, { at: 'ktm-tarini-bahal' }, { at: 'ktm-hanuman-gate' },
      { at: 'ktm-hanuman-dhoka-palace' }, { at: 'ktm-nasal-chowk' }, { at: 'ktm-panchamukhi-hanuman' },
      { at: 'ktm-mohan-chowk' }, { at: 'ktm-sundari-chowk' }, { at: 'ktm-taleju-temple' },
      { at: 'ktm-degu-taleju' }, { at: 'ktm-pratap-malla-column' }, { at: 'ktm-narsingha-statue' },
      { at: 'ktm-swet-bhairav' }, { at: 'ktm-dashain-ghar' }, { at: 'ktm-nagara-ghar' },
      { at: 'ktm-dhukuti-ghar' }, { at: 'ktm-dasavatar-temple' }, { at: 'ktm-natyeshwar-temple' },
      { at: 'ktm-tribhuvan-gallery' }, { at: 'ktm-shisha-baithak' },
      { at: 'kathmandu-durbar-square' }, { circle: 'kathmandu-durbar-square' },
    ],
  },
];

