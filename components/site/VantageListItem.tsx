import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { formatBearing, formatDate, formatDistance } from '@/utils';
import type { Vantage } from '@/types';

import { BearingCompass } from './BearingCompass';

export function VantageListItem({
  vantage,
  distanceM,
  lastCaptureAt,
  onPress,
}: {
  vantage: Vantage;
  distanceM?: number | null;
  /** ISO 8601 timestamp of the most recent recorded observation at this vantage, or null/absent if none yet. */
  lastCaptureAt?: string | null;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`Vantage: ${vantage.label}`} style={styles.card}>
      <View style={styles.row}>
        <BearingCompass bearingDeg={vantage.bearing} size={48} />

        <View style={styles.body}>
          <Text variant="heading">{vantage.label}</Text>

          {vantage.note ? (
            <Text variant="body" tone="secondary" numberOfLines={2} style={styles.note}>
              {vantage.note}
            </Text>
          ) : null}

          <View style={styles.stats}>
            <StatCell label="Bearing" value={formatBearing(vantage.bearing)} />
            <StatCell label="Distance" value={formatDistance(distanceM)} />
            <StatCell
              label="Last capture"
              value={lastCaptureAt ? formatDate(lastCaptureAt) : 'Not yet'}
            />
          </View>
        </View>

        <Icon name="chevron-right" size={20} color={colors.textMuted} />
      </View>
    </Card>
  );
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCell}>
      <Text variant="label" tone="muted" uppercase numberOfLines={2}>
        {label}
      </Text>
      <Text variant="mono" tone="primary" numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  body: { flex: 1, gap: spacing.xs },
  note: { marginBottom: spacing.xxs },
  stats: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  statCell: { flex: 1, gap: spacing.xxs },
});
