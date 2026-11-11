import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { MonumentModel } from '@/types';

import { buildModelHtml } from './modelHtml';

export type ModelViewHandle = { focus: (index: number) => void };

/** The 3D viewer, in a WebView, fed glTF text the app already holds. */
export function ModelView({
  model,
  gltf,
  height = 380,
  onHotspot,
  focusIndex,
}: {
  model: MonumentModel;
  gltf: string;
  height?: number;
  onHotspot?: (index: number) => void;
  /** Turn the camera to this feature. */
  focusIndex?: number | null;
}) {
  const ref = useRef<WebView>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const html = useMemo(() => buildModelHtml(gltf, model.hotspots), [gltf, model.hotspots]);

  // Turn the camera once per new choice, after render, not on every render.
  const target = focusIndex != null ? model.hotspots[focusIndex] : null;
  const targetKey = target ? target.position.join(',') : null;
  useEffect(() => {
    if (!ready || !targetKey) return;
    const [x, y, z] = targetKey.split(',');
    ref.current?.injectJavaScript(`window.saksiFocus && window.saksiFocus(${x}, ${y}, ${z}); true;`);
  }, [ready, targetKey]);

  if (failed) {
    return (
      <View style={[styles.frame, styles.center, { height }]}>
        <Text variant="body" tone="secondary" center>
          This 3D view could not open on this phone.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.frame, { height }]}>
      {!ready ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      <WebView
        ref={ref}
        source={{ html }}
        originWhitelist={['*']}
        javaScriptEnabled
        style={styles.web}
        onMessage={(event) => {
          try {
            const message = JSON.parse(event.nativeEvent.data);
            if (message.type === 'ready') setReady(true);
            if (message.type === 'error') setFailed(true);
            if (message.type === 'hotspot' && typeof message.index === 'number') onHotspot?.(message.index);
          } catch {
            // A malformed message from the page is not worth reacting to.
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.surfaceSecondary },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  web: { flex: 1, backgroundColor: colors.surfaceSecondary },
});
