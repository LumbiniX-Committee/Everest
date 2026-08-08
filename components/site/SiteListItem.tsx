import { StyleSheet, View } from 'react-native';

import { Card, ConditionBadge, Text } from '@/components/ui';
import type { SiteWithDistance } from '@/hooks';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import { formatDistance } from '@/utils';

export function SiteListItem({
  site,
  onPress,
}: {
  site: SiteWithDistance;
  onPress: () => void;
}) {
  const { preferences } = usePreferences();

  return (
    <Card onPress={onPress} accessibilityLabel={`${site.name}. ${site.summary}`}>
      <View style={styles.headRow}>
        <View style={styles.names}>
          <Text variant="heading">{site.name}</Text>
          {site.nameNepali ? (
            <Text variant="caption" tone="muted">
              {site.nameNepali}
            </Text>
          ) : null}
        </View>
        {site.distanceM != null ? (
          <Text variant="mono" tone="secondary">
            {formatDistance(site.distanceM, preferences.distanceUnit)}
          </Text>
        ) : null}
      </View>

      <Text variant="body" tone="secondary" style={styles.summary}>
        {site.summary}
      </Text>

      <View style={styles.footRow}>
        <ConditionBadge status={site.condition} />
        <Text variant="label" tone="muted" uppercase>
          {site.vantageIds.length === 0
            ? 'No vantage yet'
            : `${site.vantageIds.length} vantage${site.vantageIds.length === 1 ? '' : 's'}`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  names: { flexShrink: 1, gap: spacing.xxs },
  summary: { marginTop: spacing.sm },
  footRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.sm,
  },
});
