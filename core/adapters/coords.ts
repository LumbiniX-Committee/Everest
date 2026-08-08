/**
 * core/adapters/coords.ts — the coordinate seam.
 *
 * The app (lane B) speaks `{ latitude, longitude }` (its `Coordinate` type).
 * core/ and shared/ speak `{ lat, lon }` (`Coords`). Rather than force one
 * convention across two codebases — which would mean rewriting either every
 * screen or every logic module — we convert at the boundary, here.
 *
 * Import these where app data crosses into core logic and back:
 *
 *   import { toCoords, toLatLng } from '@/core';
 *   const events = watcher.update(toCoords(position.coordinate), t);
 *
 * `LatLng` is declared structurally (not imported from the app's `types/`) so
 * core/ stays independent of lane B. The app's `Coordinate` is assignable to it
 * because the shapes match.
 */

import type { Coords } from '../../shared/types.ts';

/** The app's coordinate shape, declared structurally so core owns no app import. */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** App `{ latitude, longitude }` → core `{ lat, lon }`. */
export function toCoords(c: LatLng): Coords {
  return { lat: c.latitude, lon: c.longitude };
}

/** Core `{ lat, lon }` → app `{ latitude, longitude }`. */
export function toLatLng(c: Coords): LatLng {
  return { latitude: c.lat, longitude: c.lon };
}
