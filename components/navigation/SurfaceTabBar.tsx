import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Text } from '@/components/ui';
import { OfflineBanner } from '@/components/common';
import { useSync } from '@/hooks';
import { colors, spacing } from '@/theme';
import { SURFACES, SURFACE_LABELS, type Surface } from '@/constants';

/**
 * The three-surface navigator.
 *
 * Not a generic tab bar: there are exactly three destinations and they are the
 * app's conceptual model, so they are named in Devanagari transliteration and
 * given equal weight. The active surface is marked with a sandstone rule above
 * the label — an index mark, not a filled pill or a coloured icon.
 *
 * There are no icons on purpose. Tīrtha, Sākṣī and Dhamma are not concepts a
 * pictogram would clarify, and a wrong icon would be worse than none.
 */
export function SurfaceTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { syncState, pendingCount, triggerSync } = useSync();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bannerContainer}>
        <OfflineBanner state={syncState} pending={pendingCount} onRetry={triggerSync} />
      </View>
      <View style={styles.bar}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];

        // SURFACES is the navigation model, so anything absent from it is not a
        // destination — Settings registers as a tab route only so its stack
        // resolves, and pushes over the surfaces rather than joining them.
        //
        // Filtering on the model rather than on `options.href === null`: that
        // option is plumbed by expo-router's Link-based Tabs but not by the
        // js-tabs navigator this app uses, so the check silently never matched
        // and Settings rendered as a fourth tab.
        //
        // Skipped inside the map rather than filtered before it, so `index`
        // still lines up with `state.index` for the focused check.
        if (!(SURFACES as readonly string[]).includes(route.name)) return null;

        const label = SURFACE_LABELS[route.name as Surface] ?? route.name;

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: 'tabLongPress', target: route.key });
        };

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.item}
          >
            <View style={[styles.indexMark, focused && styles.indexMarkActive]} />
            <Text variant="button" tone={focused ? 'primary' : 'muted'}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
  },
  bannerContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  indexMark: {
    height: 2,
    width: 28,
    backgroundColor: 'transparent',
  },
  indexMarkActive: { backgroundColor: colors.sandstone },
});
