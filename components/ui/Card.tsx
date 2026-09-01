import { useCallback, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
};

/**
 * A raised navy surface with one quiet blue-gray outline.
 */
export function Card({ children, onPress, style, accessibilityLabel }: CardProps) {
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, {
      damping: 15,
      stiffness: 350,
      mass: 0.8,
    });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 280,
      mass: 0.8,
    });
  }, [scale]);

  const handlePress = useCallback(() => {
    if (!onPress) return;
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress, pulse]);

  if (!onPress) {
    return <View style={[styles.card, style]}>{children}</View>;
  }

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.card, style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.base,
  },
});
