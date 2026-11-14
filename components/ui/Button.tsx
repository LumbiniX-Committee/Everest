import { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useHaptics } from '@/hooks';
import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';
import { Icon, type IconName } from './Icon';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
/** `sm` is for actions on a card or in a list row; its target is lifted to 44 by `hitSlop`. */
export type ButtonSize = 'md' | 'sm';
const SMALL_SLOP = { top: 4, bottom: 4, left: 4, right: 4 };

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
  size?: ButtonSize;
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
  size = 'md',
}: ButtonProps) {
  const small = size === 'sm';
  const inert = disabled || loading;
  const language = useInterfaceLanguage();
  const displayLabel = visitorLiteralCopy(language, label);
  const displayHint = accessibilityHint
    ? visitorLiteralCopy(language, accessibilityHint)
    : undefined;
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (inert) return;
    scale.set(withSpring(variant === 'quiet' ? 0.94 : 0.96, {
      damping: 14,
      stiffness: 350,
      mass: 0.8,
    }));
  }, [inert, scale, variant]);

  const handlePressOut = useCallback(() => {
    if (inert) return;
    scale.set(withSpring(1, {
      damping: 12,
      stiffness: 280,
      mass: 0.8,
    }));
  }, [inert, scale]);

  const handlePress = useCallback(() => {
    if (inert || !onPress) return;
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [inert, onPress, pulse]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={displayLabel}
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityHint={displayHint}
      disabled={inert}
      hitSlop={small ? SMALL_SLOP : undefined}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.base,
        variantStyles[variant],
        small && styles.small,
        block && styles.block,
        inert && styles.inert,
        style,
        animatedStyle,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.onPrimary : colors.primary}
          size="small"
        />
      ) : (
        <View style={styles.labelRow}>
          {icon ? (
            <Icon
              name={icon}
              size={small ? 16 : 20}
              color={variant === 'primary' ? colors.onPrimary : colors.primary}
            />
          ) : null}
          <Text variant={small ? 'control' : 'button'} tone={variant === 'primary' ? 'inverse' : 'sandstone'}>
            {displayLabel}
          </Text>
        </View>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.content,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  small: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.sm,
  },
  block: { alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  inert: { opacity: 0.45 },
});

/**
 * Primary is a solid fill; secondary a soft tint of the same hue with no
 * outline; quiet is text only. Three clearly different weights, so a screen's
 * main action never competes with the ones beside it.
 */
const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primarySoft },
  quiet: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
};
