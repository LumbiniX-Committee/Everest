import { MIN_GEOFENCE_RADIUS_M, type Precinct } from '@/types';

/**
 * The geofenced areas of Lumbini.
 *
 * Centres and radii are authored rather than computed from the site list. A
 * computed centroid drifts every time a site is added, which would silently
 * move a geofence that someone has already walked into — and the radii below
 * encode judgements about approach, not just about spread.
 *
 * Measured spreads, for the record:
 *   Sacred Garden      4 sites within 92 m (closest pair 39 m)
 *   Eternal Flame      549 m north of the garden centre
 *   World Peace Pagoda 2.3 km north
 *
 * The three do not overlap at these radii, so an arrival is never ambiguous.
 */
export const demoPrecincts: Precinct[] = [
  {
    id: 'sacred-garden',
    name: 'The Sacred Garden',
    summary: 'The birthplace precinct — temple, pillar, pond and Bodhi tree.',
    centre: { latitude: 27.46907, longitude: 83.27585 },
    // 150 m: the monuments span 92 m, and the extra margin means the trigger
    // fires on approach along the entrance path rather than once you are
    // already standing among them.
    radiusMetres: 150,
    siteIds: ['maya-devi-temple', 'ashoka-pillar', 'puskarini-pond', 'bodhi-tree'],
  },
  {
    id: 'eternal-flame',
    name: 'The Eternal Peace Flame',
    summary: 'Lit in 1986, and burning since.',
    centre: { latitude: 27.47418, longitude: 83.27594 },
    // At MIN, deliberately: 549 m from the garden, so a wider radius would
    // start to overlap the walk between the two and fire early.
    radiusMetres: MIN_GEOFENCE_RADIUS_M,
    siteIds: ['eternal-flame'],
  },
  {
    id: 'world-peace-pagoda',
    name: 'The World Peace Pagoda',
    summary: 'The northern stupa, beyond the monastic zones.',
    centre: { latitude: 27.49015, longitude: 83.26758 },
    // Isolated by 2.3 km, and approached across open ground where a fix is
    // slower to settle — a wider radius buys the OS time to notice.
    radiusMetres: 200,
    siteIds: ['world-peace-pagoda'],
  },
];

export function findPrecinct(id: string): Precinct | undefined {
  return demoPrecincts.find((p) => p.id === id);
}

/** The precinct a site belongs to, if any. */
export function precinctForSite(siteId: string): Precinct | undefined {
  return demoPrecincts.find((p) => p.siteIds.includes(siteId));
}
