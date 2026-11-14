import { THREE_JS } from '@/components/map/vendor.generated';
import { colors } from '@/theme';

export type PanoramaPageHotspot = { id: string; u: number; v: number; title: string };

export type PanoramaPageConfig = {
  /** Phone-sized image, at most 4096 wide, for GPUs that take a 4096 texture. */
  imageUrl: string;
  /** A smaller copy for GPUs whose texture limit is below the large image. */
  fallbackUrl: string;
  /** The image column that faces true north. */
  northU: number;
  /** Compass direction to face first. */
  startAzimuth: number;
  hotspots: PanoramaPageHotspot[];
};

/**
 * The page the 360° view runs in: three.js (the copy the map already ships)
 * drawing the equirectangular photograph on the inside of a sphere.
 *
 * The view is held as a compass direction (azimuth, elevation), not as a camera
 * matrix, so the app can drive it straight from the phone's sensors and so
 * "north" in the photograph can be put where north is. The page talks back
 * with small JSON messages: ready, loaded, error, hotspot, view.
 *
 * Commands arrive through `window.saksi.command({...})`:
 *   look   { az, el }   point the view (motion mode); eased, never jumped
 *   motion { on }       while on, a drag no longer turns the view; pinch still zooms
 *   focus  { id }       turn to a hotspot
 *   labels { titles }   swap hotspot titles when the narration language changes
 */
export function buildPanoramaHtml(config: PanoramaPageConfig): string {
  const safeConfig = JSON.stringify(config).replace(/</g, '\\u003c');
  const safeThree = THREE_JS.replace(/<\/script/gi, '<\\/script');

  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html,body{margin:0;height:100%;overflow:hidden;background:${colors.backgroundDeep};touch-action:none;-webkit-user-select:none;user-select:none}
  canvas{display:block;width:100%;height:100%}
  #spots{position:absolute;inset:0;pointer-events:none;overflow:hidden}
  .spot{position:absolute;left:0;top:0;display:flex;align-items:center;gap:6px;pointer-events:auto;border:0;padding:0;background:none;
    font:600 13px/1.2 system-ui,sans-serif;color:${colors.onScrim};will-change:transform}
  .spot i{display:block;width:22px;height:22px;border-radius:11px;background:${colors.accent};border:2px solid ${colors.onScrim};
    box-shadow:0 0 0 4px rgba(247,168,35,.28),0 2px 6px rgba(0,0,0,.4)}
  .spot span{background:${colors.scrim};padding:4px 8px;border-radius:10px;max-width:160px}
  .spot.active i{background:${colors.onScrim};border-color:${colors.accent}}
  #north{position:absolute;top:10px;right:10px;width:40px;height:40px;border-radius:20px;background:${colors.scrim};
    border:1px solid ${colors.onScrimBorder};pointer-events:none}
  #north b{position:absolute;left:50%;top:50%;width:0;height:0;margin:-15px 0 0 -6px;border-left:6px solid transparent;border-right:6px solid transparent;
    border-bottom:15px solid ${colors.accent};transform-origin:6px 15px}
  #north em{position:absolute;left:0;right:0;bottom:2px;text-align:center;font:700 9px system-ui,sans-serif;color:${colors.onScrim};font-style:normal}
</style>
<script>${safeThree}</script>
</head><body>
<div id="spots"></div>
<div id="north"><b id="needle"></b><em>N</em></div>
<script>
(function(){
  var CONFIG = ${safeConfig};
  function post(m){
    var s = JSON.stringify(m);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(s);
    else if (window.parent && window.parent !== window) window.parent.postMessage(s, '*');
  }
  window.onerror = function(msg){ post({ type: 'error', reason: 'script', message: String(msg) }); };
  if (typeof THREE === 'undefined') { post({ type: 'error', reason: 'webgl' }); return; }

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: false });
  } catch (e) { post({ type: 'error', reason: 'webgl' }); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  document.body.insertBefore(renderer.domElement, document.body.firstChild);

  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(75, 1, 1, 1100);
  var geometry = new THREE.SphereGeometry(500, 64, 32);
  // Inside-out, so the photograph reads correctly from the centre.
  geometry.scale(-1, 1, 1);
  var material = new THREE.MeshBasicMaterial({ color: 0x223338 });
  scene.add(new THREE.Mesh(geometry, material));

  var RAD = Math.PI / 180;
  var az = CONFIG.startAzimuth, el = 0, fov = 75;
  var targetAz = null, targetEl = null, motion = false, tween = null;

  function wrap(d){ d = d % 360; return d < 0 ? d + 360 : d; }
  function delta(a, b){ var d = wrap(b - a); return d > 180 ? d - 360 : d; }
  function clampEl(e){ return Math.max(-85, Math.min(85, e)); }
  /** A compass direction to a point on the sphere, in three.js's frame for this mesh. */
  function dir(azimuth, elevation, r){
    var u = CONFIG.northU + azimuth / 360;
    var v = 0.5 - elevation / 180;
    var phi = 2 * Math.PI * u, theta = Math.PI * v;
    return new THREE.Vector3(Math.cos(phi) * Math.sin(theta) * r, Math.cos(theta) * r, Math.sin(phi) * Math.sin(theta) * r);
  }
  function spotAz(s){ return wrap((s.u - CONFIG.northU) * 360); }
  function spotEl(s){ return (0.5 - s.v) * 180; }

  // Hotspots as plain buttons laid over the canvas, so they stay sharp and tappable.
  var layer = document.getElementById('spots');
  var spots = CONFIG.hotspots.map(function(s){
    var b = document.createElement('button');
    b.className = 'spot';
    b.setAttribute('type', 'button');
    var dot = document.createElement('i');
    var label = document.createElement('span');
    label.textContent = s.title;
    b.appendChild(dot); b.appendChild(label);
    b.addEventListener('click', function(ev){ ev.stopPropagation(); post({ type: 'hotspot', id: s.id }); });
    b.addEventListener('pointerdown', function(ev){ ev.stopPropagation(); });
    layer.appendChild(b);
    return { s: s, el: b, label: label, world: dir(spotAz(s), spotEl(s), 400) };
  });
  var needle = document.getElementById('needle');

  function resize(){
    var w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);
  resize();

  // ---- Image -------------------------------------------------------------
  var maxTex = renderer.capabilities.maxTextureSize || 2048;
  var url = maxTex >= 4096 ? CONFIG.imageUrl : CONFIG.fallbackUrl;
  var loader = new THREE.TextureLoader();
  loader.setCrossOrigin('anonymous');
  post({ type: 'ready' });
  loader.load(url, function(tex){
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    material.color.set(0xffffff);
    material.map = tex;
    material.needsUpdate = true;
    post({ type: 'loaded', width: tex.image && tex.image.width });
  }, undefined, function(){ post({ type: 'error', reason: 'image' }); });

  // ---- Touch: drag to look, pinch to zoom ---------------------------------
  var pointers = {}, pinchStart = null, last = null;
  function count(){ return Object.keys(pointers).length; }
  function spread(){
    var p = Object.keys(pointers).map(function(k){ return pointers[k]; });
    return Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
  }
  var canvas = renderer.domElement;
  canvas.addEventListener('pointerdown', function(e){
    canvas.setPointerCapture && canvas.setPointerCapture(e.pointerId);
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    tween = null;
    if (count() === 2) { pinchStart = { d: spread(), fov: fov }; last = null; }
    else last = { x: e.clientX, y: e.clientY };
  });
  canvas.addEventListener('pointermove', function(e){
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    if (count() === 2 && pinchStart) {
      fov = Math.max(30, Math.min(95, pinchStart.fov * pinchStart.d / Math.max(1, spread())));
      camera.fov = fov; camera.updateProjectionMatrix();
      return;
    }
    if (!last || motion) { last = { x: e.clientX, y: e.clientY }; return; }
    // Degrees per pixel follow the zoom, so the photograph stays under the finger.
    var k = fov / window.innerHeight;
    az = wrap(az - (e.clientX - last.x) * k);
    el = clampEl(el + (e.clientY - last.y) * k);
    last = { x: e.clientX, y: e.clientY };
  });
  function lift(e){
    delete pointers[e.pointerId];
    if (count() < 2) pinchStart = null;
    var rest = Object.keys(pointers);
    last = rest.length === 1 ? pointers[rest[0]] : null;
  }
  canvas.addEventListener('pointerup', lift);
  canvas.addEventListener('pointercancel', lift);
  canvas.addEventListener('wheel', function(e){
    fov = Math.max(30, Math.min(95, fov + e.deltaY * 0.05));
    camera.fov = fov; camera.updateProjectionMatrix();
    e.preventDefault();
  }, { passive: false });

  // ---- Commands from the app ---------------------------------------------
  var active = null;
  window.saksi = {
    command: function(c){
      if (!c || typeof c !== 'object') return;
      if (c.type === 'look' && typeof c.az === 'number') {
        targetAz = wrap(c.az); targetEl = clampEl(typeof c.el === 'number' ? c.el : 0);
        if (tween == null && targetAz != null && !motion) { az = targetAz; el = targetEl; }
      } else if (c.type === 'motion') {
        motion = !!c.on;
        if (!motion) { targetAz = null; targetEl = null; }
      } else if (c.type === 'focus') {
        var hit = spots.filter(function(p){ return p.s.id === c.id; })[0];
        spots.forEach(function(p){ p.el.classList.toggle('active', p === hit); });
        active = hit || null;
        if (hit && !motion) tween = { fromAz: az, fromEl: el, dAz: delta(az, spotAz(hit.s)), dEl: spotEl(hit.s) - el, t0: performance.now() };
      } else if (c.type === 'labels' && c.titles) {
        spots.forEach(function(p){ if (c.titles[p.s.id]) p.label.textContent = c.titles[p.s.id]; });
      }
    }
  };
  window.addEventListener('message', function(e){
    try { window.saksi.command(typeof e.data === 'string' ? JSON.parse(e.data) : e.data); } catch (err) {}
  });

  // ---- Frame -------------------------------------------------------------
  var tmp = new THREE.Vector3(), lastPost = 0;
  function frame(now){
    requestAnimationFrame(frame);
    if (tween) {
      var t = Math.min(1, (now - tween.t0) / 900);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      az = wrap(tween.fromAz + tween.dAz * e); el = clampEl(tween.fromEl + tween.dEl * e);
      if (t >= 1) tween = null;
    } else if (motion && targetAz != null) {
      // Eased towards the sensor reading: sensors jitter, and a view that
      // shakes with them is hard to look at.
      az = wrap(az + delta(az, targetAz) * 0.25);
      el = el + (targetEl - el) * 0.25;
    }
    camera.lookAt(dir(az, el, 1));
    renderer.render(scene, camera);

    var w = window.innerWidth, h = window.innerHeight;
    for (var i = 0; i < spots.length; i++) {
      var p = spots[i];
      tmp.copy(p.world).project(camera);
      var visible = tmp.z < 1 && Math.abs(tmp.x) < 1.2 && Math.abs(tmp.y) < 1.2;
      p.el.style.display = visible ? 'flex' : 'none';
      if (visible) p.el.style.transform = 'translate(' + ((tmp.x + 1) / 2 * w - 13) + 'px,' + ((1 - tmp.y) / 2 * h - 13) + 'px)';
    }
    needle.style.transform = 'rotate(' + (-az) + 'deg)';
    if (now - lastPost > 300) { lastPost = now; post({ type: 'view', az: Math.round(az), el: Math.round(el) }); }
  }
  requestAnimationFrame(frame);
})();
</script>
</body></html>`;
}
