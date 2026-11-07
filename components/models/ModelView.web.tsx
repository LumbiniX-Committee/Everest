import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { MonumentModel } from '@/types';

/** The viewer runs in a phone WebView. The web build shows where it would be. */
export function ModelView({ height = 380 }: { model: MonumentModel; gltf: string; height?: number; onHotspot?: (i: number) => void; focusIndex?: number | null }) {
  return (
    <View style={[styles.frame, { height }]}>
      <Text variant="body" tone="secondary" center>
        The 3D view opens in the Android and iOS app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: radii.lg, backgroundColor: colors.surfaceSecondary },
});
