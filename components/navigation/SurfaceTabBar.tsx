import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';

import { Icon, Text, type IconName } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { SURFACES, SURFACE_LABELS, SURFACE_ICONS, type Surface } from '@/constants';
import { useHaptics } from '@/hooks';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The bottom navigator: one floating navy instrument for the three surfaces.
 *
 * Compass for Tīrtha, eye for Sākṣī, lotus for Dhamma — drawn icons, so the
 * selected one can take the teal tint the label and the top mark share.
 * The active surface carries a teal rule above it, a quiet panel behind it,
 * and a heavier label. There is no fourth entry; see `constants/app.ts`.
 */
export function SurfaceTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { selection } = useHaptics();

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          if (!(SURFACES as readonly string[]).includes(route.name)) return null;

          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const surfaceKey = route.name as Surface;
          const label = SURFACE_LABELS[surfaceKey] ?? route.name;
          const icon = (SURFACE_ICONS[surfaceKey] ?? 'circle-outline') as IconName;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              selection();
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <SurfaceTabItem
              key={route.key}
              label={label}
              icon={icon}
              focused={focused}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              onPress={onPress}
              onLongPress={onLongPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function SurfaceTabItem({
  label,
  icon,
  focused,
  accessibilityLabel,
  onPress,
  onLongPress,
}: {
  label: string;
  icon: IconName;
  focused: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const scale = useSharedValue(1);
  const iconPop = useSharedValue(1);
  const markWidth = useSharedValue(focused ? 28 : 0);

  useEffect(() => {
    if (focused) {
      iconPop.value = withSequence(
        withTiming(1.18, { duration: 120 }),
        withSpring(1, { damping: 10, stiffness: 220, mass: 0.6 }),
      );
      markWidth.value = withSpring(28, { damping: 14, stiffness: 260 });
    } else {
      markWidth.value = withTiming(0, { duration: 160 });
    }
  }, [focused, iconPop, markWidth]);

  const itemAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const iconAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconPop.value }],
  }));

  const markAnimStyle = useAnimatedStyle(() => ({
    width: markWidth.value,
    opacity: withTiming(focused ? 1 : 0, { duration: 140 }),
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, {
      damping: 14,
      stiffness: 380,
      mass: 0.6,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 280,
      mass: 0.6,
    });
  }, [scale]);

  return (
    <AnimatedPressable
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      onLongPress={onLongPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.item,
        focused && styles.itemActive,
        itemAnimStyle,
      ]}
    >
      <View style={styles.markTrack}>
        <Animated.View style={[styles.indexMark, focused && styles.indexMarkActive, markAnimStyle]} />
      </View>
      <Animated.View style={[styles.iconContainer, iconAnimStyle]}>
        <Icon
          name={icon}
          size={focused ? 30 : 27}
          color={focused ? colors.primary : colors.textMuted}
        />
      </Animated.View>
      <Text
        variant="label"
        style={[
          styles.label,
          focused ? styles.labelActive : styles.labelInactive,
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: spacing.content,
    paddingTop: spacing.sm,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    minHeight: 82,
    backgroundColor: colors.backgroundDeep,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 70,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.xxs,
    borderRadius: radii.lg,
    gap: 2,
  },
  itemActive: {
    backgroundColor: colors.surfaceRaised,
  },
  markTrack: {
    height: 3,
    width: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  indexMark: {
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.backgroundDeep,
  },
  indexMarkActive: {
    backgroundColor: colors.primary,
  },
  iconContainer: {
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 14,
    lineHeight: 18,
  },
  labelActive: {
    color: colors.primary,
    fontWeight: '600',
  },
  labelInactive: {
    color: colors.textMuted,
    fontWeight: '500',
  },
});
