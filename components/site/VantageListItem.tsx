import { StyleSheet, View } from 'react-native';

import { Card, MetaRow, Text } from '@/components/ui';
import { spacing } from '@/theme';
import { formatBearing, formatDate, formatDistance } from '@/utils';
import type { Vantage } from '@/types';

export function VantageListItem({
  vantage,
  distanceM,
  onPress,
}: {
  vantage: Vantage;
  distanceM?: number | null;
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`Vantage: ${vantage.label}`}>
      <View style={styles.headRow}>
        <Text variant="heading">{vantage.label}</Text>
        {distanceM != null ? (
          <Text variant="mono" tone="secondary">
            {formatDistance(distanceM)}
          </Text>
        ) : null}
      </View>

      {vantage.note ? (
        <Text variant="body" tone="secondary" style={styles.note}>
          {vantage.note}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <MetaRow label="Bearing" value={formatBearing(vantage.bearing)} tone="secondary" />
        <MetaRow
          label="Tolerance"
          value={`±${vantage.positionToleranceM} m · ±${vantage.bearingToleranceDeg}°`}
          tone="secondary"
        />
        {vantage.seriesBegan ? (
          <MetaRow label="Series began" value={formatDate(vantage.seriesBegan)} tone="secondary" />
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  note: { marginTop: spacing.sm },
  meta: { marginTop: spacing.md },
});
