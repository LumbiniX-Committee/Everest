import type { Feature, FeatureCollection, Point, Polygon } from 'geojson';

import { demoPrecincts } from './precincts';
import { demoSites } from '../generated/sites';

/**
 * The app's own geometry, as GeoJSON.
 *
 * Built from the same `demoPrecincts` and `demoSites` the rest of the app uses,
 * so a coordinate corrected in one place moves on the map too. Nothing here is
 * fetched: the basemap needs a network, but the monuments, the precinct rings
 * and where you are standing do not. On a site with patchy signal the layer
 * that matters keeps drawing after the tiles stop.
 */

type LatLng = { latitude: number; longitude: number };

/**
 * How finely a circle of this radius has to be tessellated.
 *
 * Derived rather than fixed at 64. The visible error of an n-gon is its
 * sagitta, r·(1−cos(π/n)); solving for a tolerance gives the segment count that
 * actually matters at each size, and a precinct boundary is a soft line on the
 * ground where sub-metre fidelity means nothing. 64 segments was over-specified
 * for the 150 m rings and under-specified for the 250 m one — one constant
 * cannot be right for both.
 */
const RING_TOLERANCE_M = 0.8;

function segmentsFor(radiusMetres: number): number {
  const n = Math.ceil(Math.PI / Math.acos(Math.max(-1, 1 - RING_TOLERANCE_M / radiusMetres)));
  return Math.min(72, Math.max(24, n));
}

/** Degrees per metre at a latitude — longitude needs the cosine, latitude does not. */
function degreesPerMetre(centre: LatLng): { dLat: number; dLon: number } {
  return {
    dLat: 1 / 111_320,
    dLon: 1 / (111_320 * Math.cos((centre.latitude * Math.PI) / 180)),
  };
}

/** A point at a bearing and distance from a centre. Bearing 0 = north. */
function project(centre: LatLng, bearingDeg: number, metres: number): number[] {
  const { dLat, dLon } = degreesPerMetre(centre);
  const theta = (bearingDeg * Math.PI) / 180;
  return [
    centre.longitude + dLon * metres * Math.sin(theta),
    centre.latitude + dLat * metres * Math.cos(theta),
  ];
}

/**
 * A circle as a polygon, because GeoJSON has no circle.
 */
function circle(centre: LatLng, radiusMetres: number, segments?: number): number[][][] {
  const n = segments ?? segmentsFor(radiusMetres);
  const ring: number[][] = [];
  for (let i = 0; i <= n; i += 1) ring.push(project(centre, (i / n) * 360, radiusMetres));
  return [ring];
}

/**
 * Where each precinct is entered, as a compass bearing from its centre, and how
 * wide the opening is.
 *
 * Presentation, not geofence data — which is why it lives here and not in
 * `demoPrecincts`. The geofence is a circle and stays one; a wall drawn with no
 * way in is the part that was wrong, not the boundary it traces. Bearings
 * follow the approach each precinct is actually walked from: the Sacred Garden
 * from the south gate, the monastic zones from the central canal between them.
 */
const PRECINCT_GATES: Record<string, { bearing: number; widthDeg: number }> = {
  'sacred-garden': { bearing: 180, widthDeg: 24 },
  'monastic-east': { bearing: 250, widthDeg: 20 },
  'monastic-west': { bearing: 95, widthDeg: 20 },
  'world-peace-pagoda': { bearing: 180, widthDeg: 18 },
  tilaurakot: { bearing: 135, widthDeg: 18 },
  ramagrama: { bearing: 270, widthDeg: 18 },
};

const DEFAULT_GATE = { bearing: 180, widthDeg: 20 };

/**
 * How tall a precinct wall stands, from how much it encloses.
 *
 * The Sacred Garden holds five monuments and reads as the enclosure it is; a
 * single-site precinct 41 km away is a marker on open ground and should not
 * loom like a citadel. Derived from the site count so a precinct gaining a site
 * gains presence without anyone editing a table.
 */
function wallHeight(siteCount: number): number {
  return Math.min(5.5, 2.6 + siteCount * 0.5);
}

/** How thick, so a 250 m precinct does not get a wall you cannot see. */
function wallThickness(radiusMetres: number): number {
  return Math.min(9, Math.max(4, radiusMetres * 0.035));
}

/**
 * The wall itself: an arc, not a ring, and a band, not a disc.
 *
 * Two things were wrong with extruding the whole geofence circle. It was a
 * solid 150 m cylinder, so at the map's 55–65° pitch it stood in front of the
 * monuments it was supposed to enclose and buried them; and it was six times
 * more painted area than a boundary needs, which on a phone GPU is the cost
 * that actually shows. A band traces the boundary, leaves the inside visible,
 * and shades a fraction of the pixels.
 *
 * The gap is the gateway. It is what makes this read as a precinct rather than
 * a highlighted region, and it is also where the walk enters.
 */
function wallBand(centre: LatLng, radiusMetres: number, gate: { bearing: number; widthDeg: number }) {
  const inner = radiusMetres - wallThickness(radiusMetres);
  const sweep = 360 - gate.widthDeg;
  const start = gate.bearing + gate.widthDeg / 2;
  // Segment count follows the full circle's, scaled to the arc actually drawn.
  const n = Math.max(12, Math.round((segmentsFor(radiusMetres) * sweep) / 360));

  const ring: number[][] = [];
  for (let i = 0; i <= n; i += 1) ring.push(project(centre, start + (i / n) * sweep, radiusMetres));
  for (let i = n; i >= 0; i -= 1) ring.push(project(centre, start + (i / n) * sweep, inner));
  ring.push(ring[0]);
  return [ring];
}

function gateOf(id: string) {
  return PRECINCT_GATES[id] ?? DEFAULT_GATE;
}

/**
 * The precinct walls, as volumes with a gateway.
 *
 * `height` and `base` are carried as properties so the layer can read them with
 * a `['get', …]` expression instead of the map needing one layer per precinct.
 */
export const precinctWallGeoJSON: FeatureCollection<Polygon> = {
  type: 'FeatureCollection',
  features: demoPrecincts.map((p): Feature<Polygon> => {
    const height = wallHeight(p.siteIds.length);
    return {
      type: 'Feature',
      id: p.id,
      geometry: { type: 'Polygon', coordinates: wallBand(p.centre, p.radiusMetres, gateOf(p.id)) },
      properties: {
        id: p.id,
        name: p.name,
        summary: p.summary,
        height,
        /** The capping course sits on top of the wall — see `precinct-coping`. */
        copingBase: height,
        copingHeight: height + 0.45,
        siteCount: p.siteIds.length,
      },
    };
  }),
};

/**
 * The ground each precinct encloses, flat.
 *
 * Drawn rather than extruded, so the enclosure still reads from above without
 * anything standing between the camera and the monuments. This is the layer
 * that says "you are inside something"; the wall says where its edge is.
 */
export const precinctGroundGeoJSON: FeatureCollection<Polygon> = {
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

/**
 * The precinct discs.
 *
 * Kept as the flat outline the native map and the schematic plan draw — neither
 * has the wall's gateway or its capping course, and neither needs them.
 */
export const precinctGeoJSON = precinctGroundGeoJSON;

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
 * Camera distances, named by what the camera is for.
 *
 * ── Why these exist ─────────────────────────────────────────────────────────
 *
 * The full-screen map used to open at `MAP_HOME.zoom + 1.5`, which is zoom 18.
 * At Lumbini's latitude that is 0.27 m per pixel: a phone shows about a hundred
 * metres of ground, so the Sacred Garden — whose five monuments span 47 m —
 * filled the screen with one of them and no context. You could not see where
 * you were going, which for an exploration game is the whole problem.
 *
 * `world` shows roughly 300 m across, so the precinct, the monuments in it and
 * the ground between them are all legible at once, and the figure has somewhere
 * to walk *to*. `close` is for the moment you are standing at a monument and
 * reading about it — the camera comes in because the attention has narrowed.
 *
 * Pitch rises with closeness for the same reason: a plan wants to be read from
 * above, a place wants to be stood in.
 */
export const MAP_CAMERA = {
  /** The inline panel on Tīrtha. A plan of the ground, not a view from in it. */
  overview: { zoom: 15.4, pitch: 42 },
  /** The game camera. Far enough back to see where you are going. */
  world: { zoom: 16.4, pitch: 62 },
  /** Standing at a monument, with its story open. */
  close: { zoom: 17.6, pitch: 66 },
} as const;


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
export type Massing = {
  /** Approximate height above ground, metres. Schematic. */
  height: number;
  /** Round forms for stupas and domes, square for halls and shelters. */
  form: 'round' | 'square' | 'water';
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
  // Water, not a building. It is listed so anything asking what shape this
  // place is gets an answer; the extrusion layer below filters it out, because
  // extruding water into a building is exactly the kind of wrong this file
  // avoids.
  puskarini: { height: 0, form: 'water' },
};

/**
 * What shape a place is, for anything that has to draw it without a photograph.
 *
 * Three of the twelve sites carry a photograph. The other nine are not going to
 * grow one because a screen needs a picture, so the honest alternative is a
 * schematic — a stupa dome, a pitched shelter, a stepped tank — drawn from the
 * same massing the map extrudes. It is a diagram of a kind of thing, labelled
 * as one, rather than a grey rectangle or a stock image of somewhere else.
 */
export function massingFor(siteId: string): Massing | undefined {
  return MASSING[siteId];
}

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
    .filter((site) => MASSING[site.id] && MASSING[site.id].form !== 'water')
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
