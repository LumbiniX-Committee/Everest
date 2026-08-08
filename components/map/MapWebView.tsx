import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { buildMapHtml } from './mapHtml';

export type MapWebViewProps = {
  height: number;
  onSelectSite?: (siteId: string) => void;
};

/**
 * The same map, drawn by MapLibre GL JS inside a WebView.
 *
 * This exists because MapLibre's native module is not in Expo Go, and no amount
 * of guarding changes that — the fallback said "you need a development build",
 * which is true and useless to someone trying to see the map now. GL JS reads
 * the identical style spec and the identical GeoJSON, so `sakshiMapStyle`,
 * `precinctGeoJSON` and `siteGeoJSON` are passed through untouched. The
 * fill-extrusion, the 55° pitch and the palette are the same objects the native
 * path uses.
 *
 * The trade is real: a WebView costs a bridge hop per interaction and cannot
 * share the native location puck, so this is the fallback rather than the
 * default. Where the native module exists, it is used.
 *
 * maplibre-gl loads from a CDN. That is acceptable *here* specifically because
 * the basemap tiles already require a network — a WebView map with no
 * connection has nothing to draw either way. It does mean this path is not an
 * offline map, which is why Tīrtha keeps the flat SitePlan below.
 */
export function MapWebView({ height, onSelectSite }: MapWebViewProps) {
  const [failed, setFailed] = useState(false);

  const html = useMemo(() => buildMapHtml(), []);

  if (failed) {
    return (
      <View style={[styles.fallback, { height }]}>
        <Text variant="label" tone="muted" uppercase>
          Map
        </Text>
        <Text variant="body" tone="secondary" center>
          The map could not load. It needs a connection the first time.
        </Text>
        <Text variant="caption" tone="muted" center>
          The plan below shows the same ground and works offline.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <WebView
        style={styles.web}
        originWhitelist={['*']}
        source={{ html }}
        // The map is a panel inside a scrolling page; without this the WebView
        // swallows vertical drags and the page stops scrolling past it.
        nestedScrollEnabled
        javaScriptEnabled
        domStorageEnabled
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'site' && typeof msg.id === 'string') onSelectSite?.(msg.id);
            if (msg.type === 'error') setFailed(true);
          } catch {
            // A malformed message from the page is not worth reacting to.
          }
        }}
      />
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
  web: { flex: 1, backgroundColor: colors.background },
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
