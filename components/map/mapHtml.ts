import {
  PLACES,
  MAP_CAMERA,
  MAP_HOME,
  MAP_SCANS,
  modelPlacements,
  monumentGeoJSON,
  scanSpots,
  precinctGroundGeoJSON,
  siteGeoJSON,
  waterGeoJSON,
} from '@/data';
import { colors, MAP_GLYPHS_URL, MAP_TILES_URL, sakshiMapStyle } from '@/theme';

import { monumentModelsScript } from './monumentModels';
import { townLayerScript } from './townLayer';
import { GLTF_LOADER_JS } from './gltfLoader.generated';
import { MAPLIBRE_CSS, MAPLIBRE_JS, THREE_JS } from './vendor.generated';

/**
 * The walking figure: Renderpeople's "Nathan Animated 003", a scanned person
 * with a walk cycle (CC BY 4.0, credited in the map's attribution and in
 * LICENCES.md). Served by the website with an open CORS header; the robed
 * figure below stands in until it loads, offline, or if it fails.
 */
/** Where the website serves our monument models (as in services/models). */
const MODELS_URL = process.env.EXPO_PUBLIC_MODELS_URL?.trim() || 'https://saksi-beta.vercel.app/models';
const WALKER_URL = `${MODELS_URL.replace(/\/models\/?$/, '')}/characters/walker.glb`;

/** One point per scan spot, labelled with the first scan's name and how many share it. */
function scanSpotsGeoJSON() {
  return {
    type: 'FeatureCollection' as const,
    features: scanSpots().map((spot) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [spot.longitude, spot.latitude] },
      properties: { scanId: spot.scanIds[0], count: spot.scanIds.length, label: spot.label },
    })),
  };
}

/** CC BY asks for credit where the work is shown: on the map, beside the tile credits. */
const WALKER_CREDIT =
  'Walking figure: <a href="https://sketchfab.com/3d-models/nathan-animated-003-walking-3d-man-143a2b1ea5eb4385ae90a73657aca3bc" target="_blank">Renderpeople</a>, <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">CC BY 4.0</a>';

/** CC BY credit for the real scans standing on the map, named by creator. */
const SCANS_CREDIT = `3D scans on the map: ${[...new Set(MAP_SCANS.map((scan) => scan.creator))].join(', ')} (Sketchfab, CC BY 4.0)`;

/** The monument models are built from published descriptions, not measured: say so where they are seen. */
const MONUMENTS_CREDIT = '3D monuments: schematic models, not surveys';

/**
 * The basemap, terrain and fonts all load through the page's own \`saksi://\`
 * protocol (see OFFLINE_PROTOCOL), so a saved copy on the phone can stand in
 * when the network cannot.
 */
const OFFLINE_STYLE = {
  ...sakshiMapStyle,
  glyphs: 'saksi://glyphs/{fontstack}/{range}',
  sources: {
    ...sakshiMapStyle.sources,
    openmaptiles: {
      type: 'vector' as const,
      tiles: ['saksi://ofm/{z}/{x}/{y}'],
      minzoom: 0,
      maxzoom: 14,
      attribution:
        '<a href="https://openfreemap.org" target="_blank">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>',
    },
  },
};

/**
 * Network first, saved copy second.
 *
 * Online, every request goes straight to its server, as it always did. Only a
 * failed fetch asks the app for a tile saved in an offline pack; the app
 * answers through window.sakshiTileReply. No saved copy means the tile stays
 * blank, exactly as an offline map without packs always behaved.
 */
const OFFLINE_PROTOCOL = `
  (function () {
    var waiting = {};
    var nextId = 1;
    var template = null;
    function basemapTemplate() {
      if (!template) {
        template = fetch(${JSON.stringify(MAP_TILES_URL)})
          .then(function (r) { if (!r.ok) throw new Error('tilejson ' + r.status); return r.json(); })
          .then(function (j) { return j.tiles[0]; })
          .catch(function (e) { template = null; throw e; });
      }
      return template;
    }
    function networkUrl(kind, parts) {
      if (kind === 'ofm') return basemapTemplate().then(function (t) {
        return t.replace('{z}', parts[0]).replace('{x}', parts[1]).replace('{y}', parts[2]);
      });
      if (kind === 'dem') return Promise.resolve('https://s3.amazonaws.com/elevation-tiles-prod/terrarium/' + parts.join('/') + '.png');
      if (kind === 'glyphs') return Promise.resolve(${JSON.stringify(MAP_GLYPHS_URL)}
        .replace('{fontstack}', encodeURIComponent(parts[0])).replace('{range}', parts[1]));
      return Promise.reject(new Error('unknown ' + kind));
    }
    function fromPhone(key) {
      return new Promise(function (resolve) {
        var id = nextId++;
        waiting[id] = resolve;
        post({ type: 'tile-request', id: id, key: key });
        setTimeout(function () { if (waiting[id]) { delete waiting[id]; resolve(null); } }, 8000);
      });
    }
    window.sakshiTileReply = function (id, base64) {
      var resolve = waiting[id];
      if (!resolve) return;
      delete waiting[id];
      if (!base64) return resolve(null);
      var bin = atob(base64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      resolve(bytes.buffer);
    };
    maplibregl.addProtocol('saksi', function (params, abort) {
      var parts = params.url.slice('saksi://'.length).split('/').map(decodeURIComponent);
      var kind = parts.shift();
      var key = kind + '/' + parts.join('/');
      return networkUrl(kind, parts)
        .then(function (url) { return fetch(url, { signal: abort.signal }); })
        .then(function (r) {
          // An empty tile is an answer, not a failure: open ground has no data.
          if (r.status === 204 || r.status === 404) return { data: new ArrayBuffer(0) };
          if (!r.ok) throw new Error(String(r.status));
          return r.arrayBuffer().then(function (data) { return { data: data }; });
        })
        .catch(function (error) {
          if (abort.signal.aborted) throw error;
          return fromPhone(key).then(function (data) {
            if (!data) throw error;
            return { data: data };
          });
        });
    });
  })();
`;

export type MapHtmlOptions = {
  /**
   * Draw a figure at the reported position and keep the camera with it.
   *
   * Off for the inline panel on Tīrtha, which is a plan of the ground rather
   * than a view from inside it.
   */
  avatar?: boolean;
  /** Fills the viewport, so the camera sits lower and closer. */
  fullscreen?: boolean;
  /**
   * Whether the map handles gestures at all.
   *
   * Off for the inline panel. That panel lives inside a scrolling page, and a
   * map that consumes touches there competes with the page for every drag —
   * the ScrollView generally wins on Android, so pinch-zoom lands
   * intermittently and panning fights scrolling. An inert preview scrolls
   * cleanly and opens the full-screen map, where gestures have the surface to
   * themselves.
   */
  interactive?: boolean;
  /** Safe area inset top (in pixels) for floating map control offset. */
  topInset?: number;
  /** Where the map opens, as [longitude, latitude]. Defaults to Lumbini. */
  center?: readonly [number, number];
};

/** The ways the map can be drawn. Satellite and hybrid need a working imagery provider. */
export type MapMode = 'standard' | '3d' | 'terrain' | 'satellite' | 'hybrid';

/**
 * The MapLibre GL JS document rendered inside the WebView.
 *
 * A pure function rather than a template inlined in the component, so the exact
 * document that ships can be written to a file and opened in a browser. A map
 * that only exists inside a WebView on a phone is a map nobody can check.
 *
 * The style, the precinct rings and the monument points are the same objects
 * the native path passes to MapLibre Native — GL JS and MapLibre Native read
 * the same style specification, which is what lets one set of definitions serve
 * both.
 *
 * The figure is the exception, and the reason this path exists at all: MapLibre
 * Native has no support for 3D models, so a character on the map is only
 * possible through GL JS and a custom layer. That is a capability difference,
 * not a preference.
 */
function placesGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: PLACES.map((place) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [place.coordinate.longitude, place.coordinate.latitude] },
      properties: { id: place.id, name: place.name },
    })),
  };
}

export function buildMapHtml({
  avatar = false,
  fullscreen = false,
  interactive = fullscreen,
  topInset = 0,
  center = MAP_HOME.centre,
}: MapHtmlOptions = {}): string {
  // Named camera rather than an offset from MAP_HOME — see MAP_CAMERA for why
  // the old `+ 1.5` opened the world about three times too close to play in.
  const camera = fullscreen ? MAP_CAMERA.world : MAP_CAMERA.overview;
  const zoom = camera.zoom;
  // Flat, north-up by default, as people expect from a street map. Tilt is a
  // mode they choose, not the first thing they have to make sense of.
  const pitch = fullscreen ? 0 : camera.pitch;
  const bearing = fullscreen ? 0 : MAP_HOME.bearing;
  // Clear of the standing pill in the top-left of the app's HUD, which is
  // 60pt tall including its own top padding.
  const controlTopOffset = fullscreen ? (topInset > 0 ? topInset + 132 : 156) : 10;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<!-- user-scalable=no disables *page* zoom only; MapLibre handles map zoom itself,
     and leaving page zoom on makes a pinch ambiguous between the two. -->
<!-- Bundled with the app rather than fetched from a CDN, so the map opens with
     no network and can't be blanked by an outage elsewhere. -->
<style>${MAPLIBRE_CSS}</style>
<script>${MAPLIBRE_JS}</script>
${avatar ? `<script>${THREE_JS}</script><script>${GLTF_LOADER_JS}</script>` : ''}
<style>
  html,body,#map{margin:0;padding:0;height:100%;width:100%;background:${colors.mapBase}}
  .maplibregl-ctrl-attrib{font-size:10px}
  ${fullscreen ? `
  .maplibregl-ctrl-top-left {
    top: ${controlTopOffset}px !important;
    left: 20px !important;
    margin: 0 !important;
  }
  .maplibregl-ctrl-group {
    background: ${colors.surfaceRaised} !important;
    border: 1px solid ${colors.borderStrong} !important;
    border-radius: 24px !important;
    box-shadow: 0 4px 14px ${colors.overlay} !important;
    overflow: hidden;
  }
  .maplibregl-ctrl-group button {
    width: 52px !important;
    height: 52px !important;
    border-bottom: 1px solid ${colors.border} !important;
    background-color: ${colors.surfaceRaised} !important;
  }
  .maplibregl-ctrl-group button:active {
    background-color: ${colors.primarySoft} !important;
  }
  .maplibregl-ctrl-group button:last-child {
    border-bottom: none !important;
  }
  .maplibregl-ctrl-group .maplibregl-ctrl-icon {
    filter: invert(77%) sepia(35%) saturate(657%) hue-rotate(129deg) brightness(92%) contrast(88%);
  }
  .maplibregl-ctrl-bottom-right {
    left: 20px !important;
    right: 20px !important;
    bottom: 10px !important;
    display: flex;
    justify-content: center;
  }
  .maplibregl-ctrl-bottom-right .maplibregl-ctrl {
    margin: 0 !important;
  }
  .maplibregl-ctrl-attrib {
    color: ${colors.textSecondary} !important;
    background: ${colors.surfaceRaised} !important;
    border: 1px solid ${colors.border} !important;
    border-radius: 999px !important;
    padding: 5px 12px !important;
    font-size: 11px !important;
    line-height: 18px !important;
    box-shadow: 0 4px 12px ${colors.overlay} !important;
  }
  .maplibregl-ctrl-attrib a {
    color: ${colors.primary} !important;
  }
  ` : ''}
</style>
</head>
<body>
<div id="map"></div>
<script>
  function post(msg){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(msg)); }
${OFFLINE_PROTOCOL}
  try {
    var map = new maplibregl.Map({
      container: 'map',
      style: ${JSON.stringify(OFFLINE_STYLE)},
      center: ${JSON.stringify(center)},
      zoom: ${zoom},
      pitch: ${pitch},
      bearing: ${bearing},
      attributionControl: ${JSON.stringify(
        avatar ? { compact: false, customAttribution: [WALKER_CREDIT, MONUMENTS_CREDIT, SCANS_CREDIT] } : { compact: false },
      )},
      interactive: ${interactive},
      // Wide enough to see the whole of Nepal, not so wide the place is lost.
      minZoom: 6,
      maxZoom: 19,
      // A pinch that also rotates makes a small map feel unsteady. Zoom is the
      // gesture people actually want here; rotation stays on the compass.
      pitchWithRotate: ${interactive},
      dragRotate: ${interactive}
    });
${interactive ? INTERACTIVE_CONTROLS : ''}
    // Only a failure before the map has loaded is fatal. After that, a missing
    // tile is just a missing tile: the map stays, instead of being swapped for
    // the schematic plan for the rest of the visit.
    var loaded = false;
    map.on('error', function(e){
      var message = String((e && e.error && e.error.message) || 'map error');
      post({ type: loaded ? 'tile-error' : 'error', message: message });
    });

    // Panning means "let me look around", so stop dragging the camera back.
    map.on('dragstart', function(e){ if (e && e.originalEvent) post({ type:'user-pan' }); });

    map.on('load', function(){
      loaded = true;
${MAP_MODES()}
      // The enclosed ground, flat. Nothing stands between the camera and the
      // monuments; this is only what says you are inside something.
      //
      // Inserted *beneath* the road casings rather than appended on top. A
      // layer added without a beforeId goes above every style layer, so this
      // fill sat over the streets and paths and washed them out — the ground
      // you walk on was hidden by the ground you are inside. Precinct first,
      // then the roads across it, which is also the order it exists in.
      map.addSource('precinct-ground', { type:'geojson', data: ${JSON.stringify(precinctGroundGeoJSON)} });
      map.addLayer({
        id:'precinct-ground-fill', type:'fill', source:'precinct-ground',
        paint:{
          'fill-color': ${JSON.stringify(colors.mapLanduse)},
          // Faint, and fainter as you zoom in: at walking scale the ground is
          // the monuments' backdrop, not a highlighted region.
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0.5, 17.5, 0.18]
        }
      }, 'road-major-casing');

      // No precinct walls are drawn. They were generated from geofence circles,
      // so they put a wall on the map wherever one was assumed, not where one
      // stands. A map must not show structure that isn't there.
      map.addSource('site-water', { type:'geojson', data: ${JSON.stringify(waterGeoJSON)} });
      map.addLayer({
        id:'site-water-fill', type:'fill', source:'site-water',
        paint:{ 'fill-color': ${JSON.stringify(colors.mapWater)} }
      });

      // The monuments, with massing of their own. OSM knows the height of one
      // building in Lumbini, so extruding its data alone gives identical slabs.
      map.addSource('monuments', { type:'geojson', data: ${JSON.stringify(monumentGeoJSON)} });
      map.addLayer({
        id:'monument-massing', type:'fill-extrusion', source:'monuments',
        // Schematic volumes, so only in 3D mode, where a tilted view asks for them.
        layout:{ visibility:'none' },
        paint:{
          'fill-extrusion-color': ${JSON.stringify(colors.mapBuildingRoof)},
          'fill-extrusion-height': ['get','height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.95,
          // Shades the sides against the top so a volume reads as a solid
          // rather than a flat patch of colour seen at an angle.
          'fill-extrusion-vertical-gradient': true
        }
      });

      // Listed places from open data, drawn quieter than the curated sites and only
      // once zoomed in, so they add detail without crowding the map.
      ${fullscreen ? `map.addSource('places', { type:'geojson', data: ${JSON.stringify(placesGeoJSON())} });
      map.addLayer({
        id:'place-dot', type:'circle', source:'places', minzoom: 13,
        paint:{
          'circle-radius': 6,
          'circle-color': ${JSON.stringify(colors.surface)},
          'circle-stroke-width': 2.5,
          'circle-stroke-color': ${JSON.stringify(colors.primary)}
        }
      });
      map.addLayer({
        id:'place-hit', type:'circle', source:'places', minzoom: 13,
        paint:{ 'circle-radius': 18, 'circle-color': '#000000', 'circle-opacity': 0 }
      });
      map.addLayer({
        id:'listed-place-label', type:'symbol', source:'places', minzoom: 14.5,
        layout:{ 'text-field':['get','name'], 'text-font':['Noto Sans Regular'], 'text-size':12, 'text-offset':[0,-1.3], 'text-anchor':'bottom', 'text-optional': true },
        paint:{ 'text-color': ${JSON.stringify(colors.textSecondary)}, 'text-halo-color': ${JSON.stringify(colors.background)}, 'text-halo-width': 1.4 }
      });
      map.on('click','place-hit', function(e){
        var f = e.features && e.features[0];
        if (f && f.properties && f.properties.id) post({ type:'place', id: f.properties.id });
      });` : ''}

      // Real 3D scans (Sketchfab, shown in its player, never copied): a gilt
      // "3D" badge where a scan was made. A tap opens the first scan there;
      // its screen lists the others at the same spot.
      ${fullscreen ? `map.addSource('scans', { type:'geojson', data: ${JSON.stringify(scanSpotsGeoJSON())} });
      map.addLayer({
        id:'scan-pin', type:'circle', source:'scans', minzoom: 11,
        paint:{
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 11, 9, 17, 13],
          'circle-color': ${JSON.stringify(colors.seek)},
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
      map.addLayer({
        id:'scan-pin-text', type:'symbol', source:'scans', minzoom: 11,
        layout:{ 'text-field':'3D', 'text-font':['Noto Sans Regular'], 'text-size': 9.5, 'text-allow-overlap': true, 'text-ignore-placement': true },
        paint:{ 'text-color':'#ffffff' }
      });
      map.addLayer({
        id:'scan-pin-label', type:'symbol', source:'scans', minzoom: 15,
        layout:{ 'text-field':['get','label'], 'text-font':['Noto Sans Regular'], 'text-size': 11.5, 'text-offset':[0, 1.5], 'text-anchor':'top', 'text-optional': true },
        paint:{ 'text-color': ${JSON.stringify(colors.seek)}, 'text-halo-color': ${JSON.stringify(colors.background)}, 'text-halo-width': 1.4 }
      });
      map.on('click','scan-pin', function(e){
        var f = e.features && e.features[0];
        if (f && f.properties && f.properties.scanId) post({ type:'scan', id: f.properties.scanId });
      });` : ''}

      // Clustered, so 70 places in one valley read as a few countable groups
      // rather than a smear of overlapping dots.
      map.addSource('sites', {
        type:'geojson', data: ${JSON.stringify(siteGeoJSON)},
        cluster: true, clusterRadius: 44, clusterMaxZoom: 15
      });
      map.addLayer({
        id:'site-cluster', type:'circle', source:'sites', filter:['has','point_count'],
        paint:{
          'circle-color': ${JSON.stringify(colors.accent)},
          'circle-radius': ['step', ['get','point_count'], 16, 10, 20, 30, 26],
          'circle-stroke-width': 3,
          'circle-stroke-color': ${JSON.stringify(colors.surface)}
        }
      });
      map.addLayer({
        id:'site-cluster-count', type:'symbol', source:'sites', filter:['has','point_count'],
        layout:{ 'text-field':['get','point_count_abbreviated'], 'text-font':['Noto Sans Bold'], 'text-size':13, 'text-allow-overlap':true },
        paint:{ 'text-color': ${JSON.stringify(colors.onAccent)} }
      });
      map.addLayer({
        id:'site-dot', type:'circle', source:'sites', filter:['!',['has','point_count']],
        paint:{
          'circle-radius': 8,
          'circle-color': ${JSON.stringify(colors.primary)},
          'circle-stroke-width': 3,
          'circle-stroke-color': ${JSON.stringify(colors.surface)}
        }
      });
      // An invisible ring around each dot, so a thumb can hit it.
      map.addLayer({
        id:'site-hit', type:'circle', source:'sites', filter:['!',['has','point_count']],
        paint:{ 'circle-radius': 22, 'circle-color': '#000000', 'circle-opacity': 0 }
      });
      map.addLayer({
        id:'site-label', type:'symbol', source:'sites', filter:['!',['has','point_count']],
        layout:{
          'text-field':['get','name'],
          'text-font':['Noto Sans Regular'],
          'text-size':13,
          'text-offset':[0,-1.5],
          'text-anchor':'bottom',
          'text-allow-overlap':false,
          'symbol-sort-key':['get','rank']
        },
        paint:{
          'text-color': ${JSON.stringify(colors.textPrimary)},
          'text-halo-color': ${JSON.stringify(colors.background)},
          'text-halo-width': 1.6
        }
      });
      map.on('click','site-hit', function(e){
        var f = e.features && e.features[0];
        if (f && f.properties && f.properties.id) post({ type:'site', id: f.properties.id });
      });
      map.on('click','site-cluster', function(e){
        var f = e.features && e.features[0];
        if (!f) return;
        map.getSource('sites').getClusterExpansionZoom(f.properties.cluster_id).then(function (z) {
          map.easeTo({ center: f.geometry.coordinates, zoom: z + 0.5 });
        }).catch(function () {});
      });
      map.getCanvas().style.cursor = 'default';
      // Position, route and waypoints never needed the figure: a trek map draws
      // all three with no character at all.
${POSITION_MARKER}
      // Ready is posted *before* the character. The figure needs three.js from
      // a CDN, and when that request fails — a cold start on site signal, an
      // offline device — the throw used to escape this handler before the ready
      // message, so the WebView timed out and the whole map fell back to the
      // schematic plan. The map does not need the character; the character
      // needs the map.
      post({ type:'ready' });
${avatar ? AVATAR_LAYER + townLayerScript(monumentGeoJSON) + monumentModelsScript(modelPlacements(), MODELS_URL, MAP_SCANS) : ''}
    });
  } catch (err) {
    post({ type:'error', message: String(err) });
  }
</script>
</body>
</html>`;
}

/**
 * Controls and sizing for the interactive map.
 *
 * The zoom buttons are not a fallback for broken gestures — they are the
 * primary control for anyone holding a phone one-handed with a bag on the other
 * shoulder, which is most people walking a heritage site. Pinch still works;
 * this means it does not have to.
 *
 * `resize()` on a ResizeObserver is what makes the map responsive rather than
 * merely stretched: MapLibre sizes its canvas once at construction and will not
 * notice a rotation, a split screen, or a container that grew, so the canvas
 * and the viewport drift apart and the map renders letterboxed or clipped.
 */
/**
 * Map modes, switched in the running page so tiles and camera survive the change.
 *
 * Terrain uses the open AWS elevation tiles (Mapzen Terrarium). Satellite and
 * hybrid use MapTiler, and exist only when a key is configured: the free
 * imagery checked so far is either non-commercial or too coarse for close-up use.
 */
function MAP_MODES(): string {
  return `
      var baseLayers = map.getStyle().layers.map(function (l) { return { id: l.id, type: l.type }; });
      var imagery = null;
      var currentMode = 'standard';
      map.addSource('dem', {
        type: 'raster-dem', encoding: 'terrarium', tileSize: 256, maxzoom: 15,
        tiles: ['saksi://dem/{z}/{x}/{y}'],
        attribution: 'Elevation: Mapzen Terrain Tiles, AWS Open Data'
      });
      map.addLayer({ id:'hillshade', type:'hillshade', source:'dem', layout:{ visibility:'none' },
        paint:{ 'hillshade-shadow-color': ${JSON.stringify(colors.mapLabel)}, 'hillshade-highlight-color': ${JSON.stringify(colors.mapBase)}, 'hillshade-exaggeration': 0.3 } },
        baseLayers.length > 1 ? baseLayers[1].id : undefined);

      // Google asks for the copyright of what is on screen, shown with its name.
      var credit = document.createElement('div');
      credit.style.cssText = 'position:absolute;left:8px;bottom:8px;z-index:5;font:600 11px sans-serif;color:#fff;text-shadow:0 0 3px #000;pointer-events:none;display:none';
      document.body.appendChild(credit);
      function refreshCredit() {
        var showing = imagery && (currentMode === 'satellite' || currentMode === 'hybrid');
        credit.style.display = showing ? 'block' : 'none';
        if (!showing || !imagery.viewportUrl) { credit.textContent = imagery ? 'Imagery: ' + imagery.provider : ''; return; }
        var b = map.getBounds();
        fetch(imagery.viewportUrl + '&zoom=' + Math.round(map.getZoom()) + '&north=' + b.getNorth() + '&south=' + b.getSouth() + '&east=' + b.getEast() + '&west=' + b.getWest())
          .then(function (r) { return r.ok ? r.json() : null; })
          .then(function (v) { credit.textContent = 'Google' + (v && v.copyright ? ' · ' + v.copyright : ''); })
          .catch(function () { credit.textContent = 'Google'; });
      }
      map.on('moveend', refreshCredit);

      /** Imagery arrives after load: its provider may need a session first. */
      window.sakshiSetImagery = function (value) {
        if (!value || imagery) return;
        imagery = value;
        var below = baseLayers.length > 1 ? baseLayers[1].id : undefined;
        map.addSource('satellite', { type:'raster', tileSize: value.tileSize, maxzoom: 20, tiles: [value.satellite],
          attribution: value.provider === 'google' ? '' : value.attribution });
        map.addLayer({ id:'satellite', type:'raster', source:'satellite', layout:{ visibility:'none' } }, below);
        if (value.hybrid) {
          map.addSource('hybrid', { type:'raster', tileSize: value.tileSize, maxzoom: 20, tiles: [value.hybrid] });
          map.addLayer({ id:'hybrid', type:'raster', source:'hybrid', layout:{ visibility:'none' } }, below);
        }
        window.sakshiSetMapMode(currentMode);
      };

      function show(id, visible) {
        if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
      var isRoadOrLabel = function (l) { return l.type === 'symbol' || /road|path|bridge|tunnel/.test(l.id); };

      window.sakshiSetMapMode = function (mode) {
        if ((mode === 'satellite' || mode === 'hybrid') && !imagery) mode = 'standard';
        currentMode = mode;
        window.sakshiCurrentMode = mode;
        var useImagery = mode === 'satellite' || mode === 'hybrid';
        // The provider's own hybrid tiles replace the basemap entirely; without
        // them, our roads and labels are laid over plain imagery.
        var ownHybrid = mode === 'hybrid' && imagery && imagery.hybrid;
        baseLayers.forEach(function (l) {
          if (l.type === 'background') return show(l.id, !useImagery);
          if (mode === 'satellite' || ownHybrid) return show(l.id, false);
          if (mode === 'hybrid') return show(l.id, isRoadOrLabel(l));
          show(l.id, true);
        });
        show('satellite', mode === 'satellite' || (mode === 'hybrid' && !ownHybrid));
        show('hybrid', Boolean(ownHybrid));
        refreshCredit();
        show('hillshade', mode === 'terrain');
        show('monument-massing', mode === '3d');
        // With the 3D town drawn, the plain boxes give way to it at street
        // zoom and stay below it, where houses are too small to read.
        if (window.sakshiHasTown) {
          var townZoom = mode === '3d' ? 15 : 24;
          if (map.getLayer('building')) map.setLayerZoomRange('building', 14, townZoom);
          if (map.getLayer('monument-massing')) map.setLayerZoomRange('monument-massing', 0, townZoom);
          if (mode === '3d' && window.sakshiTownRefresh) window.sakshiTownRefresh();
        }
        map.setTerrain(mode === 'terrain' ? { source: 'dem', exaggeration: 1.4 } : null);
        var tilted = mode === '3d' || mode === 'terrain';
        map.easeTo({ pitch: tilted ? 58 : 0, bearing: tilted ? map.getBearing() : 0, duration: 700 });
        post({ type:'mode', mode: mode });
      };

      // Label every place in a script we can be sure renders. MapLibre GL JS does
      // not shape Devanagari, so a Nepali name could draw with its letters in the
      // wrong order; English names fall back to the local name where none exists.
      baseLayers.forEach(function (l) {
        if (l.type !== 'symbol') return;
        var field = map.getLayoutProperty(l.id, 'text-field');
        if (!field) return;
        map.setLayoutProperty(l.id, 'text-field', ['coalesce', ['get','name:en'], ['get','name_en'], ['get','name']]);
      });
`;
}

const INTERACTIVE_CONTROLS = `
      // Left, not right. The right-hand column belongs to the app's own HUD —
      // the quest marker and the two place controls — and MapLibre's stack was
      // landing underneath them, so the zoom buttons and the quest badge drew
      // over each other. One side each, and neither has to know about the other.
      map.addControl(new maplibregl.NavigationControl({
        showZoom: true,
        showCompass: true,
        visualizePitch: true
      }), 'top-left');

      // GeolocateControl is deliberately absent.
      //
      // It would put the *browser's* geolocation dot on the map: a second "you
      // are here" from a different source than the figure, free to disagree
      // with it, and completely unaware of demo mode — during a demo walk it
      // would sit on the real device position while the character walked
      // Lumbini. Follow is the app's own control and the figure is the app's
      // own marker; a second of each is not a feature.

      // Double-tap to zoom in, two-finger tap to zoom out — the conventions a
      // phone user already has, and neither needs a precise pinch.
      map.doubleClickZoom.enable();
      map.touchZoomRotate.enable();
      map.touchZoomRotate.disableRotation();

      if (window.ResizeObserver) {
        var ro = new ResizeObserver(function () { map.resize(); });
        ro.observe(document.getElementById('map'));
      }
      window.addEventListener('orientationchange', function () {
        // The container has not settled at the moment the event fires.
        setTimeout(function () { map.resize(); }, 150);
      });
`;

/**
 * Where you are, drawn with MapLibre's own layers.
 *
 * This is the part that must never fail. The three.js character below is the
 * one people notice, but it depends on a script fetched from a CDN and on a
 * WebGL context shared with the basemap; when either is unavailable the person
 * looking at the map still has to be able to find themselves on it. So the
 * locator is a circle, an aura and an arrow — geometry MapLibre already draws,
 * with no network and no second renderer.
 *
 * It also owns `pose`. Both this and the character read the same object, so
 * they cannot disagree about where you are standing, and `window.sakshiSetPose`
 * exists from the moment the map is ready rather than only when three.js
 * happens to have arrived.
 *
 * The trail and the route are here for the same reason: they are the walk made
 * visible — where you have been, and where the demo is heading next.
 */
const POSITION_MARKER = `
      var pose = {
        lng: ${MAP_HOME.centre[0]}, lat: ${MAP_HOME.centre[1]},
        heading: 0, has: false,
        // Smoothed values the renderer actually draws. A fix arrives about once
        // a second; drawing it raw makes the figure jump a stride at a time.
        drawLng: ${MAP_HOME.centre[0]}, drawLat: ${MAP_HOME.centre[1]}, drawHeading: 0,
        speed: 0, lastAt: 0
      };
      var trail = [];
      var TRAIL_MAX = 400;

      map.addSource('me', { type:'geojson', data: { type:'FeatureCollection', features: [] } });
      map.addSource('me-accuracy', { type:'geojson', data: { type:'FeatureCollection', features: [] } });
      map.addSource('me-trail', { type:'geojson', data: { type:'FeatureCollection', features: [] } });
      map.addSource('me-route', { type:'geojson', data: { type:'FeatureCollection', features: [] } });
      map.addSource('waypoints', { type:'geojson', data: { type:'FeatureCollection', features: [] } });

      // The planned way, under everything. Demo itineraries are dashed; live
      // guidance switches this same layer to a strong solid route.
      map.addLayer({
        id:'route-line', type:'line', source:'me-route',
        layout:{ 'line-cap':'round', 'line-join':'round' },
        paint:{
          'line-color': ${JSON.stringify(colors.sandstoneDeep)},
          'line-width': 2.5,
          'line-opacity': 0.55,
          'line-dasharray': [1.5, 1.5]
        }
      });

      // Where you have actually been. Solid, and fading out towards the start
      // so the head of the trail reads as "now".
      map.addLayer({
        id:'trail-line', type:'line', source:'me-trail',
        layout:{ 'line-cap':'round', 'line-join':'round' },
        paint:{
          'line-color': ${JSON.stringify(colors.earth)},
          'line-width': 4,
          'line-opacity': 0.7
        }
      });

      // How sure the phone is about where you are. A real distance on the
      // ground, so it grows as you zoom in, which a fixed-size dot can't show.
      map.addLayer({
        id:'me-accuracy', type:'circle', source:'me-accuracy',
        paint:{
          'circle-radius': ['interpolate', ['exponential', 2], ['zoom'],
            0, ['/', ['get','acc'], ['get','mpp0']],
            22, ['/', ['*', ['get','acc'], 4194304], ['get','mpp0']]],
          'circle-color': ${JSON.stringify(colors.navigationRoute)},
          'circle-opacity': 0.12,
          'circle-stroke-width': 1,
          'circle-stroke-color': ${JSON.stringify(colors.navigationRoute)},
          'circle-stroke-opacity': 0.4,
          'circle-pitch-alignment': 'map'
        }
      });

      // Radiates outward once a second. Motion is what the eye finds on a map
      // full of static dots, and finding yourself should not take a search.
      map.addLayer({
        id:'me-pulse', type:'circle', source:'me',
        paint:{
          'circle-radius': 14,
          'circle-color': ${JSON.stringify(colors.sandstone)},
          'circle-opacity': 0.35,
          'circle-pitch-alignment': 'map'
        }
      });
      map.addLayer({
        id:'me-aura', type:'circle', source:'me',
        paint:{
          'circle-radius': 15,
          'circle-color': ${JSON.stringify(colors.sandstone)},
          'circle-opacity': 0.22,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': ${JSON.stringify(colors.sandstoneDeep)},
          'circle-stroke-opacity': 0.45,
          'circle-pitch-alignment': 'map'
        }
      });
      map.addLayer({
        id:'me-dot', type:'circle', source:'me',
        paint:{
          'circle-radius': 6,
          'circle-color': ${JSON.stringify(colors.sandstoneDeep)},
          'circle-stroke-width': 2.5,
          'circle-stroke-color': ${JSON.stringify(colors.surface)}
        }
      });

      // The heading wedge. Drawn into a canvas rather than shipped as a file:
      // an inline document has no assets directory to load one from, and a data
      // URI for a shape this simple is longer than the code that draws it.
      // The arrow points up the canvas, so icon-rotate can take a compass
      // bearing unmodified.
      (function () {
        var S = 56, c = document.createElement('canvas');
        c.width = S; c.height = S;
        var g = c.getContext('2d');
        g.translate(S / 2, S / 2);
        g.beginPath();
        g.moveTo(0, -24); g.lineTo(7.5, -11); g.lineTo(0, -14.5); g.lineTo(-7.5, -11);
        g.closePath();
        g.fillStyle = ${JSON.stringify(colors.sandstoneDeep)};
        g.fill();
        map.addImage('me-heading', g.getImageData(0, 0, S, S), { pixelRatio: 2 });
      })();

      map.addLayer({
        id:'me-facing', type:'symbol', source:'me',
        layout:{
          'icon-image':'me-heading',
          'icon-rotate': ['get','heading'],
          'icon-rotation-alignment':'map',
          'icon-pitch-alignment':'map',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      function meFeature() {
        return {
          type:'FeatureCollection',
          features: pose.has ? [{
            type:'Feature',
            geometry:{ type:'Point', coordinates:[pose.drawLng, pose.drawLat] },
            properties:{ heading: pose.drawHeading }
          }] : []
        };
      }

      var pulsePhase = 0;
      setInterval(function () {
        if (!pose.has) return;
        pulsePhase = (pulsePhase + 0.06) % 1;
        // Eased so the ring slows as it widens, which reads as a ripple rather
        // than a shape being stretched.
        var eased = 1 - Math.pow(1 - pulsePhase, 2);
        map.setPaintProperty('me-pulse', 'circle-radius', 14 + eased * 30);
        map.setPaintProperty('me-pulse', 'circle-opacity', 0.35 * (1 - eased));
      }, 40);

      /**
       * Called from React Native on every position fix.
       *
       * Records the target; the smoothing towards it happens per frame, in the
       * character's render loop, or here when there is no character to run it.
       */
      window.sakshiSetPose = function (lng, lat, heading, follow, accuracy) {
        map.getSource('me-accuracy').setData({
          type:'FeatureCollection',
          features: (typeof accuracy === 'number' && accuracy > 0) ? [{
            type:'Feature', geometry:{ type:'Point', coordinates:[lng, lat] },
            // Metres per pixel at zoom 0 at this latitude, for the radius expression.
            properties:{ acc: accuracy, mpp0: 156543.03 * Math.cos(lat * Math.PI / 180) }
          }] : []
        });
        var now = Date.now();
        if (pose.has && pose.lastAt) {
          var dt = Math.max(0.001, (now - pose.lastAt) / 1000);
          pose.speed = haversineM(pose.lat, pose.lng, lat, lng) / dt;
        }
        pose.lastAt = now;

        // A phone at a standstill reports a heading that wanders. Below walking
        // pace, keep facing the way you last actually went.
        if (typeof heading === 'number' && !isNaN(heading)) pose.heading = heading;

        pose.lng = lng; pose.lat = lat;

        var first = !pose.has;
        if (first) { pose.drawLng = lng; pose.drawLat = lat; pose.drawHeading = pose.heading; }
        pose.has = true;

        trail.push([lng, lat]);
        if (trail.length > TRAIL_MAX) trail.shift();
        if (trail.length > 1) {
          map.getSource('me-trail').setData({
            type:'FeatureCollection',
            features:[{ type:'Feature', geometry:{ type:'LineString', coordinates: trail }, properties:{} }]
          });
        }

        if (follow || first) {
          map.easeTo({ center: [lng, lat], duration: first ? 0 : 900 });
        }
        if (!window.sakshiHasFigure) advancePose();
        map.triggerRepaint();
      };

      /** The planned route, as [[lng,lat], ...]. Pass [] to clear it. */
      window.sakshiSetRoute = function (coords) {
        map.getSource('me-route').setData({
          type:'FeatureCollection',
          features: (coords && coords.length > 1)
            ? [{ type:'Feature', geometry:{ type:'LineString', coordinates: coords }, properties:{} }]
            : []
        });
      };

      /**
       * Named stops along a route, such as a trek's villages. Labels always
       * show, because on a trek the stop names are the point of the map.
       */
      window.sakshiSetWaypoints = function (points) {
        if (!map.getLayer('waypoint-dot')) {
          map.addLayer({
            id:'waypoint-dot', type:'circle', source:'waypoints',
            paint:{
              'circle-radius': 5,
              'circle-color': ${JSON.stringify(colors.surface)},
              'circle-stroke-width': 2.5,
              'circle-stroke-color': ${JSON.stringify(colors.primary)}
            }
          });
          map.addLayer({
            id:'waypoint-label', type:'symbol', source:'waypoints',
            layout:{ 'text-field':['get','name'], 'text-font':['Noto Sans Regular'], 'text-size':12, 'text-offset':[0,-1.1], 'text-anchor':'bottom', 'text-optional': true },
            paint:{ 'text-color': ${JSON.stringify(colors.textPrimary)}, 'text-halo-color': ${JSON.stringify(colors.background)}, 'text-halo-width': 1.4 }
          });
          map.on('click','waypoint-dot', function(e){
            var f = e.features && e.features[0];
            if (f && f.properties && f.properties.id) post({ type:'waypoint', id: f.properties.id });
          });
        }
        map.getSource('waypoints').setData({
          type:'FeatureCollection',
          features: (points || []).map(function (p) {
            return { type:'Feature', geometry:{ type:'Point', coordinates:[p.longitude, p.latitude] }, properties:{ id: p.id, name: p.name } };
          })
        });
      };

      /** Frame a line so all of it is on screen. */
      window.sakshiFitLine = function (coords) {
        if (!coords || coords.length < 2) return;
        var b = new maplibregl.LngLatBounds(coords[0], coords[0]);
        coords.forEach(function (c) { b.extend(c); });
        map.fitBounds(b, { padding: 40, maxZoom: 15, duration: 600 });
      };

      window.sakshiSetRouteColor = function (color) {
        if (color) map.setPaintProperty('route-line', 'line-color', color);
      };

      window.sakshiSetRouteMode = function (guiding) {
        map.setPaintProperty('route-line', 'line-width', guiding ? 5 : 2.5);
        map.setPaintProperty('route-line', 'line-opacity', guiding ? 0.9 : 0.55);
        map.setPaintProperty('route-line', 'line-dasharray', guiding ? null : [1.5, 1.5]);
      };

      var guideMarker = null;
      window.sakshiSetGuide = function (destination) {
        if (guideMarker) { guideMarker.remove(); guideMarker = null; }
        if (!destination) return;
        guideMarker = new maplibregl.Marker({ color: ${JSON.stringify(colors.navigationRoute)} })
          .setLngLat([destination.longitude, destination.latitude])
          .setPopup(new maplibregl.Popup().setText(destination.name)).addTo(map);
        if (pose.has) map.fitBounds([[pose.lng, pose.lat], [destination.longitude, destination.latitude]], { padding: 100, maxZoom: 17, duration: 700 });
        else map.easeTo({ center: [destination.longitude, destination.latitude], zoom: 15 });
      };

      /**
       * Take the camera somewhere, by name of distance rather than by number.
       *
       * "world" is the playing camera and "close" is the reading one; the app
       * asks for a distance and does not have to know what zoom that is at this
       * latitude. Passing no coordinate re-frames wherever the camera already
       * is, which is what a story opening at the monument you are standing on
       * wants.
       */
      window.sakshiFlyTo = function (lng, lat, distance, durationMs) {
        var presets = ${JSON.stringify(MAP_CAMERA)};
        var preset = presets[distance] || presets.world;
        map.easeTo({
          center: (typeof lng === 'number' && typeof lat === 'number')
            ? [lng, lat]
            : map.getCenter(),
          zoom: preset.zoom,
          pitch: preset.pitch,
          duration: typeof durationMs === 'number' ? durationMs : 1200
        });
      };

      /** Drops the trail — a new walk should not inherit the last one's line. */
      window.sakshiClearTrail = function () {
        trail = [];
        map.getSource('me-trail').setData({ type:'FeatureCollection', features: [] });
      };

      function haversineM(lat1, lon1, lat2, lon2) {
        var R = 6371000, toRad = Math.PI / 180;
        var dLat = (lat2 - lat1) * toRad, dLon = (lon2 - lon1) * toRad;
        var a = Math.sin(dLat/2)*Math.sin(dLat/2) +
                Math.cos(lat1*toRad)*Math.cos(lat2*toRad)*Math.sin(dLon/2)*Math.sin(dLon/2);
        return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
      }

      /** Shortest-arc step towards a bearing, so 350°→10° turns 20° not 340°. */
      function stepAngle(from, to, t) {
        var d = ((to - from + 540) % 360) - 180;
        return (from + d * t + 360) % 360;
      }

      /**
       * Move the drawn pose one step towards the reported one.
       *
       * Called per frame while the character is running, and once per fix when
       * it is not — the marker still glides either way.
       *
       * The lerp is per frame; pushing it into the source is not. setData
       * re-parses the feature and reflows the layers that read it, and doing
       * that sixty times a second for one moving point costs more than the
       * whole basemap. At 12 Hz the puck is still smooth to the eye and the
       * character, which does animate per frame, carries the motion.
       */
      var markerWrittenAt = 0;
      function advancePose(t) {
        var k = t === undefined ? 1 : t;
        pose.drawLng += (pose.lng - pose.drawLng) * k;
        pose.drawLat += (pose.lat - pose.drawLat) * k;
        pose.drawHeading = stepAngle(pose.drawHeading, pose.heading, k);

        var now = Date.now();
        if (now - markerWrittenAt < 80) return;
        markerWrittenAt = now;
        map.getSource('me').setData(meFeature());
      }
`;

/**
 * The character standing at that position.
 *
 * Built from three.js primitives rather than loaded as a glTF. That is a
 * deliberate choice, not a shortcut: a downloaded human model carries a licence
 * to honour and a style that would not match anything else here. Robe, shoulder
 * fold, halo and lotus plinth — the figure the app already uses on its welcome
 * screen, in the round.
 *
 * It is a marker with a person's shape, not a playable avatar. On a pilgrimage
 * the person is the one walking; the map's job is to say where they are, and to
 * look like it knows what place it is describing while doing so.
 *
 * ── What was wrong before ──────────────────────────────────────────────────
 *
 * The geometry here is authored Z-up: the head sits at +Z, the cylinders are
 * turned onto that axis, and MapLibre's Mercator space is Z-up too, so the two
 * already agree. The previous version applied a further `makeRotationX(π/2)` on
 * top — a correction for *Y-up* geometry, which this is not — and laid the
 * figure flat on the ground pointing north. Heading then rotated it about the
 * model's Y axis, rolling the fallen figure rather than turning it. What
 * reached the screen was a few pixels of edge-on sliver inside a precinct wall.
 * That is the "hidden" character: it was drawn every frame, lying down.
 */
const AVATAR_LAYER = `
      try {
        if (typeof THREE === 'undefined') throw new Error('three.js unavailable');
        window.sakshiHasFigure = true;

        var camera = new THREE.Camera();
        var scene = new THREE.Scene();
        var figure = new THREE.Group();

        var robe = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.earth)} });
        var robeFold = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.sandstoneDeep)} });
        var skin = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.sandstone)} });
        var plinth = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.sandstoneDeep)} });
        // Unlit, so the halo reads as light rather than as a painted ring.
        var glow = new THREE.MeshBasicMaterial({
          color: ${JSON.stringify(colors.seek)}, transparent: true, opacity: 0.75
        });

        function put(mesh, x, y, z) { mesh.position.set(x, y, z); figure.add(mesh); return mesh; }
        /** Cylinders are built along Y; this stands one up on Z. */
        function upright(geo, material) {
          var m = new THREE.Mesh(geo, material);
          m.rotation.x = Math.PI / 2;
          return m;
        }

        // Metres, on a 1.75 m person. The whole group is scaled at render time
        // to hold a constant size on screen — see FIGURE_PX.
        //
        // A contact shadow first, and it does more for how solid the figure
        // looks than any amount of geometry above it. Without one the character
        // floats: there is nothing tying it to the ground plane, and at a 62°
        // pitch the eye reads a floating object as a sprite pasted on the map.
        var shadowMat = new THREE.MeshBasicMaterial({
          color: 0x2b2f2a, transparent: true, opacity: 0.28, depthWrite: false
        });
        var shadow = new THREE.Mesh(new THREE.CircleGeometry(0.62, 28), shadowMat);
        shadow.position.set(0, 0, 0.012);
        figure.add(shadow);

        put(new THREE.Mesh(new THREE.TorusGeometry(0.78, 0.05, 10, 40), glow), 0, 0, 0.02);
        put(upright(new THREE.CylinderGeometry(0.50, 0.60, 0.09, 28), plinth), 0, 0, 0.045);

        // The robe, as three tapered courses rather than two. A single cone
        // from hem to shoulder reads as a traffic cone; the break at the waist
        // and the fold above it are what make it cloth.
        var lower = put(upright(new THREE.CylinderGeometry(0.235, 0.44, 0.62, 24), robe), 0, 0, 0.40);
        var waist = put(upright(new THREE.CylinderGeometry(0.205, 0.235, 0.30, 24), robe), 0, 0, 0.86);
        put(new THREE.Mesh(new THREE.TorusGeometry(0.208, 0.042, 10, 28), robeFold), 0, 0, 1.00);
        put(upright(new THREE.CylinderGeometry(0.168, 0.222, 0.44, 24), robe), 0, 0, 1.23);

        // The uttarāsaṅga over the left shoulder, leaving the right bare — the
        // fold that reads as a monastic robe rather than as a coat.
        var sash = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.215, 0.40, 24, 1, true), robeFold);
        sash.rotation.x = Math.PI / 2;
        sash.rotation.z = 0.22;
        sash.position.set(-0.02, 0, 1.30);
        figure.add(sash);

        put(new THREE.Mesh(new THREE.TorusGeometry(0.186, 0.05, 10, 28), robeFold), 0, 0, 1.45);

        var armL = put(upright(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 12), robe), -0.198, 0, 1.21);
        var armR = put(upright(new THREE.CylinderGeometry(0.048, 0.042, 0.44, 12), skin), 0.198, 0, 1.21);

        put(upright(new THREE.CylinderGeometry(0.058, 0.072, 0.10, 14), skin), 0, 0, 1.52);

        // The head is a slightly flattened sphere — a perfect ball reads as a
        // pin, and the ushnisha needs a crown to sit on rather than a pole.
        var head = new THREE.Mesh(new THREE.SphereGeometry(0.118, 24, 18), skin);
        head.scale.set(1, 0.92, 1.06);
        put(head, 0, 0, 1.638);
        put(new THREE.Mesh(new THREE.SphereGeometry(0.056, 16, 12), skin), 0, 0, 1.742);

        // The halo stands in the plane of the shoulders, so it is a ring from
        // the front and an edge from the side — which is how a halo behaves.
        var halo = new THREE.Mesh(new THREE.TorusGeometry(0.215, 0.022, 8, 32), glow);
        halo.rotation.x = Math.PI / 2;
        halo.position.set(0, -0.07, 1.65);
        figure.add(halo);

        scene.add(figure);
        // A hemisphere light rather than flat ambient: warm from the sky, cool
        // bounce from the ground, which is what stops the shaded side going to
        // a dead grey and is most of the difference between "primitives" and
        // "a figure".
        scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6e7069, 0.95));
        var sun = new THREE.DirectionalLight(0xfff6ea, 0.6);
        // From the south-west and high, matching the shading the fill-extrusion
        // layers are drawn with, so the figure belongs to the same afternoon.
        sun.position.set(-0.4, -0.5, 1).normalize();
        scene.add(sun);

        var FIGURE_HEIGHT_M = 1.75;
        /**
         * How tall the figure is on screen, in CSS pixels, at any zoom.
         *
         * Fixed on screen rather than in the world. At the zoom this map opens
         * at, a ground metre is under half a pixel: a true-scale person is four
         * pixels tall and invisible, and the previous fixed 17 m of world
         * geometry was a five-storey giant at one zoom and a speck at another.
         * A marker's job is to hold its size while the ground changes scale.
         */
        var FIGURE_PX = 46;
        var renderer = null;
        var lastFrame = 0;
        var walkPhase = 0;
        /** 0 while walking, 1 once settled. Eased, never switched. */
        var settle = 0;

        /*
         * The realistic walker, replacing the robed figure once it loads.
         *
         * Its walk cycle is "in place": the body does not travel, so the feet
         * would slide unless the cycle plays at the speed the person is really
         * walking. That speed is measured from the animation itself, from how
         * far the left foot sweeps back during its stance and how many steps
         * the clip holds, so the playback rate follows the GPS speed and each
         * foot stays planted for as long as it is on the ground.
         */
        var walker = null, mixer = null, walkAction = null;
        var naturalSpeed = 1.3, clipPeriod = 1.1, clipDuration = 1, neutralTimes = [0];
        function measureWalk(model, clip) {
          var foot = null;
          model.traverse(function (o) {
            if (!foot && o.isBone && /foot/i.test(o.name) && /(^|[^a-z])l([^a-z]|$)|left/i.test(o.name)) foot = o;
          });
          if (!foot) return null;
          var probe = new THREE.AnimationMixer(model);
          var act = probe.clipAction(clip);
          act.play();
          // Sampled in the model's parent frame, which is metres once the
          // model is scaled. Not model.worldToLocal: that undoes the scale
          // and measures in the scan's own centimetres.
          var N = 120, xs = [], zs = [], p = new THREE.Vector3();
          for (var i = 0; i < N; i++) {
            probe.setTime((clip.duration * i) / N);
            model.updateMatrixWorld(true);
            foot.getWorldPosition(p);
            xs.push(p.x); zs.push(p.z);
          }
          act.stop(); probe.uncacheRoot(model);
          var range = function (a) { return Math.max.apply(null, a) - Math.min.apply(null, a); };
          var fwd = range(zs) >= range(xs) ? zs : xs;
          var mean = fwd.reduce(function (a, b) { return a + b; }, 0) / N;
          // Each upward crossing of the mean is one full cycle of the left
          // foot. The clip loops, so the seam from the last sample back to the
          // first is checked too; a crossing there was being missed, halving
          // the count.
          var cycles = 0, crossings = [];
          for (var k = 1; k <= N; k++) {
            var a = fwd[k - 1] - mean, b = fwd[k % N] - mean;
            if (a < 0 && b >= 0) cycles++;
            if ((a < 0) !== (b < 0)) crossings.push((clip.duration * (k % N)) / N);
          }
          cycles = Math.max(1, cycles);
          var period = clip.duration / cycles;
          // About 60% of a walking cycle is stance, when the foot is planted
          // and the body passes over it at walking speed.
          var speed = range(fwd) / (0.6 * period);
          return { speed: speed, period: period, neutral: crossings.length ? crossings : [0] };
        }
        if (THREE.GLTFLoader) {
          new THREE.GLTFLoader().load(${JSON.stringify(WALKER_URL)}, function (gltf) {
            try {
              var model = gltf.scene;
              var clip = gltf.animations && gltf.animations[0];
              if (!clip) throw new Error('no walk cycle');
              model.updateMatrixWorld(true);
              var box = new THREE.Box3().setFromObject(model);
              var size = box.getSize(new THREE.Vector3());
              model.scale.multiplyScalar(FIGURE_HEIGHT_M / size.y);
              model.updateMatrixWorld(true);
              box.setFromObject(model);
              model.position.x -= (box.min.x + box.max.x) / 2;
              model.position.z -= (box.min.z + box.max.z) / 2;
              model.position.y -= box.min.y;
              model.traverse(function (o) { if (o.isMesh) o.frustumCulled = false; });

              var measured = measureWalk(model, clip);
              if (measured && measured.speed > 0.4 && measured.speed < 3) {
                naturalSpeed = measured.speed; clipPeriod = measured.period; neutralTimes = measured.neutral;
              }

              // glTF is Y-up and faces +Z; the map frame is Z-up with north +Y.
              var upright = new THREE.Group();
              upright.rotation.x = Math.PI / 2;
              upright.add(model);
              walker = new THREE.Group();
              walker.rotation.z = Math.PI;
              walker.add(upright);

              clipDuration = clip.duration;
              mixer = new THREE.AnimationMixer(model);
              walkAction = mixer.clipAction(clip);
              walkAction.play();
              walkAction.timeScale = 0;
              walkAction.time = neutralTimes[0];

              figure.children.forEach(function (c) { if (c !== shadow) c.visible = false; });
              figure.add(walker);
              post({ type: 'figure-ready', kind: 'walker', naturalSpeed: Math.round(naturalSpeed * 100) / 100 });
            } catch (walkerErr) {
              post({ type: 'figure-model-failed', message: String(walkerErr) });
            }
          }, undefined, function (loadErr) {
            post({ type: 'figure-model-failed', message: String(loadErr && loadErr.message || loadErr) });
          });
        }

        /*
         * Walking view: the camera travels with the figure, behind and above
         * it, low enough to see the street ahead and the sky, turning as the
         * figure turns. The figure stays in the lower part of the screen,
         * where a person walking looks ahead of themselves. A drag on the map
         * ends it, so the map is never taken away from the hand.
         */
        var walkView = false;
        var walkFrame = 0;
        var walkTimer = 0;
        /** Larger in walking view, where the figure is in the foreground. */
        var WALK_FIGURE_PX = 110;
        function walkCamera() {
          if (!walkView) return;
          if (pose.has) {
            var h = map.getContainer().clientHeight || 600;
            map.jumpTo({
              center: [pose.drawLng, pose.drawLat],
              bearing: pose.drawHeading,
              pitch: 70,
              zoom: 20.1,
              padding: { top: Math.round(h * 0.42), bottom: 0, left: 0, right: 0 }
            });
          }
          walkFrame = requestAnimationFrame(walkCamera);
        }
        window.sakshiSetWalkView = function (on) {
          on = !!on;
          if (on === walkView) return;
          walkView = on;
          if (on) {
            map.setMaxPitch(80);
            // Closer than browsing allows: the camera comes down to about
            // rooftop height, just behind the figure. Vector tiles overzoom.
            map.setMaxZoom(21);
            try {
              map.setSky({
                'sky-color': '#a9cbe6', 'horizon-color': '#e8f0ec', 'fog-color': '#e8f0ec',
                'sky-horizon-blend': 0.6, 'horizon-fog-blend': 0.7, 'fog-ground-blend': 0.75
              });
            } catch (skyErr) { /* an older renderer draws no sky; the view still works */ }
            walkFrame = requestAnimationFrame(walkCamera);
            walkTimer = setInterval(function () {
              if (window.sakshiTownCheck) window.sakshiTownCheck();
              if (window.sakshiMonumentsCheck) window.sakshiMonumentsCheck();
            }, 1500);
          } else {
            cancelAnimationFrame(walkFrame);
            clearInterval(walkTimer);
            map.setMaxZoom(19);
            map.easeTo({ pitch: 58, zoom: Math.min(map.getZoom(), 18), padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration: 600 });
          }
          post({ type: 'walk-view', on: on });
        };
        map.on('dragstart', function (e) { if (walkView && e && e.originalEvent) window.sakshiSetWalkView(false); });

        map.addLayer({
          id: 'sakshi-figure',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function (m, gl) {
            renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
          },
          render: function (gl, matrix) {
            if (!pose.has) return;

            var now = performance.now();
            var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
            lastFrame = now;

            // Chase the reported fix rather than snapping to it. 4/second means
            // a one-second gap between fixes is covered smoothly and a jump is
            // still caught up with inside half a second.
            advancePose(Math.min(1, dt * 4));

            // 512 px tiles, so this is the half of the usual constant.
            var mPerPx = 78271.51696 * Math.cos(pose.drawLat * Math.PI / 180) / Math.pow(2, map.getZoom());
            // Never smaller than life: zoomed in far enough that a real person
            // would stand taller than FIGURE_PX, draw them at true size, so
            // the stride matches the ground passing under it.
            var scale = Math.max(1, ((walkView ? WALK_FIGURE_PX : FIGURE_PX) * mPerPx) / FIGURE_HEIGHT_M);

            // Walking is judged from the reported speed, not from whether the
            // smoothed position happens to be moving this frame. Fixes only
            // arrive every couple of metres, so standing still sends nothing
            // and the last speed would stand forever: once the next fix is
            // well overdue for that speed (twice the 2 m it should take), the
            // person has stopped.
            var sinceFix = Date.now() - (pose.lastAt || 0);
            var speedNow = sinceFix > Math.max(2500, 4000 / Math.max(0.4, pose.speed)) ? 0 : pose.speed;
            var walking = speedNow > 0.35;
            walkPhase += dt * (walking ? 5.2 : 1.3);

            // Two postures, eased between rather than switched. Walking, the
            // figure strides; standing, it settles — the robe widens, the whole
            // body drops a little and the arms come to rest. A hard swap
            // between the two looked like two different characters.
            settle += ((walking ? 0 : 1) - settle) * Math.min(1, dt * 2.6);

            var swing = walking ? 0.42 : 0.04;
            armL.rotation.x = Math.PI / 2 + Math.sin(walkPhase) * swing;
            armR.rotation.x = Math.PI / 2 - Math.sin(walkPhase) * swing;
            // Arms fold in as the figure settles, which is what turns a stride
            // into a stance.
            armL.position.x = -0.198 + settle * 0.03;
            armR.position.x = 0.198 - settle * 0.03;

            // A stride lifts twice per cycle; standing still, this is breath.
            var bob = walking ? Math.abs(Math.sin(walkPhase)) * 0.045 : Math.sin(walkPhase) * 0.012;
            lower.position.z = 0.40 + bob * 0.4 - settle * 0.05;
            lower.scale.set(1 + settle * 0.10, 1 + settle * 0.10, 1 - settle * 0.10);
            waist.position.z = 0.86 - settle * 0.06;
            figure.position.z = bob - settle * 0.03;

            // The shadow tightens and darkens as the figure comes to rest, and
            // spreads while it moves — the cheapest cue there is that something
            // is standing on ground rather than hovering over it.
            shadow.scale.setScalar(1.06 - settle * 0.12);
            shadowMat.opacity = 0.22 + settle * 0.10;

            halo.rotation.z += dt * 0.6;

            if (mixer && walkAction) {
              if (walking) {
                // Cadence follows the real speed and the size he is drawn at,
                // so a planted foot stays put on the ground. Drawn larger than
                // life (every zoom up to the map's 19), his stride is longer
                // by the same factor, so he takes fewer steps: a larger figure
                // walking unhurriedly, rather than one skating on the spot.
                walkAction.timeScale = Math.min(2.2, Math.max(0.2, speedNow / (naturalSpeed * scale)));
              } else if (walkAction.timeScale !== 0) {
                // Finish the step and stand with the feet together, rather
                // than freezing mid-stride, at no faster than he was walking.
                // Stop exactly on the next feet-together time if this frame
                // would reach it; a window around it is skipped by a slow frame.
                var finishRate = Math.min(0.8, Math.max(0.2, 1 / scale));
                var t = walkAction.time, adv = dt * finishRate;
                var ahead = Math.min.apply(null, neutralTimes.map(function (n) {
                  return ((n - t) % clipDuration + clipDuration) % clipDuration;
                }));
                if (ahead <= adv) {
                  walkAction.time = (t + ahead) % clipDuration;
                  walkAction.timeScale = 0;
                } else {
                  walkAction.timeScale = finishRate;
                }
              }
              mixer.update(dt);
              // The walker carries its own contact shadow cue; the robed
              // figure's bob and settle do not apply to it.
              figure.position.z = 0;
            }

            var origin = maplibregl.MercatorCoordinate.fromLngLat([pose.drawLng, pose.drawLat], 0);
            var unit = origin.meterInMercatorCoordinateUnits() * scale;

            // No further rotation: the model is authored X-east, Y-north, Z-up,
            // which is Mercator's own frame. The negative Y flips the axis that
            // grows southward so the model's north is the map's north.
            var l = new THREE.Matrix4()
              .makeTranslation(origin.x, origin.y, origin.z)
              .scale(new THREE.Vector3(unit, -unit, unit));

            // Z is the up axis, so a compass bearing turns the figure about Z.
            figure.rotation.z = -pose.drawHeading * Math.PI / 180;

            camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
            renderer.resetState();
            // In walking view a house between the camera and you must not
            // hide you: the figure is drawn last, so clearing depth here puts
            // it in front of the town, as a third-person view does.
            if (walkView) renderer.clearDepth();
            renderer.render(scene, camera);
            map.triggerRepaint();
          }
        });
      } catch (figureErr) {
        // The marker layers above already show where you are. Say so rather
        // than failing the map, and leave the reason where a log will find it.
        window.sakshiHasFigure = false;
        post({ type:'figure-unavailable', message: String(figureErr) });
      }
`;
