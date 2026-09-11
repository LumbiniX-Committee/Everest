import { StyleSheet, Switch, View } from 'react-native';

import { Text } from '@/components/ui';
import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, spacing } from '@/theme';

export type SettingsToggleProps = {
  label: string;
  hint?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
};

export function SettingsToggle({
  label,
  hint,
  value,
  onValueChange,
  disabled = false,
}: SettingsToggleProps) {
  const language = useInterfaceLanguage();
  const displayLabel = visitorLiteralCopy(language, label);
  const displayHint = hint ? visitorLiteralCopy(language, hint) : undefined;
  return (
    <View style={styles.row}>
      <View style={styles.textColumn}>
        <Text variant="body" tone={disabled ? 'muted' : 'primary'}>
          {displayLabel}
        </Text>
        {hint ? (
          <Text variant="caption" tone="muted">
            {displayHint}
          </Text>
        ) : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        accessibilityLabel={displayLabel}
        accessibilityHint={displayHint}
        // alignmentLocked is reserved for the reticle (theme/colors.ts), so the
        // on state uses sandstone — the app's ordinary accent.
        trackColor={{ false: colors.surfaceSecondary, true: colors.sandstone }}
        thumbColor={colors.surface}
      />
    </View>
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
  },
  textColumn: { flex: 1, gap: spacing.xxs },
});
