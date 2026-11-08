import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, radii, spacing } from '@/theme';

/**
 * The app in three verbs, on the first screen.
 *
 * Guide opens the map that knows where you are; Ask opens questions answered
 * from sources; Report opens the record, where a problem is flagged and then
 * followed. One bar divided by hairlines rather than three look-alike cards:
 * these are three doors, not three products.
 */
const VERBS = [
  { key: 'guide', label: 'Guide', hint: 'Where you are, explained', icon: 'compass-outline', href: '/(main)/tirtha/map' },
  { key: 'ask', label: 'Ask', hint: 'Answers with sources', icon: 'comment-question-outline', href: '/(main)/dhamma' },
  { key: 'report', label: 'Report', hint: 'Flag it, follow it', icon: 'flag-outline', href: '/(main)/sakshi' },
] as const;

export function VerbBar() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { selection } = useHaptics();
  return (
    <View style={styles.bar}>
      {VERBS.map((verb, index) => (
        <Pressable
          key={verb.key}
          accessibilityRole="button"
          accessibilityLabel={`${ui(verb.label)}: ${ui(verb.hint)}`}
          onPress={() => {
            selection();
            router.push(verb.href);
          }}
          style={({ pressed }) => [styles.door, index > 0 && styles.divided, pressed && styles.pressed]}
        >
          <Icon name={verb.icon} size={24} color={colors.primary} />
          <Text variant="bodyStrong">{ui(verb.label)}</Text>
          <Text variant="caption" tone="secondary" center numberOfLines={2}>
            {ui(verb.hint)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  door: { flex: 1, alignItems: 'center', gap: spacing.xxs, paddingVertical: spacing.base, paddingHorizontal: spacing.xs, minHeight: 96 },
  divided: { borderLeftWidth: 1, borderLeftColor: colors.border },
  pressed: { backgroundColor: colors.surfaceSelected },
});
