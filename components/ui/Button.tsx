import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';
import { Icon, type IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  /** Fill the available width. Onboarding uses this; inline actions do not. */
  block?: boolean;
  style?: ViewStyle;
  accessibilityHint?: string;
  /** Optional leading icon, drawn by the app's single icon surface. */
  icon?: IconName;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  block = false,
  style,
  accessibilityHint,
  icon,
}: ButtonProps) {
  const inert = disabled || loading;
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (inert) return;
    scale.value = withSpring(variant === 'quiet' ? 0.94 : 0.96, {
      damping: 14,
      stiffness: 350,
      mass: 0.8,
    });
  }, [inert, scale, variant]);

  const handlePressOut = useCallback(() => {
    if (inert) return;
    scale.value = withSpring(1, {
      damping: 12,
      stiffness: 280,
      mass: 0.8,
    });
  }, [inert, scale]);

  const handlePress = useCallback(() => {
    if (inert || !onPress) return;
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [inert, onPress, pulse]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={inert}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        variantStyles[variant],
        block && styles.block,
        inert && styles.inert,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.backgroundDeep : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.labelRow}>
          {icon ? (
            <Icon
              name={icon}
              size={22}
              color={variant === 'primary' ? colors.backgroundDeep : colors.primary}
            />
          ) : null}
          <Text variant="button" tone={variant === 'primary' ? 'inverse' : 'sandstone'}>
            {label}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inert: { opacity: 0.45 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  quiet: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
};

const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primaryPressed },
  secondary: { backgroundColor: colors.surfaceSecondary },
  quiet: { backgroundColor: colors.primarySoft },
};
