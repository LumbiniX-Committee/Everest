import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Screen } from '@/components/ui';
import { application } from '@/services';
import { usePermissions, usePreferences } from '@/store';
import { visitorCopy, type VisitorCopyKey } from '@/i18n/visitor';

import { SettingsRow, SettingsSection, SettingsToggle } from './components';

const TOLERANCE_LABEL_KEYS: Record<'strict' | 'standard' | 'forgiving', VisitorCopyKey> = {
  strict: 'settings.strict',
  standard: 'settings.standard',
  forgiving: 'settings.forgiving',
} as const;

/** The Settings index and the one app-wide visual switch. */
export function SettingsScreen() {
  const router = useRouter();
  const { preferences, update } = usePreferences();
  const { states } = usePermissions();
  const t = (key: VisitorCopyKey) => visitorCopy(preferences.interfaceLanguage, key);

  // Surfaced on the row itself rather than left behind a tap: a denied
  // permission is the most common reason the witness loop appears broken, and
  // someone hunting for that answer should see it without opening the screen.
  const denied = Object.values(states).filter(
    (state) => state.status === 'denied' || state.status === 'blocked',
  ).length;

  return (
    <Screen scroll>
      <ScreenHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
      />

      <SettingsSection
        title={t('settings.appearance')}
        footnote={t('settings.appearanceFootnote')}
      >
        <SettingsToggle
          label={t('settings.navyTheme')}
          hint={t('settings.navyThemeHint')}
          value={preferences.colorTheme === 'navy'}
          onValueChange={(enabled) => {
            const next = enabled ? 'navy' : 'white';
            if (next === preferences.colorTheme) return;
            void update('colorTheme', next).then(() =>
              application.reload(`Changed colour theme to ${next}`),
            );
          }}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.recording')} divided>
        <SettingsRow
          label={t('settings.preferences')}
          value={t(TOLERANCE_LABEL_KEYS[preferences.alignmentTolerance])}
          hint={t('settings.preferencesHint')}
          onPress={() => router.push('/(main)/settings/preferences')}
        />
        <SettingsRow
          label={t('settings.arrivals')}
          hint={t('settings.arrivalsHint')}
          onPress={() => router.push('/(main)/settings/arrivals')}
        />
        <SettingsRow
          label={t('settings.permissions')}
          value={denied > 0 ? `${denied} ${t('settings.needsAttention')}` : t('settings.allGranted')}
          hint={t('settings.permissionsHint')}
          onPress={() => router.push('/(main)/settings/permissions')}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.data')} divided>
        <SettingsRow
          label={t('settings.offlineAi')}
          hint={t('settings.offlineAiHint')}
          onPress={() => router.push('/(main)/settings/offline-ai')}
        />
        <SettingsRow
          label={t('settings.sync')}
          hint={t('settings.syncHint')}
          onPress={() => router.push('/(main)/settings/sync')}
        />
        <SettingsRow
          label={t('settings.storage')}
          hint={t('settings.storageHint')}
          onPress={() => router.push('/(main)/settings/storage')}
        />
        <SettingsRow
          label={t('settings.privacy')}
          hint={t('settings.privacyHint')}
          onPress={() => router.push('/(main)/settings/privacy')}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.institutional')}>
        <SettingsRow
          label={t('settings.custodian')}
          hint={t('settings.custodianHint')}
          onPress={() => router.push('/(main)/settings/custodian')}
        />
      </SettingsSection>

      <SettingsSection title={t('settings.about')}>
        <SettingsRow
          label={t('settings.aboutSakshi')}
          hint={t('settings.aboutHint')}
          onPress={() => router.push('/(main)/settings/about')}
        />
      </SettingsSection>
    </Screen>
  );
}
