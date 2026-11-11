import { Pressable, StyleSheet, View } from 'react-native';

import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Read by screen readers as the group's name. */
  accessibilityLabel: string;
};

/**
 * One choice from a few, shown all at once.
 *
 * Used for depth (Glance · Story · Scholar): one control that swaps the content
 * in place, rather than "more" buttons nested inside each other, which lose
 * people after two levels. Each segment is a full 48dp target and selection is
 * carried by fill and weight, not colour alone, so it reads in sunlight.
 */
export function SegmentedControl<T extends string>({ options, value, onChange, accessibilityLabel }: SegmentedControlProps<T>) {
  const { selection } = useHaptics();
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={styles.track}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              selection();
              onChange(option.value);
            }}
            style={({ pressed }) => [styles.segment, selected && styles.selected, pressed && !selected && styles.pressed]}
          >
            <Text variant={selected ? 'bodyStrong' : 'body'} tone={selected ? 'primary' : 'secondary'} center numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    padding: spacing.xxs,
    gap: spacing.xxs,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
  segment: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
  },
  selected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
});
