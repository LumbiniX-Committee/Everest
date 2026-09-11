import {
  MAP_CAMERA,
  MAP_HOME,
  monumentGeoJSON,
  precinctGroundGeoJSON,
  precinctWallGeoJSON,
  siteGeoJSON,
  waterGeoJSON,
} from '@/data';
import { colors, sakshiMapStyle } from '@/theme';

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
};

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
export function buildMapHtml({
  avatar = false,
  fullscreen = false,
  interactive = fullscreen,
  topInset = 0,
}: MapHtmlOptions = {}): string {
  // Named camera rather than an offset from MAP_HOME — see MAP_CAMERA for why
  // the old `+ 1.5` opened the world about three times too close to play in.
  const camera = fullscreen ? MAP_CAMERA.world : MAP_CAMERA.overview;
  const zoom = camera.zoom;
  const pitch = camera.pitch;
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
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
${avatar ? '<script src="https://unpkg.com/three@0.160.0/build/three.min.js"></script>' : ''}
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
    background: ${colors.backgroundDeep} !important;
    border: 1px solid ${colors.borderStrong} !important;
    border-radius: 24px !important;
    box-shadow: 0 4px 14px ${colors.overlay} !important;
    overflow: hidden;
  }
  .maplibregl-ctrl-group button {
    width: 52px !important;
    height: 52px !important;
    border-bottom: 1px solid ${colors.border} !important;
    background-color: ${colors.backgroundDeep} !important;
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
    background: ${colors.backgroundDeep} !important;
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
  try {
    var map = new maplibregl.Map({
      container: 'map',
      style: ${JSON.stringify(sakshiMapStyle)},
      center: ${JSON.stringify(MAP_HOME.centre)},
      zoom: ${zoom},
      pitch: ${pitch},
      bearing: ${MAP_HOME.bearing},
      attributionControl: { compact: false },
      interactive: ${interactive},
      // Lumbini is a few square kilometres; there is no reason to allow a
      // whole-planet zoom-out that loses the place entirely.
      minZoom: 12,
      maxZoom: 19,
      // A pinch that also rotates makes a small map feel unsteady. Zoom is the
      // gesture people actually want here; rotation stays on the compass.
      pitchWithRotate: ${interactive},
      dragRotate: ${interactive}
    });
${interactive ? INTERACTIVE_CONTROLS : ''}
    map.on('error', function(e){ post({ type:'error', message: String((e && e.error && e.error.message) || 'map error') }); });

    map.on('load', function(){
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

      map.addSource('precinct-walls', { type:'geojson', data: ${JSON.stringify(precinctWallGeoJSON)} });

      // The wall. A band with a gateway rather than an extruded disc — see
      // wallBand() in data/demo/geo.ts for why the disc was both wrong and
      // expensive.
      map.addLayer({
        id:'precinct-wall', type:'fill-extrusion', source:'precinct-walls',
        paint:{
          'fill-extrusion-color': ${JSON.stringify(colors.sandstoneDeep)},
          'fill-extrusion-height': ['get','height'],
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.9,
          'fill-extrusion-vertical-gradient': true
        }
      });

      // The capping course, a shade lighter and slightly proud of the wall.
      // minzoom 15: below it the whole precinct is a few hundred pixels across
      // and a 45 cm band is subpixel — geometry that can only cost fill rate.
      map.addLayer({
        id:'precinct-coping', type:'fill-extrusion', source:'precinct-walls',
        minzoom: 15,
        paint:{
          'fill-extrusion-color': ${JSON.stringify(colors.sandstone)},
          'fill-extrusion-height': ['get','copingHeight'],
          'fill-extrusion-base': ['get','copingBase'],
          'fill-extrusion-opacity': 0.95
        }
      });
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

      map.addSource('sites', { type:'geojson', data: ${JSON.stringify(siteGeoJSON)} });
      map.addLayer({
        id:'site-dot', type:'circle', source:'sites',
        paint:{
          'circle-radius': 6,
          'circle-color': ${JSON.stringify(colors.earth)},
          'circle-stroke-width': 2,
          'circle-stroke-color': ${JSON.stringify(colors.surface)}
        }
      });
      map.addLayer({
        id:'site-label', type:'symbol', source:'sites',
        layout:{
          'text-field':['get','name'],
          'text-font':['Noto Sans Regular'],
          'text-size':12,
          'text-offset':[0,-1.4],
          'text-anchor':'bottom',
          'text-allow-overlap':false
        },
        paint:{
          'text-color': ${JSON.stringify(colors.textPrimary)},
          'text-halo-color': ${JSON.stringify(colors.background)},
          'text-halo-width': 1.6
        }
      });
      map.on('click','site-dot', function(e){
        var f = e.features && e.features[0];
        if (f && f.properties && f.properties.id) post({ type:'site', id: f.properties.id });
      });
      map.getCanvas().style.cursor = 'default';
${avatar ? POSITION_MARKER : ''}
      // Ready is posted *before* the character. The figure needs three.js from
      // a CDN, and when that request fails — a cold start on site signal, an
      // offline device — the throw used to escape this handler before the ready
      // message, so the WebView timed out and the whole map fell back to the
      // schematic plan. The map does not need the character; the character
      // needs the map.
      post({ type:'ready' });
${avatar ? AVATAR_LAYER : ''}
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
      map.addSource('me-trail', { type:'geojson', data: { type:'FeatureCollection', features: [] } });
      map.addSource('me-route', { type:'geojson', data: { type:'FeatureCollection', features: [] } });

      // The planned way, under everything. Dashed, because it is an intention
      // rather than a record of anything that happened.
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
      window.sakshiSetPose = function (lng, lat, heading, follow) {
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
            var scale = (FIGURE_PX * mPerPx) / FIGURE_HEIGHT_M;

            // Walking is judged from the reported speed, not from whether the
            // smoothed position happens to be moving this frame.
            var walking = pose.speed > 0.35;
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
