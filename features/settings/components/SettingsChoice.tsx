import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type SettingsChoiceProps<T extends string> = {
  legend: string;
  options: ChoiceOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/**
 * A single-choice group, laid out as rows rather than a picker.
 *
 * Every option shows its consequence in a line of text underneath. A dropdown
 * would hide those, and these are choices where the label alone ("Strict",
 * "Forgiving") does not tell a first-time user what they are agreeing to.
 */
export function SettingsChoice<T extends string>({
  legend,
  options,
  selected,
  onSelect,
}: SettingsChoiceProps<T>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={legend} style={styles.group}>
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: isSelected, checked: isSelected }}
            accessibilityLabel={option.label}
            accessibilityHint={option.hint}
            onPress={() => onSelect(option.value)}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.textColumn}>
              <Text variant="body" tone={isSelected ? 'sandstone' : 'primary'}>
                {option.label}
              </Text>
              <Text variant="caption" tone="muted">
                {option.hint}
              </Text>
            </View>
            {/* Not the only signal — the selected row also carries a border and
                a toned label, so the choice survives a colourblind reading. */}
            <Text
              variant="body"
              tone={isSelected ? 'sandstone' : 'muted'}
              accessibilityElementsHidden
              importantForAccessibility="no"
            >
              {isSelected ? '●' : '○'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.sandstone, backgroundColor: colors.surfaceSecondary },
  pressed: { opacity: 0.7 },
  textColumn: { flex: 1, gap: spacing.xxs },
});
