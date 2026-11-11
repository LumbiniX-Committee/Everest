import Constants from 'expo-constants';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { APP_EPIGRAPH, APP_NAME, APP_SUBTITLE } from '@/constants';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';

import { SettingsSection } from './components';

/**
 * Attribution the data's licences require, in one place. Names and licences are
 * proper nouns and legal text, so they are shown as written rather than translated.
 */
const CREDITS = [
  'Map data © OpenStreetMap contributors, ODbL. Basemap by OpenFreeMap, © OpenMapTiles.',
  'Terrain: Mapzen Terrain Tiles on AWS Open Data. Trek altitudes: Copernicus DEM GLO-90 via Open-Meteo, © DLR e.V. 2010-2014 and © Airbus Defence and Space GmbH 2014-2018, provided under COPERNICUS by the European Union and ESA.',
  'Walking directions: Valhalla routing on the FOSSGIS OpenStreetMap server.',
  'Listed places: Wikidata (CC0); photographs from Wikimedia Commons, credited per file.',
  'Essentials: Overture Maps Places (CDLA-Permissive-2.0, CC0-1.0, Apache-2.0). Foursquare data: Copyright 2024 Foursquare Labs, Inc. All rights reserved.',
].join('\n\n');

export function AboutScreen() {
  const { preferences } = usePreferences();
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
          site’s detail screen. Pali passages cite the collection, book and verse.
        </Text>
      </SettingsSection>

      <SettingsSection
        title="Map and data credits"
        footnote="Every listing names its own source and licence where it is shown."
      >
        <Text variant="body" tone="secondary" style={styles.body} translate={false}>
          {CREDITS}
        </Text>
      </SettingsSection>

      <SettingsSection title="Privacy">
        <View style={styles.body}>
          <Button
            label="Read the privacy policy"
            variant="secondary"
            onPress={() => void application.openPrivacyPolicy(preferences.interfaceLanguage === 'ne' ? 'ne' : 'en')}
          />
        </View>
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
