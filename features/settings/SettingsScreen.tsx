import { useState } from 'react';
import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Screen } from '@/components/ui';
import { application } from '@/services';
import { useAppState, usePermissions, usePlan, usePreferences } from '@/store';
import { VISITOR_TYPE_OPTIONS } from '@/types';
import { visitorCopy, type VisitorCopyKey } from '@/i18n/visitor';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';

import { SettingsChoice, SettingsRow, SettingsSection, SettingsToggle } from './components';

const TOLERANCE_LABEL_KEYS: Record<'strict' | 'standard' | 'forgiving', VisitorCopyKey> = {
  strict: 'settings.strict',
  standard: 'settings.standard',
  forgiving: 'settings.forgiving',
} as const;

/** The Settings index and the one app-wide visual switch. */
export function SettingsScreen() {
  const ui = useVisitorLiteralCopy();
  const { resetOnboarding } = useAppState();
  const { gatingOn, isPro } = usePlan();
  const planLabel = !gatingOn ? 'Early release' : isPro ? 'Pro' : 'Free';
  const router = useRouter();
  const { preferences, update } = usePreferences();
  const { states } = usePermissions();
  const t = (key: VisitorCopyKey) => visitorCopy(preferences.interfaceLanguage, key);

  // The switch below already saved the new theme the moment it is toggled —
  // `reload` only decides whether that becomes visible immediately or waits
  // for the person to reopen the app themselves. When it cannot reload
  // automatically, say so here rather than leaving the switch looking like it
  // did nothing.
  const [needsManualRestart, setNeedsManualRestart] = useState(false);

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

      <SettingsSection title="Your trip" divided>
        <SettingsRow
          label="Your record"
          hint="Places visited, photos and your reports"
          onPress={() => router.push('/(main)/tirtha/me')}
        />
        <SettingsRow
          label="Your plan"
          value={planLabel}
          hint="What is free, and what Pro adds"
          onPress={() => router.push('/(main)/settings/plans')}
        />
        <SettingsChoice
          legend="Who is visiting?"
          options={VISITOR_TYPE_OPTIONS}
          selected={preferences.visitorType}
          onSelect={(value) => void update('visitorType', value)}
        />
        <SettingsRow
          label="Replay introduction"
          hint="See the first-run guide again"
          onPress={() => {
            void resetOnboarding().then(() => router.replace('/onboarding'));
          }}
        />
      </SettingsSection>

      <SettingsSection
        title={t('settings.appearance')}
        footnote={
          needsManualRestart
            ? t('settings.appearanceRestartNeeded')
            : t('settings.appearanceFootnote')
        }
      >
        <SettingsToggle
          label={t('settings.navyTheme')}
          hint={t('settings.navyThemeHint')}
          value={preferences.colorTheme === 'navy'}
          onValueChange={(enabled) => {
            const next = enabled ? 'navy' : 'white';
            if (next === preferences.colorTheme) return;
            setNeedsManualRestart(false);
            void update('colorTheme', next).then(() =>
              application
                .reload(`Changed colour theme to ${next}`)
                .catch(() => setNeedsManualRestart(true)),
            );
          }}
        />
        <SettingsToggle
          label={ui('High contrast for sunlight')}
          hint={ui('Darker text and stronger lines, easier to read outdoors in bright sun.')}
          value={preferences.colorTheme === 'outdoor'}
          onValueChange={(enabled) => {
            const next = enabled ? 'outdoor' : 'white';
            if (next === preferences.colorTheme) return;
            setNeedsManualRestart(false);
            void update('colorTheme', next).then(() =>
              application
                .reload(`Changed colour theme to ${next}`)
                .catch(() => setNeedsManualRestart(true)),
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
        <SettingsRow
          label={t('settings.aboutOmx')}
          hint={t('settings.aboutOmxHint')}
          onPress={() => router.push('/(main)/settings/omx-lab')}
        />
      </SettingsSection>
    </Screen>
  );
}
