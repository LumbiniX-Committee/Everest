import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';

import { Icon, Text, type IconName } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, radii, spacing } from '@/theme';

export type SettingsRowProps = {
  label: string;
  /** The current state, shown right-aligned. Omit for a plain navigation row. */
  value?: string;
  hint?: string;
  onPress: () => void;
  /** Reads as destructive and is announced as such. */
  danger?: boolean;
  /** A leading glyph in a soft tile, as in a grouped system list. */
  icon?: IconName;
};

/**
 * A tappable settings row.
 *
 * The whole row is the target rather than the label alone — 48dp minimum,
 * because these are read one-handed while standing in a temple precinct.
 */
export function SettingsRow({ label, value, hint, onPress, danger = false, icon }: SettingsRowProps) {
  const { pulse } = useHaptics();
  const language = useInterfaceLanguage();
  const displayLabel = visitorLiteralCopy(language, label);
  const displayValue = value ? visitorLiteralCopy(language, value) : undefined;
  const displayHint = hint ? visitorLiteralCopy(language, hint) : undefined;

  const handlePress = useCallback(() => {
    pulse(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress, pulse]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={displayValue ? `${displayLabel}, ${displayValue}` : displayLabel}
      accessibilityHint={displayHint}
      onPress={handlePress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {icon ? (
        <View style={[styles.iconTile, danger && styles.iconTileDanger]}>
          <Icon name={icon} size={18} color={danger ? colors.openCondition : colors.primary} />
        </View>
      ) : null}
      <View style={styles.textColumn}>
        <Text variant="bodyStrong" tone={danger ? 'open' : 'primary'}>
          {displayLabel}
        </Text>
        {hint ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {displayHint}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="caption" tone="secondary" style={styles.value} numberOfLines={1}>
          {displayValue}
        </Text>
      ) : null}
      <Icon name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 48,
    paddingVertical: spacing.sm + 2,
    paddingLeft: spacing.base,
    paddingRight: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconTileDanger: { backgroundColor: colors.surfaceSecondary },
  textColumn: { flex: 1, gap: spacing.xxs },
  value: { maxWidth: '40%' },
});
