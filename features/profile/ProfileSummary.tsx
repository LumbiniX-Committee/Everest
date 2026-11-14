import { Pressable, StyleSheet, View } from 'react-native';

import { Icon, Text } from '@/components/ui';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { INTERFACE_LANGUAGE_OPTIONS, VISITOR_TYPE_OPTIONS } from '@/types';

import { initialsOf, type ProfileStats } from './useProfile';

/** A round monogram, or a neutral figure when no name is set. Never a photo: none is ever asked for. */
export function ProfileAvatar({ name, size = 48 }: { name: string; size?: number }) {
  const initials = initialsOf(name);
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {initials ? (
        <Text variant={size >= 64 ? 'title' : 'heading'} tone="inverse" translate={false}>
          {initials}
        </Text>
      ) : (
        <Icon name="account-outline" size={size * 0.55} color={colors.onPrimary} />
      )}
    </View>
  );
}

/** "Visiting from abroad · English": who the app is set up for, in one line. */
export function useProfileLine(): string {
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const visitor = VISITOR_TYPE_OPTIONS.find((option) => option.value === preferences.visitorType)?.label;
  const language = INTERFACE_LANGUAGE_OPTIONS.find((option) => option.value === preferences.interfaceLanguage)?.label;
  return [visitor ? ui(visitor) : ui('Visitor type not set'), language].filter(Boolean).join(' · ');
}

/**
 * The profile entry at the top of Settings: who this is, and what their
 * record holds, one tap from the full Profile screen.
 */
export function ProfileSummary({ displayName, stats, onPress }: { displayName: string; stats: ProfileStats | null; onPress: () => void }) {
  const ui = useVisitorLiteralCopy();
  const line = useProfileLine();
  const name = displayName || ui('Your profile');
  const counts = stats
    ? `${stats.places} ${ui('places')} · ${stats.photos} ${ui('photos')} · ${stats.reports} ${ui('reports')}`
    : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[name, line, counts].filter(Boolean).join(', ')}
      accessibilityHint={ui('Opens your profile')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <ProfileAvatar name={displayName} size={52} />
      <View style={styles.text}>
        <Text variant="heading" translate={false} numberOfLines={1}>
          {name}
        </Text>
        <Text variant="caption" tone="secondary" translate={false} numberOfLines={1}>
          {line}
        </Text>
        {counts ? (
          <Text variant="caption" tone="muted" translate={false} numberOfLines={1}>
            {counts}
          </Text>
        ) : null}
      </View>
      <Icon name="chevron-right" size={20} color={colors.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.base,
    marginBottom: spacing.content,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
  text: { flex: 1, gap: spacing.xxs },
});
