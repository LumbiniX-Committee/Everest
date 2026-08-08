import { Camera, GeoJSONSource, Layer, Map, UserLocation } from '@maplibre/maplibre-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { MAP_HOME, precinctGeoJSON, siteGeoJSON } from '@/data';
import { colors, radii, sakshiMapStyleJSON, spacing } from '@/theme';

export type SiteMap3DProps = {
  /** Height of the map block. The map is a panel on a scrolling page. */
  height?: number;
  /** Tapping a monument. */
  onSelectSite?: (siteId: string) => void;
};

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

  if (failed) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text variant="body" tone="secondary" center>
          The map could not load.
        </Text>
        <Text variant="caption" tone="muted" center>
          Basemap tiles need a connection the first time. Everything else on this screen works
          offline.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={sakshiMapStyleJSON}
        // Attribution is required by OpenStreetMap's licence. Not ours to hide.
        attribution
        logo={false}
        compass
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
              'fill-extrusion-opacity': 0.35,
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
              'circle-stroke-color': colors.background,
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
  fallback: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
});
