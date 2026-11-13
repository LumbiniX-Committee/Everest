import { Image, Linking, StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { OWNER } from '@/constants/owner';
import { radii, spacing } from '@/theme';

import { SettingsSection } from './components';

/** O.M.X Lab's short horizontal logo, the approved "on Cream" version, so it reads in light and dark. */
const LOGO = require('@/assets/brand/omx-lab-logo.png');

/**
 * Settings → About O.M.X Lab: the company that makes and runs Sākṣī.
 *
 * Company facts come from its letterhead and brand guidelines. Names, numbers
 * and the address are proper nouns and legal text, so they are shown as written.
 */
export function OmxLabScreen() {
  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Settings" title="About O.M.X Lab" subtitle="The company that makes and runs Sākṣī" />

      <View style={styles.logoWrap}>
        <Image
          source={LOGO}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel={OWNER.legalName}
        />
      </View>

      <SettingsSection title="Who we are">
        <Text variant="body" tone="secondary" style={styles.body}>
          A technology and research company from Bharatpur, Chitwan, founded in 2026. We build websites, apps and
          platforms, and research better ways to build them. Sākṣī is our product: we made it, we run it, and we
          answer for it.
        </Text>
      </SettingsSection>

      <SettingsSection title="What we hold to">
        <Value title="Research" body="We learn before we build, and choose tools for good reasons." />
        <Value title="Innovation" body="We use current, proven technology and keep improving it." />
        <Value title="Impact" body="We measure success by what it does for the people who use it." />
      </SettingsSection>

      <SettingsSection
        title="Contact"
        footnote="Questions about your records, the app, or working with us."
      >
        <View style={styles.body}>
          <Button
            label="Email O.M.X Lab"
            variant="secondary"
            onPress={() => void Linking.openURL(`mailto:${OWNER.email}`)}
          />
          <Text variant="caption" tone="muted" style={styles.email} translate={false}>
            {OWNER.email}
          </Text>
        </View>
      </SettingsSection>

      <SettingsSection title="Company details">
        <Row label="Registered name" value={OWNER.legalName} />
        <Row label="Address" value={OWNER.address} />
        <Row label="Registration no." value={OWNER.registrationNo} />
        <Row label="PAN" value={OWNER.pan} />
      </SettingsSection>

      <Text variant="caption" tone="muted" center style={styles.footer} translate={false}>
        © {OWNER.founded} {OWNER.legalName}
      </Text>
    </Screen>
  );
}

function Value({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.value}>
      <Text variant="bodyStrong">{title}</Text>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text variant="body">{label}</Text>
      <Text variant="body" tone="secondary" style={styles.rowValue} translate={false}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // The cream logo keeps its own background; the radius only softens the corners, it adds no frame.
  logoWrap: { alignItems: 'center', marginVertical: spacing.lg },
  logo: { width: 270, height: 90, borderRadius: radii.md },
  body: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  value: { paddingHorizontal: spacing.base, paddingVertical: spacing.sm, gap: 2 },
  email: { marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  rowValue: { flexShrink: 1, textAlign: 'right' },
  footer: { marginTop: spacing.lg },
});
