import { colors } from './colors';

/**
 * The map, in Sākṣī's palette.
 *
 * Built here rather than fetched as a hosted style so the map obeys the same
 * rule as every other surface: no component names a hex value.
 *
 * It is deliberately louder than the app's chrome. An earlier version pitched
 * every fill to sit quietly against the page, and the result was a white wash —
 * roads, landuse and buildings all landed within 1.1–1.6:1 of the ground, so the
 * map read as empty boxes. Map colour is not decoration: green for vegetation,
 * blue for water, and a casing around every road are the conventions that make a
 * map legible at a glance. §30's restraint governs the app's chrome, not the
 * readability of something a person is navigating by.
 *
 * Still lean next to a general-purpose style — Lumbini has no motorways, no
 * railways, no ferries and no airports, and every layer costs parse time on a
 * phone that is also running the camera.
 *
 * Tiles come from OpenFreeMap: OpenStreetMap data, OpenMapTiles schema, maxzoom
 * 14 with overzoom above it, no API key and no request cap. MapLibre adds the
 * required attribution itself.
 */

export const MAP_TILES_URL = 'https://tiles.openfreemap.org/planet';
export const MAP_GLYPHS_URL = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/** Ships with OpenFreeMap's font stack; do not name a family we have not verified. */
const FONT = ['Noto Sans Regular'];

/** Casings are drawn beneath fills, so each casing layer precedes its fill. */
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
      paint: { 'background-color': colors.mapBase },
    },
    {
      id: 'landuse',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'landuse',
      paint: { 'fill-color': colors.mapLanduse },
    },
    {
      id: 'landcover-wood',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['wood', 'forest']]],
      // The sacred garden is heavily planted; the tree cover is most of what
      // distinguishes the precinct from the plain around it.
      paint: { 'fill-color': colors.mapVegetation },
    },
    {
      id: 'landcover-grass',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'landcover',
      filter: ['in', ['get', 'class'], ['literal', ['grass', 'meadow', 'farmland']]],
      paint: { 'fill-color': colors.mapPark, 'fill-opacity': 0.7 },
    },
    {
      id: 'park',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'park',
      paint: { 'fill-color': colors.mapPark },
    },
    {
      id: 'water',
      type: 'fill' as const,
      source: 'openmaptiles',
      'source-layer': 'water',
      paint: { 'fill-color': colors.mapWater },
    },
    {
      id: 'waterway',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'waterway',
      // The Kenzo Tange master plan is organised around a central canal — the
      // strongest line on the whole site, and worth drawing explicitly.
      paint: {
        'line-color': colors.mapWater,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1, 18, 6],
      },
    },

    // ── Roads: casing beneath fill, which is what makes a road read as a road ─
    {
      id: 'road-major-casing',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': colors.mapRoadCasing,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 3, 16, 11, 18, 22],
      },
    },
    {
      id: 'road-major',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['primary', 'secondary', 'tertiary', 'trunk']]],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': colors.mapRoad,
        'line-width': ['interpolate', ['linear'], ['zoom'], 11, 1.5, 16, 7.5, 18, 16],
      },
    },
    {
      id: 'road-minor-casing',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': colors.mapRoadCasing,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 2, 16, 6, 18, 13],
      },
    },
    {
      id: 'road-minor',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track']]],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': colors.mapRoad,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 1, 16, 3.5, 18, 9],
      },
    },
    {
      id: 'path',
      type: 'line' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation',
      filter: ['in', ['get', 'class'], ['literal', ['path', 'pedestrian', 'footway']]],
      layout: { 'line-cap': 'round' as const },
      paint: {
        'line-color': colors.mapPath,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 1.2, 16, 3, 18, 6],
        // Dashed: a walking path is not a road and should not be mistaken for
        // one at a glance, which matters when the paths are the way you move
        // through the sacred garden.
        'line-dasharray': [2, 1.5],
      },
    },

    {
      id: 'building',
      type: 'fill-extrusion' as const,
      source: 'openmaptiles',
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': colors.mapBuilding,
        // Only one of the 318 buildings OSM knows here carries a height, so
        // render_height is null almost everywhere. Kept low: these are context,
        // and the monuments are drawn with massing of their own.
        'fill-extrusion-height': ['coalesce', ['get', 'render_height'], 3],
        'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true,
      },
    },

    // ── Labels ───────────────────────────────────────────────────────────────
    {
      id: 'water-label',
      type: 'symbol' as const,
      source: 'openmaptiles',
      'source-layer': 'water_name',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT,
        'text-size': 11,
        'text-max-width': 8,
      },
      paint: {
        'text-color': colors.mapLabel,
        'text-halo-color': colors.mapLabelHalo,
        'text-halo-width': 1.4,
      },
    },
    {
      id: 'park-label',
      type: 'symbol' as const,
      source: 'openmaptiles',
      'source-layer': 'park',
      minzoom: 13,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT,
        'text-size': 11,
        'text-max-width': 9,
      },
      paint: {
        'text-color': colors.mapLabel,
        'text-halo-color': colors.mapLabelHalo,
        'text-halo-width': 1.4,
      },
    },
    {
      id: 'road-label',
      type: 'symbol' as const,
      source: 'openmaptiles',
      'source-layer': 'transportation_name',
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT,
        'text-size': 11,
        'symbol-placement': 'line' as const,
        'text-rotation-alignment': 'map' as const,
      },
      paint: {
        'text-color': colors.mapLabel,
        'text-halo-color': colors.mapLabelHalo,
        'text-halo-width': 1.6,
      },
    },
    {
      id: 'poi-label',
      type: 'symbol' as const,
      source: 'openmaptiles',
      'source-layer': 'poi',
      minzoom: 15,
      // Only what a visitor to a heritage site needs. The full POI set buries
      // the monuments under restaurants and cash machines.
      filter: [
        'in',
        ['get', 'class'],
        ['literal', ['place_of_worship', 'attraction', 'lodging', 'toilets', 'information', 'park']],
      ],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': FONT,
        'text-size': 10,
        'text-max-width': 8,
        'text-anchor': 'top' as const,
        'text-offset': [0, 0.4],
      },
      paint: {
        'text-color': colors.mapLabel,
        'text-halo-color': colors.mapLabelHalo,
        'text-halo-width': 1.4,
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
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 12, 16, 15],
        'text-max-width': 8,
      },
      paint: {
        'text-color': colors.mapLabel,
        'text-halo-color': colors.mapLabelHalo,
        'text-halo-width': 1.6,
      },
    },
  ],
};

/** MapLibre wants the style as a JSON string, not an object. */
export const sakshiMapStyleJSON = JSON.stringify(sakshiMapStyle);
