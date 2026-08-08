import { MAP_HOME, precinctGeoJSON, siteGeoJSON } from '@/data';
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
export function buildMapHtml({ avatar = false, fullscreen = false }: MapHtmlOptions = {}): string {
  const zoom = fullscreen ? MAP_HOME.zoom + 1.5 : MAP_HOME.zoom;
  const pitch = fullscreen ? 65 : MAP_HOME.pitch;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
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
      attributionControl: { compact: true }
    });
    map.on('error', function(e){ post({ type:'error', message: String((e && e.error && e.error.message) || 'map error') }); });

    map.on('load', function(){
      map.addSource('precincts', { type:'geojson', data: ${JSON.stringify(precinctGeoJSON)} });
      map.addLayer({
        id:'precinct-walls', type:'fill-extrusion', source:'precincts',
        paint:{
          'fill-extrusion-color': ${JSON.stringify(colors.sandstone)},
          'fill-extrusion-height': 6,
          'fill-extrusion-base': 0,
          'fill-extrusion-opacity': 0.5
        }
      });
      map.addSource('sites', { type:'geojson', data: ${JSON.stringify(siteGeoJSON)} });
      map.addLayer({
        id:'site-dot', type:'circle', source:'sites',
        paint:{
          'circle-radius': 6,
          'circle-color': ${JSON.stringify(colors.earth)},
          'circle-stroke-width': 2,
          'circle-stroke-color': ${JSON.stringify(colors.sandstone)}
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

      var stone = new THREE.MeshLambertMaterial({ color: ${JSON.stringify(colors.sandstone)} });
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
