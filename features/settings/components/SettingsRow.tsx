import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type SettingsRowProps = {
  label: string;
  /** The current state, shown right-aligned. Omit for a plain navigation row. */
  value?: string;
  hint?: string;
  onPress: () => void;
  /** Reads as destructive and is announced as such. */
  danger?: boolean;
};

/**
 * A tappable settings row.
 *
 * The whole row is the target rather than the label alone — 44dp minimum,
 * because these are read one-handed while standing in a temple precinct.
 */
export function SettingsRow({ label, value, hint, onPress, danger = false }: SettingsRowProps) {
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);
  const chevronX = useSharedValue(0);

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const chevronAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: chevronX.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 15, stiffness: 350, mass: 0.7 });
    chevronX.value = withSpring(3, { damping: 15, stiffness: 350, mass: 0.7 });
  }, [chevronX, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.7 });
    chevronX.value = withSpring(0, { damping: 12, stiffness: 280, mass: 0.7 });
  }, [chevronX, scale]);

  const handlePress = useCallback(() => {
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress, pulse]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={hint}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.row, rowAnimStyle]}
    >
      <View style={styles.textColumn}>
        <Text variant="bodyStrong" tone={danger ? 'open' : 'primary'}>
          {label}
        </Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {hint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="body" tone="secondary">
          {value}
        </Text>
      ) : null}
      <Animated.View style={chevronAnimStyle}>
        <Text variant="body" tone="muted" accessibilityElementsHidden importantForAccessibility="no">
          ›
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
  },
  textColumn: { flex: 1, gap: spacing.xxs },
});

