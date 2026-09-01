import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

/**
 * A single-tap choice. The condition flow is built from these.
 *
 * Selection is carried by ground and border together, not by colour alone —
 * §33's smallest target devices are also the ones most often used outdoors in
 * bright sun, where a tint shift is the first thing to become invisible.
 */
export function Chip({ label, selected = false, onPress, disabled = false, style }: ChipProps) {
  const { selection } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (selected) {
      scale.value = withSequence(
        withTiming(0.95, { duration: 80 }),
        withSpring(1, { damping: 12, stiffness: 300, mass: 0.6 }),
      );
    }
  }, [selected, scale]);

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(0.93, {
      damping: 14,
      stiffness: 380,
      mass: 0.7,
    });
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 300,
      mass: 0.7,
    });
  }, [disabled, scale]);

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;
    selection();
    onPress();
  }, [disabled, onPress, selection]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        style,
        animatedStyle,
      ]}
    >
      <Text variant="button" tone={selected ? 'inverse' : 'sandstone'}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surfaceSelected,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primaryPressed },
  disabled: { opacity: 0.45 },
});
