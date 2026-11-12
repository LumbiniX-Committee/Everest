import type { MapScan, ModelPlacement } from '@/data';

/**
 * Our own monument models, standing on the map at their sites.
 *
 * The same glTF files the website's 3D viewer and AR use (true metres,
 * north toward -Z, self-contained), drawn in 3D mode from street zoom, at true
 * size and north-aligned. Only the few nearest the centre of the view are
 * loaded, and any that leave the view are disposed, so a phone holds at most
 * MAX_MODELS at once.
 *
 * Where a model stands, the town layer steps aside: its drawn shape for that
 * site and any OpenStreetMap building inside the model's footprint are left
 * out (see `window.sakshiModelZones` in townLayer), so the two never draw one
 * inside the other.
 *
 * A model is placed only where its site's coordinate is known to about ten
 * metres (four decimal places). A rounded coordinate would put a temple in the
 * wrong square, and a schematic model in the wrong place is worse than none.
 *
 * Returned as page script, injected after the town layer. Without three.js or
 * the glTF loader it does nothing.
 */
export function monumentModelsScript(placements: ModelPlacement[], modelsUrl: string, scans: MapScan[] = []): string {
  // A real scan stands in for our schematic model of the same place.
  const scanned = new Set(scans.flatMap((s) => s.targets));
  const precise = [
    ...placements
      .filter((p) => decimals(p.latitude) >= 4 && decimals(p.longitude) >= 4)
      .filter((p) => !p.targets.some((t) => scanned.has(t)))
      .map((p) => ({ ...p, file: `${p.id}.gltf`, scan: false, headingDeg: 0, scale: 1 })),
    ...scans.map((s) => ({
      id: s.id,
      longitude: s.longitude,
      latitude: s.latitude,
      targets: s.targets,
      file: s.modelled ? `modelled/${s.file ?? s.id}.glb` : `scans/${s.id}.glb`,
      scan: true,
      headingDeg: s.headingDeg,
      scale: s.scale,
    })),
  ];
  return `
      (function () {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return;
        var PLACEMENTS = ${JSON.stringify(precise)};
        var BASE = ${JSON.stringify(modelsUrl.replace(/\/$/, ''))};
        // The same zoom the town layer starts at, so a model and the shape it
        // replaces never show together, or neither.
        var MIN_ZOOM = 15;
        var MAX_MODELS = 6;
        var VIEW_M = 1500;
        var entries = {};
        var renderer = null;
        var camera = new THREE.Camera();
        window.sakshiModelZones = [];

        function wanted() { return window.sakshiCurrentMode === '3d' && map.getZoom() >= MIN_ZOOM; }
        function metres(a, b) {
          var k = 111320, x = (a.lng - b.longitude) * k * Math.cos(a.lat * Math.PI / 180), y = (a.lat - b.latitude) * k;
          return Math.hypot(x, y);
        }

        function dispose(id) {
          var e = entries[id];
          delete entries[id];
          if (!e || !e.scene) return;
          e.scene.traverse(function (o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material) [].concat(o.material).forEach(function (m) {
              Object.keys(m).forEach(function (k) { if (m[k] && m[k].isTexture) m[k].dispose(); });
              m.dispose();
            });
          });
        }

        function load(p) {
          var e = entries[p.id] = { p: p, state: 'loading' };
          new THREE.GLTFLoader().load(BASE + '/' + p.file, function (gltf) {
            if (entries[p.id] !== e) return;
            var model = gltf.scene;
            // The viewer's ground plate: the map has ground of its own, and
            // the plate would also make the footprint half as wide again.
            var plate = model.getObjectByName('ground');
            if (plate) plate.parent.remove(plate);
            model.updateMatrixWorld(true);
            if (p.scan) {
              // A scan comes in its capture's own frame: centre it on its
              // footprint, stand its lowest point on the ground, then turn it
              // to line up with the map (clockwise from north).
              var raw = new THREE.Box3().setFromObject(model);
              var holder = new THREE.Group();
              model.position.x -= (raw.min.x + raw.max.x) / 2;
              model.position.z -= (raw.min.z + raw.max.z) / 2;
              model.position.y -= raw.min.y;
              holder.add(model);
              holder.scale.setScalar(p.scale);
              holder.rotation.y = -p.headingDeg * Math.PI / 180;
              model = holder;
              model.updateMatrixWorld(true);
              // Photogrammetry carries its own daylight in the texture.
              model.traverse(function (o) { if (o.isMesh) o.frustumCulled = false; });
            }
            var size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
            // Y-up glTF stood up in the map's Z-up frame: -Z (north) becomes +Y.
            var upright = new THREE.Group();
            upright.rotation.x = Math.PI / 2;
            upright.add(model);
            var scene = new THREE.Scene();
            scene.add(upright);
            // Brighter than the figure's lights: these are PBR materials with
            // no environment to reflect, and at the figure's levels a
            // whitewashed stupa came out as grey concrete.
            scene.add(new THREE.HemisphereLight(0xfff4e2, 0x6e7069, 1.6));
            var sun = new THREE.DirectionalLight(0xfff6ea, 1.2);
            sun.position.set(-0.4, -0.5, 1).normalize();
            scene.add(sun);
            e.scene = scene;
            e.origin = maplibregl.MercatorCoordinate.fromLngLat([p.longitude, p.latitude], 0);
            // At least 6 m clear: OSM often maps a small monument as a
            // building whose middle sits outside a tight footprint.
            e.radius = Math.max(p.scan ? 6 : 0, Math.max(size.x, size.z) / 2);
            e.state = 'ready';
            zones();
            map.triggerRepaint();
          }, undefined, function (err) {
            if (entries[p.id] !== e) return;
            e.state = 'failed';
            post({ type: 'monument-model-failed', id: p.id, message: String(err && err.message || err) });
          });
        }

        /** Tell the town layer which footprints are taken, and redraw it if that changed. */
        var lastZones = '';
        function zones() {
          var list = wanted() ? Object.keys(entries).map(function (id) { return entries[id]; })
            .filter(function (e) { return e.state === 'ready'; })
            .map(function (e) { return { lng: e.p.longitude, lat: e.p.latitude, r: e.radius, targets: e.p.targets }; }) : [];
          var key = list.map(function (z) { return z.targets[0]; }).sort().join(',');
          window.sakshiModelZones = list;
          if (key !== lastZones) {
            lastZones = key;
            if (window.sakshiTownRefresh) window.sakshiTownRefresh();
          }
        }

        function update() {
          if (!wanted()) { zones(); return; }
          var c = map.getCenter();
          var near = PLACEMENTS.map(function (p) { return { p: p, d: metres(c, p) }; })
            .filter(function (x) { return x.d < VIEW_M; })
            .sort(function (a, b) { return a.d - b.d; })
            .slice(0, MAX_MODELS);
          var keep = {};
          near.forEach(function (x) { keep[x.p.id] = 1; if (!entries[x.p.id]) load(x.p); });
          Object.keys(entries).forEach(function (id) {
            // A failed load is remembered while in view, so it is not retried every frame.
            if (!keep[id]) dispose(id);
          });
          zones();
        }
        var pending = null;
        map.on('idle', function () { clearTimeout(pending); pending = setTimeout(update, 250); });
        // Walking view never lets the map go idle; it calls this on a timer.
        window.sakshiMonumentsCheck = update;

        map.addLayer({
          id: 'sakshi-monuments',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function (m, gl) {
            renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
          },
          render: function (gl, matrix) {
            if (!wanted()) return;
            Object.keys(entries).forEach(function (id) {
              var e = entries[id];
              if (e.state !== 'ready') return;
              var unit = e.origin.meterInMercatorCoordinateUnits();
              var l = new THREE.Matrix4().makeTranslation(e.origin.x, e.origin.y, e.origin.z).scale(new THREE.Vector3(unit, -unit, unit));
              camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
              renderer.resetState();
              renderer.render(e.scene, camera);
            });
          }
        }, map.getLayer('sakshi-figure') ? 'sakshi-figure' : undefined);
        window.sakshiHasMonumentModels = true;
      })();
`;
}

/** Decimal places as written: 27.715 has three, so it is good to about a hundred metres. */
function decimals(value: number): number {
  const text = String(value);
  const dot = text.indexOf('.');
  return dot < 0 ? 0 : text.length - dot - 1;
}
