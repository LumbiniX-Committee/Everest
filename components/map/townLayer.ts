import type { FeatureCollection, Polygon } from 'geojson';

import { MAP_MATERIALS } from '@/theme';

/**
 * The 3D town: real house shapes in place of extruded boxes.
 *
 * MapLibre's own 3D buildings can only draw prisms, so in 3D mode every
 * building was the same beige block. This draws the same OpenStreetMap
 * footprints with three.js (already loaded for the walking figure):
 *
 * - Small and medium buildings get walls with window rows and a hipped roof
 *   in terracotta or tin. Large or irregular ones get a flat concrete roof
 *   with a parapet, which is how urban Nepal actually builds.
 * - Wall and roof colours vary per building, picked from MAP_MATERIALS by the
 *   building's id, so a street is varied but never changes between redraws.
 * - The app's monuments are drawn as what they are, never grander: stupas as
 *   domes with spires, the Ashokan Pillar as a column, Ramagrama as a grassy
 *   mound, excavated remains as low brick, and shelters such as the Maya Devi
 *   Temple as plain white buildings.
 *
 * It is a picture of a town, not a survey: heights come from OSM where
 * mapped, and roofs are a typical shape, not a measured one. Built only at
 * street zoom, from the tiles on screen, capped so a phone stays smooth.
 *
 * Returned as page script, injected after the figure layer. Without three.js
 * it does nothing and the map keeps its plain extrusions.
 */
export function townLayerScript(monuments: FeatureCollection<Polygon>): string {
  const m = MAP_MATERIALS;
  return `
      (function () {
        if (typeof THREE === 'undefined') return;
        var MIN_ZOOM = 15;
        var MAX_BUILDINGS = 1400;
        var WALLS = ${JSON.stringify(m.walls)}.map(function (c) { return new THREE.Color(c); });
        var ROOFS = ${JSON.stringify(m.pitchedRoofs)}.map(function (c) { return new THREE.Color(c); });
        var FLATS = ${JSON.stringify(m.flatRoofs)}.map(function (c) { return new THREE.Color(c); });
        var PARAPET = new THREE.Color(${JSON.stringify(m.parapet)});
        var WHITE = new THREE.Color(${JSON.stringify(m.whitewash)});
        var GILT = new THREE.Color(${JSON.stringify(m.gilt)});
        var BRICK = new THREE.Color(${JSON.stringify(m.templeBrick)});
        var SANDSTONE = new THREE.Color(${JSON.stringify(m.sandstone)});
        var GRASS = new THREE.Color(${JSON.stringify(m.grass)});

        // One window on one storey of wall, tiled along every facade. White
        // ground, so the wall colour comes from the vertex colour it multiplies.
        function wallTexture() {
          var c = document.createElement('canvas');
          c.width = 64; c.height = 64;
          var g = c.getContext('2d');
          g.fillStyle = '#ffffff'; g.fillRect(0, 0, 64, 64);
          g.fillStyle = 'rgba(0,0,0,0.08)'; g.fillRect(0, 61, 64, 3);
          g.fillStyle = ${JSON.stringify(m.windowFrame)}; g.fillRect(24, 22, 16, 20);
          g.fillStyle = ${JSON.stringify(m.windowGlass)}; g.fillRect(26, 24, 12, 16);
          g.fillStyle = ${JSON.stringify(m.windowFrame)}; g.fillRect(31, 24, 2, 16);
          g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(22, 42, 20, 2);
          var t = new THREE.CanvasTexture(c);
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          return t;
        }
        var wallMat = new THREE.MeshLambertMaterial({ map: wallTexture(), vertexColors: true });
        var plainMat = new THREE.MeshLambertMaterial({ vertexColors: true });

        var scene = new THREE.Scene();
        // three.js r155+ lights are physically scaled, so these are brighter
        // numbers than the figure uses; tuned until lime wash reads as white.
        scene.add(new THREE.HemisphereLight(0xfffaf0, 0x8a857a, 2.1));
        scene.add(new THREE.AmbientLight(0xffffff, 0.55));
        var sun = new THREE.DirectionalLight(0xfff1dc, 1.7);
        sun.position.set(-0.55, -0.75, 1.1);
        scene.add(sun);
        var camera = new THREE.Camera();
        var renderer = null;
        var town = null;
        var origin = null;
        var built = { lng: 0, lat: 0, zoom: 0, count: -1 };

        function pick(list, id, salt) {
          var n = Math.abs(((id * 2654435761) ^ salt) | 0);
          return list[n % list.length];
        }

        /** Footprint to local metres around the origin, x east and y north. */
        function toLocal(ring, unit) {
          var out = [];
          for (var i = 0; i < ring.length; i++) {
            var mc = maplibregl.MercatorCoordinate.fromLngLat(ring[i], 0);
            out.push([(mc.x - origin.x) / unit, -(mc.y - origin.y) / unit]);
          }
          if (out.length > 1) {
            var a = out[0], b = out[out.length - 1];
            if (a[0] === b[0] && a[1] === b[1]) out.pop();
          }
          return out;
        }
        function area(pts) {
          var s = 0;
          for (var i = 0; i < pts.length; i++) { var a = pts[i], b = pts[(i + 1) % pts.length]; s += a[0] * b[1] - b[0] * a[1]; }
          return s / 2;
        }
        function convex(pts) {
          var sign = 0;
          for (var i = 0; i < pts.length; i++) {
            var a = pts[i], b = pts[(i + 1) % pts.length], c = pts[(i + 2) % pts.length];
            var cr = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
            if (Math.abs(cr) < 1e-6) continue;
            var s = cr > 0 ? 1 : -1;
            if (sign === 0) sign = s; else if (s !== sign) return false;
          }
          return true;
        }

        function Builder() {
          this.pos = []; this.nor = []; this.col = []; this.uv = [];
        }
        Builder.prototype.tri = function (a, b, c, color, uvs) {
          var ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
          var vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
          var nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
          var len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
          nx /= len; ny /= len; nz /= len;
          var pts = [a, b, c];
          for (var i = 0; i < 3; i++) {
            this.pos.push(pts[i][0], pts[i][1], pts[i][2]);
            this.nor.push(nx, ny, nz);
            this.col.push(color.r, color.g, color.b);
            if (uvs) this.uv.push(uvs[i][0], uvs[i][1]); else this.uv.push(0, 0);
          }
        };
        Builder.prototype.mesh = function (material) {
          var g = new THREE.BufferGeometry();
          g.setAttribute('position', new THREE.Float32BufferAttribute(this.pos, 3));
          g.setAttribute('normal', new THREE.Float32BufferAttribute(this.nor, 3));
          g.setAttribute('color', new THREE.Float32BufferAttribute(this.col, 3));
          g.setAttribute('uv', new THREE.Float32BufferAttribute(this.uv, 2));
          return new THREE.Mesh(g, material);
        };

        var STOREY = 3.0, BAY = 3.2;
        /** Walls from base to top, wound so their faces point outward. */
        function walls(B, pts, base, top, color, textured) {
          var ccw = area(pts) > 0;
          var run = 0;
          for (var i = 0; i < pts.length; i++) {
            var a = pts[i], b = pts[(i + 1) % pts.length];
            if (!ccw) { var t = a; a = b; b = t; }
            var len = Math.hypot(b[0] - a[0], b[1] - a[1]);
            var u0 = run / BAY, u1 = (run + len) / BAY, v0 = base / STOREY, v1 = top / STOREY;
            run += len;
            var p0 = [a[0], a[1], base], p1 = [b[0], b[1], base], p2 = [b[0], b[1], top], p3 = [a[0], a[1], top];
            var uv = textured ? [[u0, v0], [u1, v0], [u1, v1]] : null;
            var uv2 = textured ? [[u0, v0], [u1, v1], [u0, v1]] : null;
            B.tri(p0, p1, p2, color, uv);
            B.tri(p0, p2, p3, color, uv2);
          }
        }
        /** A hipped roof: every eave edge rises to one ridge point. */
        function hipRoof(B, pts, top, rise, color) {
          var cx = 0, cy = 0;
          for (var i = 0; i < pts.length; i++) { cx += pts[i][0]; cy += pts[i][1]; }
          cx /= pts.length; cy /= pts.length;
          var ccw = area(pts) > 0;
          var apex = [cx, cy, top + rise];
          for (var j = 0; j < pts.length; j++) {
            var a = pts[j], b = pts[(j + 1) % pts.length];
            if (!ccw) { var t = a; a = b; b = t; }
            // Eaves overhang a little, which is most of what makes a roof read as one.
            var ea = [cx + (a[0] - cx) * 1.08, cy + (a[1] - cy) * 1.08, top];
            var eb = [cx + (b[0] - cx) * 1.08, cy + (b[1] - cy) * 1.08, top];
            B.tri(ea, eb, apex, color);
          }
        }
        /** A flat roof slab at the top, triangulated from the footprint. */
        function flatRoof(B, pts, z, color) {
          var contour = pts.map(function (p) { return new THREE.Vector2(p[0], p[1]); });
          var faces = THREE.ShapeUtils.triangulateShape(contour, []);
          var ccw = area(pts) > 0;
          for (var i = 0; i < faces.length; i++) {
            var f = faces[i];
            var a = pts[f[0]], b = pts[f[1]], c = pts[f[2]];
            if (ccw) B.tri([a[0], a[1], z], [b[0], b[1], z], [c[0], c[1], z], color);
            else B.tri([a[0], a[1], z], [c[0], c[1], z], [b[0], b[1], z], color);
          }
        }

        /*
         * Where a monument model stands (monumentModels), this layer draws
         * nothing: not the site's own shape, and no OSM building whose middle
         * falls inside the model's footprint.
         */
        function zoneFor(lng, lat) {
          var zones = window.sakshiModelZones || [];
          for (var i = 0; i < zones.length; i++) {
            var z = zones[i];
            var x = (lng - z.lng) * 111320 * Math.cos(z.lat * Math.PI / 180), y = (lat - z.lat) * 111320;
            if (Math.hypot(x, y) < z.r) return z;
          }
          return null;
        }
        function modelTakes(siteId) {
          return (window.sakshiModelZones || []).some(function (z) { return z.targets.indexOf(siteId) >= 0; });
        }

        function buildMonuments(textured, plain, unit) {
          var data = ${JSON.stringify(monuments)};
          data.features.forEach(function (f, idx) {
            if (modelTakes(f.properties.id)) return;
            var pts = toLocal(f.geometry.coordinates[0], unit);
            if (pts.length < 3) return;
            var h = f.properties.height || 6;
            var cx = 0, cy = 0, r = 0;
            pts.forEach(function (p) { cx += p[0]; cy += p[1]; });
            cx /= pts.length; cy /= pts.length;
            pts.forEach(function (p) { r = Math.max(r, Math.hypot(p[0] - cx, p[1] - cy)); });
            var id = f.properties.id;
            if (id === 'ashokan-pillar') {
              // A polished sandstone column, about 0.8 m across, on a low railing plinth.
              walls(plain, pts.map(function (p) { return [cx + (p[0] - cx) * 0.35, cy + (p[1] - cy) * 0.35]; }), 0, 0.6, BRICK, false);
              var column = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.42, h, 16), new THREE.MeshLambertMaterial({ color: SANDSTONE }));
              column.rotation.x = Math.PI / 2;
              column.position.set(cx, cy, h / 2);
              town.add(column);
            } else if (id === 'ramagrama') {
              // The unopened relic mound: earth and grass, never excavated.
              var mound = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshLambertMaterial({ color: GRASS }));
              mound.rotation.x = Math.PI / 2;
              mound.scale.set(1, h / r, 1);
              town.add(mound);
              mound.position.set(cx, cy, 0);
            } else if (f.properties.form === 'round') {
              // Plinth, dome, then a spire: a stupa, gilt where the stupa is.
              var skin = id === 'myanmar-temple' ? GILT : WHITE;
              var plinth = pts.map(function (p) { return [cx + (p[0] - cx) * 1.15, cy + (p[1] - cy) * 1.15]; });
              walls(plain, plinth, 0, h * 0.12, WHITE, false);
              flatRoof(plain, plinth, h * 0.12, WHITE);
              var dome = new THREE.Mesh(new THREE.SphereGeometry(r * 0.95, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2),
                new THREE.MeshLambertMaterial({ color: skin }));
              dome.rotation.x = Math.PI / 2;
              dome.scale.set(1, h * 0.42 / (r * 0.95), 1);
              dome.position.set(cx, cy, h * 0.12);
              town.add(dome);
              var spire = new THREE.Mesh(new THREE.ConeGeometry(r * 0.22, h * 0.48, 16), new THREE.MeshLambertMaterial({ color: GILT }));
              spire.rotation.x = Math.PI / 2;
              spire.position.set(cx, cy, h * 0.52 + h * 0.24);
              town.add(spire);
            } else if (h <= 3) {
              // Excavated remains: low brick courses, open to the sky.
              walls(textured, pts, 0, h, BRICK, false);
              flatRoof(plain, pts, h, BRICK);
            } else {
              // A shelter or hall: whitewashed walls and a flat roof. Nothing
              // grander is drawn than is known; the Maya Devi Temple really is
              // a plain white building over the excavated remains.
              walls(textured, pts, 0, h, WHITE, true);
              flatRoof(plain, pts, h, PARAPET);
              walls(plain, pts, h, h + 0.8, WHITE, false);
            }
          });
        }

        function rebuild() {
          var zoom = map.getZoom();
          var centre = map.getCenter();
          var feats = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' });
          if (town) { scene.remove(town); town.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); town = null; }
          if (zoom < MIN_ZOOM) { built.count = -1; return; }
          origin = maplibregl.MercatorCoordinate.fromLngLat([centre.lng, centre.lat], 0);
          var unit = origin.meterInMercatorCoordinateUnits();
          town = new THREE.Group();
          var textured = new Builder(), plain = new Builder();
          var seen = {}, list = [];
          for (var i = 0; i < feats.length; i++) {
            var f = feats[i], g = f.geometry;
            if (!g) continue;
            var polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
            for (var k = 0; k < polys.length; k++) {
              var ring = polys[k][0];
              if (!ring || ring.length < 4) continue;
              var key = ring[0][0].toFixed(6) + ',' + ring[0][1].toFixed(6) + ',' + ring.length;
              if (seen[key]) continue;
              seen[key] = 1;
              var mx = 0, my = 0;
              for (var q = 0; q < ring.length - 1; q++) { mx += ring[q][0]; my += ring[q][1]; }
              if (zoneFor(mx / (ring.length - 1), my / (ring.length - 1))) continue;
              var d = Math.hypot(ring[0][0] - centre.lng, ring[0][1] - centre.lat);
              list.push({ ring: ring, d: d, h: f.properties.render_height || 6, base: f.properties.render_min_height || 0, id: (f.id || 0) + k });
            }
          }
          list.sort(function (a, b) { return a.d - b.d; });
          list = list.slice(0, MAX_BUILDINGS);
          for (var j = 0; j < list.length; j++) {
            var b = list[j];
            var pts = toLocal(b.ring, unit);
            if (pts.length < 3) continue;
            var footprint = Math.abs(area(pts));
            if (footprint < 4) continue;
            var wall = pick(WALLS, b.id, 7);
            // Pitched roofs are the exception in the valley (old houses, sheds);
            // from above it is mostly flat concrete, as satellite views show.
            var pitched = footprint < 140 && b.h <= 9 && convex(pts) && pts.length <= 6 && (b.id % 5 === 0);
            walls(textured, pts, b.base, b.h, wall, true);
            if (pitched) {
              hipRoof(plain, pts, b.h, Math.min(3.2, 0.35 * Math.sqrt(footprint)), pick(ROOFS, b.id, 13));
            } else {
              flatRoof(plain, pts, b.h, pick(FLATS, b.id, 11));
              // A low parapet round the edge, so a flat roof still has a skyline.
              var inset = pts.map(function (p) { return p; });
              walls(plain, inset, b.h, b.h + 0.9, PARAPET, false);
            }
          }
          buildMonuments(textured, plain, unit);
          town.add(textured.mesh(wallMat));
          town.add(plain.mesh(plainMat));
          scene.add(town);
          built = { lng: centre.lng, lat: centre.lat, zoom: zoom, count: feats.length };
          map.triggerRepaint();
        }

        function wanted() { return window.sakshiCurrentMode === '3d'; }
        var pending = null;
        function schedule() {
          if (!wanted()) return;
          clearTimeout(pending);
          pending = setTimeout(function () {
            var c = map.getCenter(), z = map.getZoom();
            var moved = Math.hypot(c.lng - built.lng, c.lat - built.lat) * 111000;
            var count = map.querySourceFeatures('openmaptiles', { sourceLayer: 'building' }).length;
            if (moved > 120 || Math.abs(z - built.zoom) > 0.6 || count !== built.count) rebuild();
          }, 250);
        }
        map.on('idle', schedule);
        window.sakshiTownRefresh = function () { built.count = -2; schedule(); };
        // Walking view moves the camera every frame, so the map is never
        // idle; it calls this on a timer instead.
        window.sakshiTownCheck = schedule;

        map.addLayer({
          id: 'sakshi-town',
          type: 'custom',
          renderingMode: '3d',
          onAdd: function (m, gl) {
            renderer = new THREE.WebGLRenderer({ canvas: m.getCanvas(), context: gl, antialias: true });
            renderer.autoClear = false;
          },
          render: function (gl, matrix) {
            if (!wanted() || !town || !origin || map.getZoom() < MIN_ZOOM) return;
            var unit = origin.meterInMercatorCoordinateUnits();
            var l = new THREE.Matrix4().makeTranslation(origin.x, origin.y, origin.z).scale(new THREE.Vector3(unit, -unit, unit));
            camera.projectionMatrix = new THREE.Matrix4().fromArray(matrix).multiply(l);
            renderer.resetState();
            renderer.render(scene, camera);
          }
        }, map.getLayer('sakshi-figure') ? 'sakshi-figure' : undefined);
        window.sakshiHasTown = true;
      })();
`;
}
