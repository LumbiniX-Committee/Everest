import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

import { demoPrecincts } from './precincts';
import { demoSites } from './sites';

/**
 * The app's own geometry, as GeoJSON.
 *
 * Built from the same `demoPrecincts` and `demoSites` the rest of the app uses,
 * so a coordinate corrected in one place moves on the map too. Nothing here is
 * fetched: the basemap needs a network, but the monuments, the precinct rings
 * and where you are standing do not. On a site with patchy signal the layer
 * that matters keeps drawing after the tiles stop.
 */

/**
 * A circle as a polygon, because GeoJSON has no circle.
 *
 * 64 segments: at a 150 m radius on a phone screen the flat sides of a 32-gon
 * are visible at the edges, and 128 doubles the vertex count for nothing the
 * eye can resolve.
 */
function circle(
  centre: { latitude: number; longitude: number },
  radiusMetres: number,
  segments = 64,
): number[][][] {
  const ring: number[][] = [];
  // Degrees per metre, corrected for latitude — at Lumbini's 27.47°N a degree
  // of longitude is about 98.5 km against 111 km for latitude, so a circle
  // drawn without the cosine comes out visibly oval.
  const dLat = radiusMetres / 111_320;
  const dLon = radiusMetres / (111_320 * Math.cos((centre.latitude * Math.PI) / 180));

  for (let i = 0; i <= segments; i += 1) {
    const theta = (i / segments) * 2 * Math.PI;
    ring.push([
      centre.longitude + dLon * Math.cos(theta),
      centre.latitude + dLat * Math.sin(theta),
    ]);
  }
  return [ring];
}

/** Precinct rings — the same areas the geofences watch, drawn to scale. */
export const precinctGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: demoPrecincts.map((p): Feature<Polygon> => ({
    type: 'Feature',
    id: p.id,
    geometry: { type: 'Polygon', coordinates: circle(p.centre, p.radiusMetres) },
    properties: {
      id: p.id,
      name: p.name,
      summary: p.summary,
      radiusMetres: p.radiusMetres,
      siteCount: p.siteIds.length,
    },
  })),
};

/** Monuments, as points. */
export const siteGeoJSON: FeatureCollection<Point> = {
  type: 'FeatureCollection',
  features: demoSites.map((site): Feature<Point> => ({
    type: 'Feature',
    id: site.id,
    geometry: {
      type: 'Point',
      coordinates: [site.coordinate.longitude, site.coordinate.latitude],
    },
    properties: {
      id: site.id,
      name: site.name,
      summary: site.summary,
      condition: site.condition,
    },
  })),
};

/**
 * Where the map opens.
 *
 * Centred on the Sacred Garden rather than the bounding centre of all sites:
 * the Peace Pagoda is 2.3 km north and framing everything would open on empty
 * ground with the birthplace as a speck.
 */
export const MAP_HOME = {
  centre: [83.27585, 27.46907] as [number, number],
  zoom: 16.5,
  /** Tilted, because the point is to read the ground as a place, not a diagram. */
  pitch: 55,
  /**
   * The Tange master plan runs close to north–south, so a small rotation puts
   * the canal axis on the screen diagonal instead of straight up it.
   */
  bearing: -18,
};
