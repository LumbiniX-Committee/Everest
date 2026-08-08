import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MapWebView } from '@/components/map';
import { Text } from '@/components/ui';
import { useCurrentPosition, useHeading, useSiteArrival } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

/**
 * The map, full screen, with you standing on it.
 *
 * Deliberately not a `Screen`: that component supplies the page gutter and the
 * pale ground, and both would frame a map that is meant to be the whole
 * surface. The controls float over it against the safe area instead.
 *
 * Rendered through the WebView path unconditionally rather than preferring the
 * native module — the figure is a three.js custom layer, and MapLibre Native
 * has no 3D model support, so the native map cannot draw it at any quality.
 */
export function LiveMapScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coordinate } = useCurrentPosition({ watch: true });
  const heading = useHeading();
  const [follow, setFollow] = useState(true);

  // notify:false — Tīrtha's card already announces, and two banners for one
  // arrival is the app talking over itself.
  const { atSiteId, nearest: near } = useSiteArrival(coordinate, { notify: false });

  return (
    <View style={styles.root}>
      <MapWebView
        fill
        showFigure
        coordinate={coordinate}
        heading={typeof heading === 'number' ? heading : null}
        follow={follow}
        onSelectSite={(id) => router.push(`/(main)/tirtha/site/${id}`)}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => router.back()}
          style={styles.pill}
        >
          <Text variant="body">‹ Back</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={follow ? 'Stop following your position' : 'Follow your position'}
          accessibilityState={{ selected: follow }}
          onPress={() => setFollow((f) => !f)}
          style={[styles.pill, follow && styles.pillActive]}
        >
          <Text variant="body" tone={follow ? 'sandstone' : 'secondary'}>
            {follow ? 'Following' : 'Follow'}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.readout, { paddingBottom: insets.bottom + spacing.base }]}>
        {coordinate ? (
          near ? (
            <Text variant="body" center>
              {near.site.name}
              <Text variant="body" tone={atSiteId ? 'sandstone' : 'muted'}>
                {'  ·  '}
                {atSiteId ? 'you are here' : `${Math.round(near.distanceM)} m`}
              </Text>
            </Text>
          ) : (
            <Text variant="body" tone="secondary" center>
              Position acquired.
            </Text>
          )
        ) : (
          // Named rather than a spinner: a GPS fix under open sky can take
          // thirty seconds, and saying so is the difference between waiting
          // and assuming it is broken.
          <Text variant="body" tone="muted" center>
            Acquiring position…
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  pill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { borderColor: colors.sandstone, backgroundColor: colors.surfaceSecondary },
  readout: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
