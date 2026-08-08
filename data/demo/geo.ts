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


/**
 * Monument massing.
 *
 * OpenStreetMap knows 318 buildings around Lumbini and the height of exactly
 * one of them; 315 are tagged only `building=yes`. Extruding that data gives a
 * field of identical 4 m slabs, which is what "boxes" means — the fault was a
 * blanket fallback height standing in for data that does not exist.
 *
 * The monuments are the content, so they get massing of their own rather than
 * inheriting the shed default. These figures are *schematic*: heights are
 * approximate and footprints are regular forms sized from each site's own
 * geofence radius. They are a legible massing model, not a survey, and nothing
 * downstream should treat them as measurement.
 *
 * Where a real dimension is well known it is used — the World Peace Pagoda is
 * about 41 m — and where it is not, the figure is a plausible order of
 * magnitude rather than a precise claim.
 */
type Massing = {
  /** Approximate height above ground, metres. Schematic. */
  height: number;
  /** Round forms for stupas and domes, square for halls and shelters. */
  form: 'round' | 'square';
};

const MASSING: Record<string, Massing> = {
  'maya-devi-temple': { height: 10, form: 'square' }, // the 2003 shelter over the remains
  'ashokan-pillar': { height: 7, form: 'round' }, // the column standing above ground
  'marker-stone': { height: 1, form: 'square' }, // a slab, inside the temple
  'vihara-remains': { height: 2, form: 'square' }, // excavated brick courses
  'myanmar-temple': { height: 30, form: 'round' }, // Lokamani Cula Pagoda
  'china-temple': { height: 18, form: 'square' },
  'korean-temple': { height: 20, form: 'square' },
  'gautami-nuns-temple': { height: 15, form: 'square' },
  'world-peace-pagoda': { height: 41, form: 'round' }, // the stupa's known height
  tilaurakot: { height: 3, form: 'square' }, // excavated palace footings
  ramagrama: { height: 7, form: 'round' }, // the unopened relic mound
  // puskarini is deliberately absent: it is a pond, and extruding water into a
  // building is exactly the kind of wrong the rest of this file avoids.
};

/** A square footprint, sized from the site's own reach. */
function square(
  centre: { latitude: number; longitude: number },
  metres: number,
): number[][][] {
  const dLat = metres / 111_320;
  const dLon = metres / (111_320 * Math.cos((centre.latitude * Math.PI) / 180));
  return [
    [
      [centre.longitude - dLon, centre.latitude - dLat],
      [centre.longitude + dLon, centre.latitude - dLat],
      [centre.longitude + dLon, centre.latitude + dLat],
      [centre.longitude - dLon, centre.latitude + dLat],
      [centre.longitude - dLon, centre.latitude - dLat],
    ],
  ];
}

/**
 * The monuments as volumes.
 *
 * Footprints are a fraction of each site's geofence radius — the geofence is
 * how close you must be, not how large the thing is, and using it directly
 * would make the Marker Stone a 20 m block.
 */
export const monumentGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: demoSites
    .filter((site) => MASSING[site.id])
    .map((site): Feature<Polygon> => {
      const massing = MASSING[site.id];
      const footprint = Math.max(6, (site.radiusMeters ?? 30) * 0.45);
      return {
        type: 'Feature',
        id: site.id,
        geometry: {
          type: 'Polygon',
          coordinates:
            massing.form === 'round'
              ? circle(site.coordinate, footprint, 24)
              : square(site.coordinate, footprint),
        },
        properties: {
          id: site.id,
          name: site.name,
          height: massing.height,
          form: massing.form,
        },
      };
    }),
};

/** Water bodies the seed knows about, so a pond is drawn as a pond. */
export const waterGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: demoSites
    .filter((site) => site.id === 'puskarini')
    .map((site): Feature<Polygon> => ({
      type: 'Feature',
      id: site.id,
      geometry: {
        type: 'Polygon',
        coordinates: square(site.coordinate, Math.max(10, (site.radiusMeters ?? 25) * 0.8)),
      },
      properties: { id: site.id, name: site.name },
    })),
};
