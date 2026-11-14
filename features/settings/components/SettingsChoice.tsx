import { Fragment } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Divider, Icon, Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, spacing } from '@/theme';

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
 * A single-choice group, laid out as plain radio rows inside the section's
 * surface rather than a picker or a stack of bordered cards.
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
  const { selection } = useHaptics();
  const language = useInterfaceLanguage();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={visitorLiteralCopy(language, legend)}>
      {options.map((option, index) => {
        const isSelected = option.value === selected;
        const label = visitorLiteralCopy(language, option.label);
        const hint = visitorLiteralCopy(language, option.hint);
        return (
          <Fragment key={option.value}>
            {index > 0 ? <Divider inset /> : null}
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected, checked: isSelected }}
              accessibilityLabel={label}
              accessibilityHint={hint}
              onPress={() => {
                if (isSelected) return;
                selection();
                onSelect(option.value);
              }}
              style={({ pressed }) => [styles.option, pressed && styles.pressed]}
            >
              <View style={styles.textColumn}>
                <Text variant={isSelected ? 'bodyStrong' : 'body'}>{label}</Text>
                <Text variant="caption" tone="muted">
                  {hint}
                </Text>
              </View>
              {/* Shape as well as colour: a filled ring against an empty one,
                  so the choice survives a colourblind or sunlit reading. */}
              <Icon
                name={isSelected ? 'radiobox-marked' : 'radiobox-blank'}
                size={22}
                color={isSelected ? colors.primary : colors.textMuted}
              />
            </Pressable>
          </Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.base,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
  textColumn: { flex: 1, gap: spacing.xxs },
});
