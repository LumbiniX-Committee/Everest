import type { HomeHub } from '@/types';

/**
 * Where each starting area opens on the map.
 *
 * These are the town or site centres the map frames on first open, not
 * measurements of any monument, so nothing is recorded against them.
 */
export const HUB_CENTRES: Record<Exclude<HomeHub, 'unset' | 'near-me'>, [number, number]> = {
  lumbini: [83.2757, 27.4692],
  kathmandu: [85.324, 27.7083],
  pokhara: [83.9856, 28.2096],
  chitwan: [84.4334, 27.5291],
};

export function hubCentre(hub: HomeHub): [number, number] | null {
  return hub === 'unset' || hub === 'near-me' ? null : HUB_CENTRES[hub];
}

/**
 * The area each hub's offline map pack covers. The same boxes the place
 * listings are built from (tools/data/build-places.mjs), so a saved hub has
 * a map under every listed place.
 */
export const HUB_BOUNDS: Record<Exclude<HomeHub, 'unset' | 'near-me'>, { west: number; south: number; east: number; north: number }> = {
  lumbini: { south: 27.4, west: 83.0, north: 27.62, east: 83.36 },
  kathmandu: { south: 27.55, west: 85.2, north: 27.82, east: 85.55 },
  pokhara: { south: 28.13, west: 83.88, north: 28.32, east: 84.06 },
  chitwan: { south: 27.45, west: 84.25, north: 27.66, east: 84.56 },
};
