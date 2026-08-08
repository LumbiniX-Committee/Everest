import { MAP_HOME, precinctGeoJSON, siteGeoJSON } from '@/data';
import { colors, sakshiMapStyle } from '@/theme';

/**
 * The MapLibre GL JS document rendered inside the WebView.
 *
 * A pure function rather than a template inlined in the component, so the exact
 * document that ships can be written to a file and opened in a browser. A map
 * that only exists inside a WebView on a phone is a map nobody can check.
 *
 * Everything it draws — the style, the precinct rings, the monument points — is
 * the same object the native path passes to MapLibre Native. GL JS and MapLibre
 * Native read the same style specification, which is what makes one set of
 * definitions serve both.
 */
export function buildMapHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no" />
<link href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
<script src="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
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
      zoom: ${MAP_HOME.zoom},
      pitch: ${MAP_HOME.pitch},
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
          'fill-extrusion-opacity': 0.35
        }
      });
      map.addSource('sites', { type:'geojson', data: ${JSON.stringify(siteGeoJSON)} });
      map.addLayer({
        id:'site-dot', type:'circle', source:'sites',
        paint:{
          'circle-radius': 6,
          'circle-color': ${JSON.stringify(colors.earth)},
          'circle-stroke-width': 2,
          'circle-stroke-color': ${JSON.stringify(colors.background)}
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
      post({ type:'ready' });
    });
  } catch (err) {
    post({ type:'error', message: String(err) });
  }
</script>
</body>
</html>`;
}
