import { useRouter } from 'expo-router';

import { ScreenHeader } from '@/components/common';
import { Screen } from '@/components/ui';
import { application } from '@/services';
import { usePermissions, usePreferences } from '@/store';

import { SettingsRow, SettingsSection, SettingsToggle } from './components';

const TOLERANCE_LABELS = {
  strict: 'Strict',
  standard: 'Standard',
  forgiving: 'Forgiving',
} as const;

/** The Settings index and the one app-wide visual switch. */
export function SettingsScreen() {
  const router = useRouter();
  const { preferences, update } = usePreferences();
  const { states } = usePermissions();

  // Surfaced on the row itself rather than left behind a tap: a denied
  // permission is the most common reason the witness loop appears broken, and
  // someone hunting for that answer should see it without opening the screen.
  const denied = Object.values(states).filter(
    (state) => state.status === 'denied' || state.status === 'blocked',
  ).length;

  return (
    <Screen scroll>
      <ScreenHeader
        title="Settings"
        subtitle="How the app behaves, what it has stored, and where the data came from."
      />

      <SettingsSection
        title="Appearance"
        footnote="Changing the colour system reloads the app so shared colour tokens switch together."
      >
        <SettingsToggle
          label="Navy theme"
          hint="Turn off for the white daylight theme."
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

      <SettingsSection title="Recording" divided>
        <SettingsRow
          label="Preferences"
          value={TOLERANCE_LABELS[preferences.alignmentTolerance]}
          hint="Alignment, capture, haptics, units"
          onPress={() => router.push('/(main)/settings/preferences')}
        />
        <SettingsRow
          label="Arrivals"
          hint="Being told what a place holds when you reach it"
          onPress={() => router.push('/(main)/settings/arrivals')}
        />
        <SettingsRow
          label="Permissions"
          value={denied > 0 ? `${denied} needs attention` : 'All granted'}
          hint="Camera, location, motion"
          onPress={() => router.push('/(main)/settings/permissions')}
        />
      </SettingsSection>

      <SettingsSection title="Data" divided>
        <SettingsRow
          label="Offline AI"
          hint="Download or remove the local Dhamma model"
          onPress={() => router.push('/(main)/settings/offline-ai')}
        />
        <SettingsRow
          label="Sync"
          hint="What is waiting to upload, and when it may"
          onPress={() => router.push('/(main)/settings/sync')}
        />
        <SettingsRow
          label="Storage"
          hint="What this device is holding"
          onPress={() => router.push('/(main)/settings/storage')}
        />
      </SettingsSection>

      <SettingsSection title="Institutional">
        <SettingsRow
          label="Custodian"
          hint="Acknowledge and triage condition reports"
          onPress={() => router.push('/(main)/settings/custodian')}
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsRow
          label="About Saksi"
          hint="Version, sources, and acknowledgements"
          onPress={() => router.push('/(main)/settings/about')}
        />
      </SettingsSection>
    </Screen>
  );
}
