import { colors } from './colors';

/**
 * The map, in Sākṣī's palette.
 *
 * Built here rather than fetched as a hosted style so the map obeys the same
 * rule as every other surface: no component names a hex value, and the ground
 * under a site plan is the same ground as the screen behind it. A stock style
 * would put Google's or OpenMapTiles' idea of a landscape inside an app whose
 * whole visual argument is Lumbini stone under daylight.
 *
 * Tiles come from OpenFreeMap — OpenStreetMap data, OpenMapTiles schema, no API
 * key, no request limit. MapLibre adds the required attribution itself.
 *
 * Deliberately lean: ~15 layers against the 55 in a general-purpose style.
 * Lumbini has no motorways, no railways, no ferries and no airports, and every
 * layer costs parse time and draw calls on a mid-range Android phone that is
 * also running the camera.
 */

export const MAP_TILES_URL = 'https://tiles.openfreemap.org/planet';
export const MAP_GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Ships with OpenFreeMap's font stack; do not name a family we have not verified. */
const FONT = ['Noto Sans Regular'];

export const sakshiMapStyle = {
  version: 8 as const,
  name: 'Sākṣī',
  glyphs: MAP_GLYPHS_URL,
  sources: {
    openmaptiles: { type: 'vector' as const, url: MAP_TILES_URL },
  },
  layers: [
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': colors.background },
    },
    {
      id: 'landcover-wood',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['==', ['get', 'class'], 'wood'],
      // Lumbini's sacred garden is heavily planted; the tree cover is most of
      // what distinguishes the precinct from the plain around it.
      paint: { 'fill-color': colors.resolved, 'fill-opacity': 0.18 },
    },
    {
      id: 'park',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': colors.resolved, 'fill-opacity': 0.12 },
    },
    {
      id: 'water',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': colors.alignmentLocked, 'fill-opacity': 0.28 },
    },
    {
      id: 'waterway',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'waterway',
      // The Kenzo Tange master plan is organised around a central canal — it is
      // the strongest line in the whole site and worth drawing explicitly.
      paint: { 'line-color': colors.alignmentLocked, 'line-opacity': 0.4, 'line-width': 2 },
    },
    {
      id: 'landuse',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'landuse',
      paint: { 'fill-color': colors.surfaceSecondary, 'fill-opacity': 0.6 },
    },
    {
      id: 'path',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'path'],
      paint: {
        'line-color': colors.sandstone,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.6, 18, 3],
        'line-opacity': 0.9,
      },
    },
    {
      id: 'road-minor',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
      paint: {
        'line-color': colors.surface,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 18, 8],
      },
    },
    {
      id: 'road-major',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]],
      paint: {
        'line-color': colors.surface,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 18, 14],
      },
    },
    {
      id: 'building',
      type: 'fill-extrusion' as const,
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': colors.sandstone,
        // OSM building coverage around Lumbini is sparse and mostly untagged
        // for height, so `render_height` is frequently null. The fallback keeps
        // a footprint visible rather than flattening it to nothing.
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 4],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.75,
      },
    },
    {
      id: 'place-label',
      type: 'symbol' as const,
      source: 'openmaptiles',
      'source-layer': 'place',
      filter: ['in', ['get', 'class'], ['literal', ['village', 'town', 'suburb', 'neighbourhood']]],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT,
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 11, 16, 14],
        'text-max-width': 8,
      },
      paint: {
        'text-color': colors.textSecondary,
        'text-halo-color': colors.background,
        'text-halo-width': 1.4,
      },
    },
  ],
};

/** MapLibre wants the style as a JSON string, not an object. */
export const sakshiMapStyleJSON = JSON.stringify(sakshiMapStyle);
