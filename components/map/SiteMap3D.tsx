import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { MAP_HOME, demoSites, monumentGeoJSON, precinctGeoJSON, siteGeoJSON, waterGeoJSON } from '@/data';
import { colors, radii, sakshiMapStyleJSON } from '@/theme';

import { MapWebView } from './MapWebView';
import { SitePlan } from './SitePlan';

export type SiteMap3DProps = {
  /** Height of the map block. The map is a panel on a scrolling page. */
  height?: number;
  /** Tapping a monument. */
  onSelectSite?: (siteId: string) => void;
};

/**
 * MapLibre wraps a native view that Expo Go does not contain.
 *
 * Loaded lazily for the same reason expo-notifications is: a static import
 * evaluates before any guard can run, and this component sits behind the
 * components barrel that most screens import. One unavailable native module
 * would otherwise take down screens that have nothing to do with the map.
 */
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

type MapLibreModule = typeof import('@maplibre/maplibre-react-native');

let cached: MapLibreModule | null | undefined;

function loadMapLibre(): MapLibreModule | null {
  if (cached !== undefined) return cached;
  if (inExpoGo) {
    cached = null;
    return null;
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cached = require('@maplibre/maplibre-react-native') as MapLibreModule;
  } catch {
    cached = null;
  }
  return cached;
}

/**
 * Lumbini, tilted.
 *
 * The precinct rings are drawn as extruded volumes rather than flat circles. At
 * a 55° pitch a flat ring reads as an ellipse painted on the ground and vanishes
 * behind anything in front of it; a low wall of light stone reads as an
 * enclosure, which is what a precinct is.
 *
 * MapLibre Native has no 3D model support, and `fill-extrusion` only extrudes
 * straight up — it cannot describe a slope. A stupa's dome therefore cannot be
 * drawn here at all, which is why monuments are marked rather than modelled.
 * The buildings themselves belong in the camera view as glTF, not on the map.
 */
export function SiteMap3D({ height = 320, onSelectSite }: SiteMap3DProps) {
  const [failed, setFailed] = useState(false);
  const MapLibre = loadMapLibre();

  // No native module — Expo Go, or a host without it. Draw the same style and
  // the same GeoJSON through MapLibre GL JS in a WebView rather than showing an
  // apology. The native path is preferred where it exists; this is not.
  if (!MapLibre) {
    return <MapWebView height={height} onSelectSite={onSelectSite} />;
  }

  // Same as the WebView path: the schematic plan is what a failed basemap
  // falls back to, not a second map kept permanently on the page.
  if (failed) {
    return (
      <View style={[styles.wrap, { height }]}>
        <SitePlan sites={demoSites} onSelectSite={onSelectSite} height={height} />
      </View>
    );
  }

  const { Camera, GeoJSONSource, Layer, Map, UserLocation } = MapLibre;

  return (
    <View style={[styles.wrap, { height }]}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={sakshiMapStyleJSON}
        // Attribution is required by OpenStreetMap's licence. Not ours to hide.
        attribution
        logo={false}
        compass
        // Inert, for the same reason the WebView preview is: this panel lives
        // inside a scrolling page, and a map that consumes drags competes with
        // the page for them. Panning and zooming belong to the full-screen map,
        // which this preview opens.
        dragPan={false}
        touchZoom={false}
        doubleTapZoom={false}
        touchRotate={false}
        onDidFailLoadingMap={() => setFailed(true)}
      >
        <Camera
          initialViewState={{
            center: MAP_HOME.centre,
            zoom: MAP_HOME.zoom,
            pitch: MAP_HOME.pitch,
            bearing: MAP_HOME.bearing,
          }}
        />

        <GeoJSONSource id="precincts" data={precinctGeoJSON}>
          <Layer
            id="precinct-walls"
            type="fill-extrusion"
            paint={{
              'fill-extrusion-color': colors.sandstone,
              // Low: an enclosure to read across, not a wall to hide behind.
              'fill-extrusion-height': 6,
              'fill-extrusion-base': 0,
              // 0.5, not 0.35: on the dark ground 0.35 measured 2.20:1 and the
              // enclosure read as a smudge rather than a wall.
              'fill-extrusion-opacity': 0.5,
            }}
          />
        </GeoJSONSource>

        <GeoJSONSource id="site-water" data={waterGeoJSON}>
          <Layer id="site-water-fill" type="fill" paint={{ 'fill-color': colors.mapWater }} />
        </GeoJSONSource>

        {/* The monuments carry their own massing: OSM knows the height of one
            building in Lumbini, so its data alone extrudes to identical slabs. */}
        <GeoJSONSource id="monuments" data={monumentGeoJSON}>
          <Layer
            id="monument-massing"
            type="fill-extrusion"
            paint={{
              'fill-extrusion-color': colors.mapBuildingRoof,
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.95,
              'fill-extrusion-vertical-gradient': true,
            }}
          />
        </GeoJSONSource>

        <GeoJSONSource
          id="sites"
          data={siteGeoJSON}
          onPress={(event) => {
            const id = event.nativeEvent.features?.[0]?.properties?.id;
            if (typeof id === 'string') onSelectSite?.(id);
          }}
        >
          <Layer
            id="site-dot"
            type="circle"
            paint={{
              'circle-radius': 6,
              'circle-color': colors.earth,
              'circle-stroke-width': 2,
              // The ring is the ground colour, so the dot is separated from
              // whatever terrain sits under it. On the light palette a sand
              // ring measured 2.19:1 against the brick dot and stopped
              // separating anything; white gives 5.79:1.
              'circle-stroke-color': colors.surface,
            }}
          />
          <Layer
            id="site-label"
            type="symbol"
            layout={{
              'text-field': ['get', 'name'],
              'text-font': ['Noto Sans Regular'],
              'text-size': 12,
              // Above the dot, so a label never sits on the thing it names.
              'text-offset': [0, -1.4],
              'text-anchor': 'bottom',
              // Lets labels collide out rather than pile up — the four Sacred
              // Garden monuments are 39 m apart and would otherwise overlap.
              'text-allow-overlap': false,
            }}
            paint={{
              'text-color': colors.textPrimary,
              'text-halo-color': colors.background,
              'text-halo-width': 1.6,
            }}
          />
        </GeoJSONSource>

        <UserLocation />
      </Map>
    </View>
  );
}


const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
});
