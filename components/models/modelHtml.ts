import { colors } from '@/theme';

import { MODEL_VIEWER_JS } from './vendor.generated';

/**
 * The document the 3D viewer runs in. The model arrives as glTF text and is
 * handed to the viewer as an in-memory file, so a model saved on the phone opens
 * with no network.
 */
export function buildModelHtml(gltf: string, hotspots: { label: string; position: number[] }[]): string {
  const safeGltf = JSON.stringify(gltf).replace(/<\/script/gi, '<\\/script');
  const spots = hotspots
    .map(
      (h, i) =>
        `<button class="hotspot" slot="hotspot-${i}" data-position="${h.position.join(' ')}" data-normal="0 0 1" onclick="post({type:'hotspot',index:${i}})"><span>${i + 1}</span></button>`,
    )
    .join('');

  return `<!doctype html>
<html><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<style>
  html,body{margin:0;height:100%;background:${colors.surfaceSecondary}}
  model-viewer{width:100%;height:100%;--poster-color:transparent}
  .hotspot{width:30px;height:30px;border-radius:15px;border:2px solid ${colors.surface};background:${colors.accent};color:${colors.onAccent};font:600 14px sans-serif;padding:0;box-shadow:0 2px 6px rgba(0,0,0,.3)}
</style>
<script>${MODEL_VIEWER_JS}</script>
</head><body>
<model-viewer id="mv" camera-controls touch-action="pan-y" auto-rotate auto-rotate-delay="2500" rotation-per-second="12deg"
  shadow-intensity="0.8" exposure="1.05" environment-image="neutral" interaction-prompt="none">${spots}</model-viewer>
<script>
  function post(m){ window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  try {
    var url = URL.createObjectURL(new Blob([${safeGltf}], { type: 'model/gltf+json' }));
    var mv = document.getElementById('mv');
    mv.addEventListener('load', function(){ post({ type: 'ready' }); });
    mv.addEventListener('error', function(e){ post({ type: 'error', message: String(e && e.detail && e.detail.type) }); });
    mv.src = url;
    /** Turns the camera to look at a feature, from the app's list. */
    window.saksiFocus = function (x, y, z) {
      mv.autoRotate = false;
      mv.cameraTarget = x + 'm ' + y + 'm ' + z + 'm';
    };
  } catch (err) { post({ type: 'error', message: String(err) }); }
</script>
</body></html>`;
}
