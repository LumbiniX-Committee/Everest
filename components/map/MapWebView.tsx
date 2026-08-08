import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { demoSites } from '@/data';
import { colors, radii } from '@/theme';
import type { Coordinate } from '@/types';

import { buildMapHtml } from './mapHtml';
import { SitePlan } from './SitePlan';

export type MapWebViewProps = {
  height?: number;
  /** Fills its parent instead of sitting at a fixed height. */
  fill?: boolean;
  onSelectSite?: (siteId: string) => void;
  /** Live position. Drives the figure; omit and no figure is drawn. */
  coordinate?: Coordinate | null;
  /** Degrees from true north. Turns the figure to face the way you are going. */
  heading?: number | null;
  /** Keep the camera on the figure as it moves. */
  follow?: boolean;
};

/**
 * The map, drawn by MapLibre GL JS inside a WebView.
 *
 * Used wherever the native module is absent — Expo Go, and any host without it
 * — and *always* where a figure is wanted, because MapLibre Native has no 3D
 * model support at all. That is a capability difference rather than a
 * preference: the character is only possible here.
 *
 * The trade is real elsewhere: a WebView costs a bridge hop per interaction and
 * cannot share the native location puck.
 */
export function MapWebView({
  height = 320,
  fill = false,
  onSelectSite,
  coordinate,
  heading,
  follow = true,
}: MapWebViewProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const webRef = useRef<WebView>(null);

  const wantsFigure = coordinate != null;
  // Interactive only when it fills the screen. Inline, the map is a preview
  // that opens the full-screen one — see MapHtmlOptions.interactive.
  const html = useMemo(
    () => buildMapHtml({ avatar: wantsFigure, fullscreen: fill, interactive: fill }),
    [wantsFigure, fill],
  );

  /**
   * Position is pushed in rather than re-rendering the document.
   *
   * Rebuilding the HTML on every fix would tear down and reload the map several
   * times a minute, which loses the tiles, the camera and any interaction in
   * progress. injectJavaScript reaches the running page instead.
   */
  useEffect(() => {
    if (!ready || !coordinate) return;
    const { latitude, longitude } = coordinate;
    webRef.current?.injectJavaScript(
      `window.sakshiSetPose && window.sakshiSetPose(${longitude}, ${latitude}, ${heading ?? 0}, ${follow}); true;`,
    );
  }, [ready, coordinate, heading, follow]);

  const frame = fill ? styles.fill : { height };

  // The schematic plan *is* the fallback, rather than a second map kept
  // permanently below this one. Two maps stacked read as a duplicate — the
  // plan earns its place only when the tiles cannot load, which is exactly the
  // case it was written for.
  if (failed) {
    return (
      <View style={[styles.wrap, frame]}>
        <SitePlan
          sites={demoSites}
          observer={coordinate}
          onSelectSite={onSelectSite}
          height={fill ? undefined : height}
        />
      </View>
    );
  }

  return (
    <View style={[fill ? styles.fillWrap : styles.wrap, frame]}>
      <WebView
        ref={webRef}
        style={styles.web}
        originWhitelist={['*']}
        source={{ html }}
        // Inline, the map is inert, so the page owns every gesture and scrolls
        // straight through it. Full screen, the map owns them instead.
        scrollEnabled={fill}
        nestedScrollEnabled={fill}
        // An inert preview must not intercept the tap that opens the full map.
        pointerEvents={fill ? 'auto' : 'none'}
        javaScriptEnabled
        domStorageEnabled
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
        onMessage={(event) => {
          try {
            const msg = JSON.parse(event.nativeEvent.data);
            if (msg.type === 'ready') setReady(true);
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
  fillWrap: { overflow: 'hidden', backgroundColor: colors.surfaceSecondary },
  fill: { flex: 1 },
  web: { flex: 1, backgroundColor: colors.background },
});
