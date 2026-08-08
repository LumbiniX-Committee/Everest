import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { demoPrecincts } from '@/data';
import { colors, radii, spacing } from '@/theme';

import type { SiteMap3DProps } from './SiteMap3D';

/**
 * The web stand-in for the vector map.
 *
 * MapLibre React Native wraps MapLibre Native, a platform UI component
 * registered through `codegenNativeComponent`. react-native-web has no such
 * function, so merely importing the native file crashes the web bundle before
 * anything renders — the whole app, not just this panel.
 *
 * Metro resolves `.web.tsx` ahead of `.tsx` when bundling for web, so this file
 * existing is what keeps the import out of that bundle. It is not a stub for
 * its own sake: `expo start --web` is the fastest way to walk a screen while
 * building it, and losing that for every screen because one panel is native-only
 * is a bad trade.
 *
 * The real map is Android and iOS only. Anything relying on it must degrade,
 * which is why Tīrtha keeps the flat SitePlan mounted underneath.
 */
export function SiteMap3D({ height = 320 }: SiteMap3DProps) {
  return (
    <View style={[styles.wrap, { height }]}>
      <Text variant="label" tone="muted" uppercase>
        Map
      </Text>
      <Text variant="body" tone="secondary" center>
        The tilted map runs on Android and iOS.
      </Text>
      <Text variant="caption" tone="muted" center>
        {demoPrecincts.length} precincts · {demoPrecincts.reduce((n, p) => n + p.siteIds.length, 0)}{' '}
        sites. The plan below shows the same ground and works everywhere.
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
