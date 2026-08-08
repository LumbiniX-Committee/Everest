import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

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
}: ButtonProps) {
  const inert = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inert, busy: loading }}
      accessibilityHint={accessibilityHint}
      disabled={inert}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        block && styles.block,
        pressed && !inert && pressedStyles[variant],
        inert && styles.inert,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.surface : colors.sandstoneDeep}
          size="small"
        />
      ) : (
        <View style={styles.labelRow}>
          <Text variant="button" tone={variant === 'primary' ? 'inverse' : 'sandstone'}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
  labelRow: { flexDirection: 'row', alignItems: 'center' },
  inert: { opacity: 0.45 },
});

const variantStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.sandstone },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
  },
  quiet: { backgroundColor: 'transparent', paddingHorizontal: spacing.sm },
};

const pressedStyles: Record<ButtonVariant, ViewStyle> = {
  primary: { backgroundColor: colors.sandstoneDeep },
  secondary: { backgroundColor: colors.surfaceSecondary },
  quiet: { opacity: 0.6 },
};
