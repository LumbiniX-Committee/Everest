import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text, type IconName } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

/** One large tappable answer. A visitor reads the option, not a form control. */
export function ChoiceCard({
  label,
  hint,
  icon,
  selected,
  onPress,
}: {
  label: string;
  hint?: string;
  icon: IconName;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      <Icon name={icon} size={28} color={selected ? colors.primary : colors.textSecondary} />
      <View style={styles.copy}>
        <Text variant="bodyStrong">{label}</Text>
        {hint ? (
          <Text variant="caption" tone="secondary">
            {hint}
          </Text>
        ) : null}
      </View>
      {selected ? <Icon name="check-circle" size={24} color={colors.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 72,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSelected },
  pressed: { opacity: 0.75 },
  copy: { flex: 1, gap: spacing.xxs },
});
