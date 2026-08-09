import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Text } from '@/components/ui';
import { demoSites } from '@/data';
import { colors, radii, spacing } from '@/theme';
import type { Coordinate } from '@/types';

import { buildMapHtml } from './mapHtml';
import { SitePlan } from './SitePlan';

export type MapWebViewProps = {
  height?: number;
  /** Fills its parent instead of sitting at a fixed height. */
  fill?: boolean;
  onSelectSite?: (siteId: string) => void;
  /** Live position, pushed into the running page. */
  coordinate?: Coordinate | null;
  /**
   * Draw the figure at all.
   *
   * A declared intent, not derived from whether a fix has arrived yet. Deriving
   * it meant the document was built without the figure, then rebuilt the moment
   * GPS returned — a full teardown and CDN reload a few seconds after opening,
   * repeating whenever the fix dropped. That is what "stuck" looked like.
   */
  showFigure?: boolean;
  /** Degrees from true north. Turns the figure to face the way you are going. */
  heading?: number | null;
  /** Keep the camera on the figure as it moves. */
  follow?: boolean;
  /** Safe area inset top (in pixels) for floating map control offset. */
  topInset?: number;
  /**
   * A planned way to draw under the trail, as [longitude, latitude] pairs.
   *
   * The demo walk uses it to show where the pilgrim is going before they get
   * there. Pass an empty array or omit it and no route is drawn.
   */
  route?: readonly (readonly [number, number])[];
  /**
   * Where the camera should be, and how close.
   *
   * A declared destination rather than an imperative handle: the screen says
   * "the camera belongs at this place, at reading distance" and a re-render
   * with the same value does nothing, so a story opening cannot re-fly the
   * camera on every frame. Bump `nonce` to repeat the same move deliberately.
   */
  camera?: { longitude: number; latitude: number; distance: 'world' | 'close'; nonce?: number } | null;
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
  showFigure = false,
  topInset = 0,
  route,
  camera,
}: MapWebViewProps) {
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const webRef = useRef<WebView>(null);

  /**
   * Give up waiting after this long and show the plan instead.
   *
   * The document is inline, so it always loads and `onError` never fires — a
   * MapLibre script that hangs on a slow connection leaves a blank container
   * with nothing to report it. Without this the screen simply never resolves.
   */
  useEffect(() => {
    if (ready || failed) return;
    const timer = setTimeout(() => setFailed(true), 15_000);
    return () => clearTimeout(timer);
  }, [ready, failed]);

  // Interactive only when it fills the screen. Inline, the map is a preview
  // that opens the full-screen one — see MapHtmlOptions.interactive.
  //
  // Depends only on props that do not change while the screen is open, so the
  // document is built once and never rebuilt underneath a running map.
  const html = useMemo(
    () => buildMapHtml({ avatar: showFigure, fullscreen: fill, interactive: fill, topInset }),
    [showFigure, fill, topInset],
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

  /**
   * The planned route, pushed in the same way and for the same reason.
   *
   * Serialised from the prop rather than from its identity: a caller building
   * the array inline would otherwise re-inject on every render, and clearing
   * the trail with it would erase the walk each time.
   */
  const routeJson = useMemo(() => JSON.stringify(route ?? []), [route]);
  useEffect(() => {
    if (!ready) return;
    webRef.current?.injectJavaScript(
      `window.sakshiSetRoute && window.sakshiSetRoute(${routeJson}); true;`,
    );
  }, [ready, routeJson]);

  /**
   * A commanded camera move.
   *
   * Serialised for the same reason the route is: an object built inline in the
   * parent changes identity every render, and a camera that re-flies on every
   * render is a camera nobody can pan away from.
   */
  const cameraJson = camera ? JSON.stringify(camera) : null;
  useEffect(() => {
    if (!ready || !cameraJson) return;
    const target = JSON.parse(cameraJson) as NonNullable<MapWebViewProps['camera']>;
    webRef.current?.injectJavaScript(
      `window.sakshiFlyTo && window.sakshiFlyTo(${target.longitude}, ${target.latitude}, ${JSON.stringify(target.distance)}); true;`,
    );
  }, [ready, cameraJson]);

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
      {!ready ? (
        <View style={[StyleSheet.absoluteFill, styles.loading]} pointerEvents="none">
          <ActivityIndicator color={colors.sandstoneDeep} />
          <Text variant="caption" tone="muted">
            Drawing the ground
          </Text>
        </View>
      ) : null}

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
  fillWrap: { flex: 1, overflow: 'hidden', backgroundColor: colors.surfaceSecondary, zIndex: 1 },
  fill: { flex: 1 },
  web: { flex: 1, backgroundColor: colors.mapBase },
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.mapBase,
    zIndex: 1,
  },
});
