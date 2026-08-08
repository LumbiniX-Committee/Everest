import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={styles.textColumn}>
        <Text variant="body" tone={danger ? 'open' : 'primary'}>
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
      <Text variant="body" tone="muted" accessibilityElementsHidden importantForAccessibility="no">
        ›
      </Text>
    </Pressable>
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
  pressed: { backgroundColor: colors.surfaceSecondary },
  textColumn: { flex: 1, gap: spacing.xxs },
});
