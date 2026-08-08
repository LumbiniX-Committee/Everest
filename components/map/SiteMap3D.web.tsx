import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { demoPrecincts } from '@/data';
import { colors, radii, spacing } from '@/theme';

import type { SiteMap3DProps } from './SiteMap3D';

/**
 * The web stand-in for the map.
 *
 * MapLibre React Native wraps MapLibre Native, a platform UI component
 * registered through `codegenNativeComponent`; react-native-web has no such
 * function, so importing the native file crashes the entire web bundle before
 * anything renders. Metro resolves `.web.tsx` ahead of `.tsx`, and this file
 * existing is what keeps that import out of the web graph.
 *
 * It deliberately does *not* route to MapWebView, even though that would draw a
 * real map here. react-native-webview's web support is an iframe shim, and
 * pulling it into the web bundle risks the same class of break this file exists
 * to prevent. Web is a convenience for walking screens during development; the
 * map is not what anyone comes here to check, and a working bundle is worth
 * more than a map on a platform the app does not ship to.
 *
 * Expo Go is a different case and does get the real map — see SiteMap3D.tsx.
 */
export function SiteMap3D({ height = 320 }: SiteMap3DProps) {
  const siteCount = demoPrecincts.reduce((n, p) => n + p.siteIds.length, 0);

  return (
    <View style={[styles.wrap, { height }]}>
      <Text variant="label" tone="muted" uppercase>
        Map
      </Text>
      <Text variant="body" tone="secondary" center>
        The tilted map runs on Android and iOS.
      </Text>
      <Text variant="caption" tone="muted" center>
        {demoPrecincts.length} precincts · {siteCount} sites. The plan below shows the same ground
        and works everywhere.
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
});
