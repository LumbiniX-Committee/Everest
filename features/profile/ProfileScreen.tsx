import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Button, Icon, Screen, Text, type IconName } from '@/components/ui';
import { SettingsChoice, SettingsRow, SettingsSection } from '@/features/settings/components';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePlan, usePreferences } from '@/store';
import { colors, radii, spacing, text } from '@/theme';
import { INTERFACE_LANGUAGE_OPTIONS, VISITOR_TYPE_OPTIONS } from '@/types';

import { ProfileAvatar, useProfileLine } from './ProfileSummary';
import { DISPLAY_NAME_MAX, useProfile } from './useProfile';

/**
 * The visitor's profile: a name of their choosing, who the app is set up for,
 * and the counts from their record, with the way into the record and the plan.
 *
 * There is no account behind this. The name is kept on this phone only, and
 * the screen says so beside the field, because the app's promise is that it
 * never collects a name, email or phone number.
 */
export function ProfileScreen() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { preferences, update } = usePreferences();
  const { gatingOn, isPro } = usePlan();
  const { displayName, setDisplayName, stats } = useProfile();
  const line = useProfileLine();
  // Null until the person types: the field then shows the stored name, which
  // arrives after the first render.
  const [edited, setEdited] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const draft = edited ?? displayName;
  const editing = edited != null;

  const save = () => {
    void setDisplayName(draft).then(() => {
      setEdited(null);
      setSaved(true);
    });
  };

  const planLabel = !gatingOn ? 'Early release' : isPro ? 'Pro' : 'Free';

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Settings" title="Profile" subtitle="No account needed. Everything here stays on this phone." />

      <View style={styles.identity}>
        <ProfileAvatar name={draft || displayName} size={72} />
        <View style={styles.flex}>
          <Text variant="title" translate={false} numberOfLines={2}>
            {displayName || ui('Add your name')}
          </Text>
          <Text variant="caption" tone="secondary" translate={false}>
            {line}
          </Text>
        </View>
      </View>

      <SettingsSection title="Your name" footnote="Kept on this phone only. It is never sent, synced or shared, and Sākṣī does not ask for an email or phone number.">
        <View style={styles.nameRow}>
          <TextInput
            value={draft}
            onChangeText={(value) => {
              setEdited(value);
              setSaved(false);
            }}
            onSubmitEditing={save}
            placeholder={ui('What should we call you?')}
            placeholderTextColor={colors.textMuted}
            accessibilityLabel={ui('Your name')}
            maxLength={DISPLAY_NAME_MAX}
            autoCorrect={false}
            autoComplete="off"
            textContentType="none"
            importantForAutofill="no"
            returnKeyType="done"
            style={[text('body'), styles.input]}
          />
          <Button label={saved && !editing ? 'Saved' : 'Save'} size="sm" disabled={!editing} onPress={save} />
        </View>
      </SettingsSection>

      <Text variant="label" tone="muted" uppercase style={styles.sectionLabel}>
        Your record
      </Text>
      <View style={styles.stats}>
        <Stat icon="map-marker-check-outline" value={stats?.places} label="Places visited" />
        <Stat icon="camera-outline" value={stats?.photos} label="Photos taken" />
        <Stat icon="flag-outline" value={stats?.reports} label="Reports filed" />
        <Stat icon="flag-checkered" value={stats?.quests} label="Quests done" />
      </View>

      <SettingsSection divided>
        <SettingsRow
          icon="book-open-variant"
          label="Your record"
          hint="Places visited, photos and your reports"
          onPress={() => router.push('/(main)/tirtha/me')}
        />
        <SettingsRow
          icon="star-outline"
          label="Your plan"
          value={planLabel}
          hint="What is free, and what Pro adds"
          onPress={() => router.push('/(main)/settings/plans')}
        />
        <SettingsRow
          icon="shield-lock-outline"
          label="Privacy"
          hint="Export or delete your data"
          onPress={() => router.push('/(main)/settings/privacy')}
        />
      </SettingsSection>

      <SettingsSection title="Who is visiting?" footnote="Sets the prices and entry fees you are shown. It is never checked against a document.">
        <SettingsChoice
          legend="Who is visiting?"
          options={VISITOR_TYPE_OPTIONS}
          selected={preferences.visitorType}
          onSelect={(value) => void update('visitorType', value)}
        />
      </SettingsSection>

      <SettingsSection title="Language">
        <SettingsChoice
          legend="Language"
          options={INTERFACE_LANGUAGE_OPTIONS}
          selected={preferences.interfaceLanguage}
          onSelect={(value) => void update('interfaceLanguage', value)}
        />
      </SettingsSection>
    </Screen>
  );
}

/** A count from the record. Shows a dash until it is read, never a made-up zero. */
function Stat({ icon, value, label }: { icon: IconName; value: number | undefined; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text variant="heading" translate={false}>
        {value == null ? '–' : String(value)}
      </Text>
      <Text variant="caption" tone="secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.base, marginBottom: spacing.content },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
  sectionLabel: { paddingHorizontal: spacing.base, marginBottom: spacing.xs + 2 },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
