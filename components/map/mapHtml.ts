import { MAP_HOME, monumentGeoJSON, precinctGeoJSON, siteGeoJSON, waterGeoJSON } from '@/data';
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
}: MapHtmlOptions = {}): string {
  const zoom = fullscreen ? MAP_HOME.zoom + 1.5 : MAP_HOME.zoom;
  const pitch = fullscreen ? 65 : MAP_HOME.pitch;

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
  html,body,#map{margin:0;padding:0;height:100%;width:100%;background:${colors.background}}
  .maplibregl-ctrl-attrib{font-size:10px}
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
      attributionControl: { compact: true },
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
      map.addSource('precincts', { type:'geojson', data: ${JSON.stringify(precinctGeoJSON)} });
      map.addLayer({
        id:'precinct-walls', type:'fill-extrusion', source:'precincts',
        paint:{
          'fill-extrusion-color': ${JSON.stringify(colors.sandstoneDeep)},
          'fill-extrusion-height': 6,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.65
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
          'fill-extrusion-color': ${JSON.stringify(colors.surface)},
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
${avatar ? AVATAR_LAYER : ''}
      post({ type:'ready' });
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
      map.addControl(new maplibregl.NavigationControl({
        showZoom: true,
        showCompass: true,
        visualizePitch: true
      }), 'top-right');

      map.addControl(new maplibregl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showAccuracyCircle: true
      }), 'top-right');

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
 * A figure standing on the map, at the reported position.
 *
 * Built from three.js primitives rather than loaded as a glTF. That is a
 * deliberate choice, not a shortcut: a downloaded human model carries a licence
 * to honour and a style that would not match anything else here, and this only
 * has to read as a person from above at map scale. Sandstone, like the rest of
 * the app's built things.
 *
 * It is a position marker, not a playable avatar — no walk cycle, no
 * third-person camera behind the shoulder. On a pilgrimage the person is the
 * one walking, and the map's job is to say where they are.
 *
 * Position and heading arrive from React Native through window.sakshiSetPose,
 * which the WebView calls on every fix.
 */
const AVATAR_LAYER = `
      var THREE_SCALE = 1.0;
      var pose = { lng: ${MAP_HOME.centre[0]}, lat: ${MAP_HOME.centre[1]}, heading: 0, has: false };
      var camera = new THREE.Camera();
      var scene = new THREE.Scene();
      var figure = new THREE.Group();

      var stone = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.sandstoneDeep)} });
      var cloth = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.earth)} });

      // Head, torso, two legs. Enough to read as a standing person at the size
      // a phone renders it; more geometry would not survive the scale.
      var head = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 12), stone);
      head.position.set(0, 0, 15.5);
      var torso = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 8, 12), cloth);
      torso.rotation.x = Math.PI / 2;
      torso.position.set(0, 0, 9);
      var legs = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 6, 10), stone);
      legs.rotation.x = Math.PI / 2;
      legs.position.set(0, 0, 3);
      // Points the way the person is facing, so heading is legible from above.
      var facing = new THREE.Mesh(new THREE.ConeGeometry(1.6, 4, 12), cloth);
      facing.rotation.x = -Math.PI / 2;
      facing.position.set(0, 5.5, 1);

      figure.add(head); figure.add(torso); figure.add(legs); figure.add(facing);
      scene.add(figure);
      scene.add(new THREE.AmbientLight(0xffffff, 0.85));
      var sun = new THREE.DirectionalLight(0xffffff, 0.6);
      sun.position.set(0, -70, 100).normalize();
      scene.add(sun);

      var renderer = null;

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
          var origin = maplibregl.MercatorCoordinate.fromLngLat([pose.lng, pose.lat], 0);
          var metres = origin.meterInMercatorCoordinateUnits() * THREE_SCALE;

          var l = new THREE.Matrix4()
            .makeTranslation(origin.x, origin.y, origin.z)
            .scale(new THREE.Vector3(metres, -metres, metres))
            // Mercator's axes are not three.js's; the x-rotation stands the
            // figure up on the ground plane instead of laying it flat.
            .multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2));

          figure.rotation.y = -(pose.heading || 0) * Math.PI / 180;
          camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
          renderer.resetState();
          renderer.render(scene, camera);
          map.triggerRepaint();
        }
      });

      // Called from React Native on every position fix.
      window.sakshiSetPose = function (lng, lat, heading, follow) {
        pose.lng = lng; pose.lat = lat; pose.heading = heading || 0;
        var first = !pose.has;
        pose.has = true;
        if (follow || first) {
          map.easeTo({ center: [lng, lat], duration: first ? 0 : 900 });
        }
        map.triggerRepaint();
      };
`;
