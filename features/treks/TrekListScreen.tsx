import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Card, Screen, Text } from '@/components/ui';
import { TREKS, trekStop } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import { formatDistance } from '@/utils';

import { formatAltitude } from './format';

export const DIFFICULTY_LABEL = {
  easy: 'Easy',
  moderate: 'Moderate',
  challenging: 'Challenging',
} as const;

/** The trekking routes, with the numbers that decide whether one suits you. */
export function TrekListScreen() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Trekking"
        title="Trekking routes"
        subtitle="Day-by-day routes measured from open map data, with altitude, permits and safety."
      />
      <View style={styles.list}>
        {TREKS.map((trek) => {
          const highest = trekStop(trek, trek.totals.highest?.stopId);
          return (
            <Card key={trek.id} onPress={() => router.push(`/(main)/tirtha/treks/${trek.id}`)} accessibilityLabel={trek.name}>
              <Text variant="label" tone="muted" uppercase>
                {ui(DIFFICULTY_LABEL[trek.difficulty])}
              </Text>
              <Text variant="heading" translate={false}>
                {trek.name}
              </Text>
              <Text variant="caption" tone="secondary" translate={false}>
                {trek.region}
              </Text>
              <View style={styles.stats}>
                <Stat label={ui('Days')} value={String(trek.totals.days)} />
                <Stat label={ui('Distance')} value={formatDistance(trek.totals.distanceM, preferences.distanceUnit)} />
                <Stat label={ui('Highest')} value={formatAltitude(trek.totals.highest?.elevationM, preferences.distanceUnit)} />
              </View>
              {highest ? (
                <Text variant="caption" tone="muted" translate={false}>
                  {`${ui('Highest point')}: ${highest.name}`}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
      <Text variant="caption" tone="muted" style={styles.note}>
        Altitudes come from a 90 m elevation model and can be out by tens of metres. Walking times are estimates without breaks.
      </Text>
    </Screen>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text variant="caption" tone="muted" translate={false}>
        {label}
      </Text>
      <Text variant="bodyStrong" translate={false}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  stats: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.sm, marginBottom: spacing.xs },
  stat: { gap: spacing.xxs },
  note: { marginTop: spacing.lg, marginBottom: spacing.xl },
});
