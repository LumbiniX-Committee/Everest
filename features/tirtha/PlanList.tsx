import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, spacing } from '@/theme';

const ROWS = [
  { key: 'treks', title: 'Trekking routes', hint: 'Poon Hill, Langtang, Everest Base Camp: day by day, with altitude.', icon: 'image-filter-hdr', href: '/(main)/tirtha/treks' },
  { key: 'essentials', title: 'Essentials', hint: 'Stay, eat, health and money, with a number to call ahead.', icon: 'bed-outline', href: '/(main)/tirtha/essentials' },
] as const;

/** Trip planning as a quiet list: rows and hairlines, not more cards. */
export function PlanList() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted" uppercase>
        Plan your trip
      </Text>
      {ROWS.map((row) => (
        <Pressable
          key={row.key}
          accessibilityRole="button"
          accessibilityLabel={ui(row.title)}
          onPress={() => router.push(row.href)}
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        >
          <Icon name={row.icon} size={22} color={colors.primary} />
          <View style={styles.text}>
            <Text variant="bodyStrong">{ui(row.title)}</Text>
            <Text variant="caption" tone="secondary">
              {ui(row.hint)}
            </Text>
          </View>
          <Icon name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 64,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
  text: { flex: 1, gap: spacing.xxs },
});
