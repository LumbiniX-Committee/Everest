import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Text } from '@/components/ui';
import { OfflineBanner } from '@/components/common';
import { useSync } from '@/hooks';
import { colors, radii, spacing } from '@/theme';
import { SURFACES, SURFACE_LABELS, SURFACE_ICONS, type Surface } from '@/constants';

/**
 * Premium elevated surface navigator.
 *
 * Provides a floating glass/sandstone bottom tab bar with distinct icons:
 * 🧭 Tīrtha, 👁️ Sākṣī, 🪷 Dhamma, ✨ AI.
 * Active surface features a sandstone top line indicator, subtle warm pill highlight,
 * and highlighted typography.
 */
export function SurfaceTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { syncState, pendingCount, triggerSync } = useSync();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.xs) }]}>
      <View style={styles.bannerContainer}>
        <OfflineBanner state={syncState} pending={pendingCount} onRetry={triggerSync} />
      </View>

      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          if (!(SURFACES as readonly string[]).includes(route.name)) return null;

          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const surfaceKey = route.name as Surface;
          const label = SURFACE_LABELS[surfaceKey] ?? route.name;
          const icon = SURFACE_ICONS[surfaceKey] ?? '✨';

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
              style={({ pressed }) => [
                styles.item,
                focused && styles.itemActive,
                pressed && styles.itemPressed,
              ]}
            >
              <View style={[styles.indexMark, focused && styles.indexMarkActive]} />
              <View style={styles.iconContainer}>
                <Text style={[styles.icon, focused && styles.iconActive]}>
                  {icon}
                </Text>
              </View>
              <Text
                variant="label"
                style={[
                  styles.label,
                  focused ? styles.labelActive : styles.labelInactive,
                ]}
              >
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
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
  },
  bannerContainer: {
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: 'rgba(183, 155, 114, 0.25)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.lg,
    gap: 2,
  },
  itemActive: {
    backgroundColor: 'rgba(183, 155, 114, 0.12)',
  },
  itemPressed: {
    opacity: 0.75,
  },
  indexMark: {
    height: 3,
    width: 20,
    borderRadius: radii.full,
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  indexMarkActive: {
    backgroundColor: colors.sandstone,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    opacity: 0.65,
  },
  iconActive: {
    fontSize: 20,
    opacity: 1,
  },
  label: {
    fontSize: 11,
    lineHeight: 14,
  },
  labelActive: {
    color: colors.sandstoneDeep,
    fontWeight: '600',
  },
  labelInactive: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
