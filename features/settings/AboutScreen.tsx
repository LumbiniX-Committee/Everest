import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Screen, Text } from '@/components/ui';
import { APP_EPIGRAPH, APP_NAME, APP_SUBTITLE } from '@/constants';
import { spacing } from '@/theme';

import { SettingsSection } from './components';

export function AboutScreen() {
  // Read from the manifest rather than hardcoded, so it cannot drift.
  //
  // Only the version is shown. eas.json sets appVersionSource: "remote", so the
  // Android versionCode is injected into the native manifest at build time and
  // never appears in app.json — Constants would report it as undefined on every
  // build. Showing the build number needs expo-application's
  // nativeBuildVersion, which is not a dependency here.
  const version = Constants.expoConfig?.version ?? '—';

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Settings" title={`About ${APP_NAME}`} subtitle={APP_SUBTITLE} />

      <SettingsSection title="Version">
        <Row label="Version" value={version} />
      </SettingsSection>

      <SettingsSection
        title="What this app is"
        footnote="Sākṣī means witness. The app exists to make a place's condition legible over time, by having many people photograph the same view from the same spot across years."
      >
        <Text variant="body" tone="secondary" style={styles.body}>
          Observations are recorded on your device first and belong to you. Sync uploads them so
          they can be compared with others; nothing is deleted locally when it does.
        </Text>
      </SettingsSection>

      <SettingsSection
        title="Sources"
        footnote="Every passage in Dhamma carries the reference it came from, and answers are refused rather than invented when the canon does not support them."
      >
        <Text variant="body" tone="secondary" style={styles.body}>
          Historical imagery and site records are attributed to their holding institutions on each
          site's detail screen. Pali passages cite the collection, book and verse.
        </Text>
      </SettingsSection>

      <SettingsSection title="Acknowledgement">
        <Text variant="body" tone="secondary" style={styles.body}>
          Built for the sacred sites of Lumbini, and for the people who look after them.
        </Text>
      </SettingsSection>

      <Text variant="body" tone="sandstone" center style={styles.epigraph}>
        {APP_EPIGRAPH}
      </Text>
      <Text variant="caption" tone="muted" center>
        Strive on with heedfulness.
      </Text>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="body">{label}</Text>
      <Text variant="body" tone="secondary">
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  body: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  epigraph: { marginTop: spacing.lg },
});
