import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Screen title block. The eyebrow carries the surface name so a screen deep in
 * a stack still says which of the three you are inside.
 *
 * Every stacked screen gets a back control from here rather than adding one
 * per screen. The stacks run with `headerShown: false`, so before this there
 * was no way back on iOS but the edge-swipe gesture — undiscoverable, and
 * absent entirely for anyone using the app one-handed from the far edge.
 */
export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  rightAction,
  canGoBack = true,
  onBack,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  /**
   * Sits beside the title, top-aligned. The three surfaces put their Settings
   * entry here; it is not a general action bar, and a second control belongs on
   * the screen body rather than crowded in next to the first.
   */
  rightAction?: ReactNode;
  /**
   * Offer a back control when there is somewhere to go back to.
   *
   * Defaults to true and is then checked against the navigator, so a surface
   * root — Tīrtha, Sākṣī, Dhamma — shows nothing while a pushed screen does.
   * Passing false suppresses it outright, for a screen that must not be left
   * by going backwards.
   */
  canGoBack?: boolean;
  /** Overrides the default pop, for a screen that must leave somewhere else. */
  onBack?: () => void;
}) {
  const router = useRouter();
  const { pulse } = useHaptics();
  const showBack = canGoBack && (onBack != null || router.canGoBack());

  const backOffset = useSharedValue(0);
  const backScale = useSharedValue(1);

  const backAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: backOffset.value }, { scale: backScale.value }],
  }));

  const handleBackIn = useCallback(() => {
    backOffset.value = withSpring(-4, { damping: 14, stiffness: 350, mass: 0.6 });
    backScale.value = withSpring(0.95, { damping: 14, stiffness: 350, mass: 0.6 });
  }, [backOffset, backScale]);

  const handleBackOut = useCallback(() => {
    backOffset.value = withSpring(0, { damping: 12, stiffness: 280, mass: 0.6 });
    backScale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.6 });
  }, [backOffset, backScale]);

  const handleBackPress = useCallback(() => {
    pulse(Haptics.ImpactFeedbackStyle.Light);
    if (onBack) onBack();
    else router.back();
  }, [onBack, pulse, router]);

  return (
    <View style={styles.wrap}>
      {showBack ? (
        <AnimatedPressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={handleBackPress}
          onPressIn={handleBackIn}
          onPressOut={handleBackOut}
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          style={[styles.back, backAnimStyle]}
        >
          <Text variant="body" tone="secondary">
            ‹ Back
          </Text>
        </AnimatedPressable>
      ) : null}

      <View style={styles.titleRow}>
        <View style={styles.titleColumn}>
          {eyebrow ? (
            <Text variant="label" tone="sandstone" uppercase>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="title">{title}</Text>
        </View>
        {rightAction ? <View style={styles.action}>{rightAction}</View> : null}
      </View>
      {subtitle ? (
        <Text variant="body" tone="secondary">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.lg },
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: radii.md,
  },
  backPressed: { opacity: 0.6 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  titleColumn: { flex: 1, gap: spacing.xs },
  action: { paddingTop: spacing.xs },
});
