import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import type { MapWebViewProps } from './MapWebView';

/**
 * Web stand-in for MapWebView.
 *
 * `react-native-webview` does not have complete native bindings on react-native-web;
 * providing a `.web.tsx` file allows Metro to resolve this clean web fallback when
 * building or viewing on web, while native Android/iOS use `MapWebView.tsx`.
 */
export function MapWebView({ height = 320, fill = false }: MapWebViewProps) {
  const frame = fill ? styles.fill : { height };

  return (
    <View style={[styles.wrap, frame]}>
      <Text variant="label" tone="muted" uppercase>
        Interactive Map
      </Text>
      <Text variant="body" tone="secondary" center>
        The interactive MapLibre map is rendered on native devices.
      </Text>
      <Text variant="caption" tone="muted" center>
        Use Android or iOS (Expo Go or Dev Build) to view full map visualization.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  fill: { flex: 1 },
});
