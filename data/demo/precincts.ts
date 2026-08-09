import { MIN_GEOFENCE_RADIUS_M, type Precinct } from '@/types';

/**
 * The geofenced areas of Lumbini.
 *
 * Derived from the twelve sites in `data/generated/`, but grouped spatially
 * rather than by their `zone` field. The zones are conceptual and do not
 * enclose: `world-peace-pagoda` is zoned `monastic_east` while sitting 2.9 km
 * from it, and `greater_lumbini` holds Tilaurakot and Ramagrama, which are 41 km
 * apart. A geofence has to be a circle on the ground, so these are measured.
 *
 * Centres and radii are authored, not computed at load. A centroid recomputed
 * from the site list drifts every time a site is added, silently moving a
 * geofence someone has already walked into.
 *
 * Measured spreads:
 *   Sacred Garden      5 sites within 47 m
 *   Monastic East      2 sites within 43 m
 *   Monastic West      2 sites within 129 m
 *   Peace Pagoda       alone, 2.9 km north of the garden
 *   Tilaurakot         alone, 27 km north-west
 *   Ramagrama          alone, 41 km east
 */
export const demoPrecincts: Precinct[] = [
  {
    id: 'sacred-garden',
    name: 'The Sacred Garden',
    summary: 'The birthplace precinct: temple, pillar, pond and marker stone.',
    centre: { latitude: 27.46964, longitude: 83.27583 },
    // 150 m: the monuments span 47 m, and the margin means the trigger fires on
    // approach along the entrance path rather than once you are among them.
    radiusMetres: 150,
    siteIds: [
      'maya-devi-temple',
      'ashokan-pillar',
      'puskarini',
      'marker-stone',
      'vihara-remains',
    ],
  },
  {
    id: 'monastic-east',
    name: 'The East Monastic Zone',
    summary: 'Monasteries of the Theravāda tradition, east of the canal.',
    centre: { latitude: 27.47586, longitude: 83.27809 },
    radiusMetres: 150,
    siteIds: ['myanmar-temple', 'gautami-nuns-temple'],
  },
  {
    id: 'monastic-west',
    name: 'The West Monastic Zone',
    summary: 'Mahāyāna and Vajrayāna monasteries, west of the canal.',
    centre: { latitude: 27.47914, longitude: 83.27187 },
    // Wider: these two sit 129 m apart, and a 150 m circle would clip one.
    radiusMetres: 200,
    siteIds: ['china-temple', 'korean-temple'],
  },
  {
    id: 'world-peace-pagoda',
    name: 'The World Peace Pagoda',
    summary: 'The northern stupa, beyond the monastic zones.',
    centre: { latitude: 27.49888, longitude: 83.27626 },
    // Approached across open ground where a fix is slower to settle; the extra
    // radius buys the OS time to notice the crossing.
    radiusMetres: 200,
    siteIds: ['world-peace-pagoda'],
  },
  {
    id: 'tilaurakot',
    name: 'Tilaurakot–Kapilavastu',
    summary: 'The palace city of the Śākyas, 27 km north-west.',
    centre: { latitude: 27.5747, longitude: 83.0536 },
    // A dispersed archaeological area rather than a single monument.
    radiusMetres: 250,
    siteIds: ['tilaurakot'],
  },
  {
    id: 'ramagrama',
    name: 'Ramagrama Stupa',
    summary: 'The one relic stupa never opened, 41 km east.',
    centre: { latitude: 27.503, longitude: 83.687 },
    radiusMetres: 200,
    siteIds: ['ramagrama'],
  },
];

export function findPrecinct(id: string): Precinct | undefined {
  return demoPrecincts.find((p) => p.id === id);
}

/** The precinct a site belongs to, if any. */
export function precinctForSite(siteId: string): Precinct | undefined {
  return demoPrecincts.find((p) => p.siteIds.includes(siteId));
}

/** Kept for the geofencing guard: iOS monitors at most 20 regions. */
export const PRECINCT_COUNT = demoPrecincts.length;
export { MIN_GEOFENCE_RADIUS_M };
