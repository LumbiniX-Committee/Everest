import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { Text } from '@/components/ui';
import { scanEmbedUrl } from '@/data';
import { colors, radii, spacing } from '@/theme';

/**
 * A real 3D scan, in Sketchfab's own player. Only ever mounted when the
 * visitor has asked for it, because it loads from Sketchfab: a large download
 * that needs a connection. The player carries the creator's credit and its own
 * VR button.
 */
export function ScanPlayer({ id, height = 420 }: { id: string; height?: number }) {
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  if (failed) {
    return (
      <View style={[styles.frame, styles.center, { height }]}>
        <Text variant="body" tone="secondary" center>
          The scan could not load. It needs a connection: try again when you have signal.
        </Text>
      </View>
    );
  }
  return (
    <View style={[styles.frame, { height }]}>
      {!ready ? (
        <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
          <ActivityIndicator color={colors.onScrim} />
        </View>
      ) : null}
      <WebView
        source={{ uri: scanEmbedUrl(id) }}
        style={styles.web}
        javaScriptEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        setSupportMultipleWindows={false}
        onLoadEnd={() => setReady(true)}
        onError={() => setFailed(true)}
        onHttpError={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { overflow: 'hidden', borderRadius: radii.lg, backgroundColor: colors.backgroundDeep },
  web: { flex: 1, backgroundColor: 'transparent' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
});
