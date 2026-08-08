import { Pressable, StyleSheet, type ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        pressed && !disabled && !selected && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text variant="button" tone={selected ? 'inverse' : 'primary'}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.sandstone, borderColor: colors.sandstoneDeep },
  pressed: { backgroundColor: colors.surfaceSecondary },
  disabled: { opacity: 0.45 },
});
