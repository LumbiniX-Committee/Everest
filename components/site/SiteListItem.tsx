import { StyleSheet, View } from 'react-native';

import { Card, ConditionBadge, Text } from '@/components/ui';
import type { SiteWithDistance } from '@/hooks';
import { usePreferences } from '@/store';
import { radii, spacing } from '@/theme';
import { formatDistance } from '@/utils';

import { SiteVisual } from './SiteVisual';

/**
 * A place in a list.
 *
 * Picture first, then the name, then one line. It used to lead with the name
 * and give the summary two full lines of prose, which made a list of twelve
 * monuments read as twelve paragraphs — the reader had to parse a sentence per
 * row to find the one they wanted. A picture is scanned, not read.
 *
 * The summary stays, at one line: a place still has to say what it is. What it
 * no longer does is say it at length in a list whose job is to be chosen from.
 */
export function SiteListItem({
  site,
  onPress,
}: {
  site: SiteWithDistance;
  onPress: () => void;
}) {
  const { preferences } = usePreferences();

  return (
    <Card onPress={onPress} accessibilityLabel={`${site.name}. ${site.summary}`} style={styles.card}>
      <View style={styles.row}>
        <SiteVisual siteId={site.id} height={72} radius={radii.md} quiet style={styles.thumb} />

        <View style={styles.body}>
          <View style={styles.headRow}>
            <View style={styles.names}>
              <Text variant="heading" numberOfLines={1}>
                {site.name}
              </Text>
              {site.nameNepali ? (
                <Text variant="caption" tone="muted" numberOfLines={1}>
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

          <Text variant="caption" tone="secondary" numberOfLines={1}>
            {site.summary}
          </Text>

          <View style={styles.footRow}>
            <ConditionBadge status={site.condition} />
            {site.vantageIds.length > 0 ? (
              <Text variant="label" tone="muted" uppercase>
                {site.vantageIds.length} vantage{site.vantageIds.length === 1 ? '' : 's'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  thumb: { width: 96 },
  body: { flex: 1, gap: spacing.xxs, justifyContent: 'space-between' },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  names: { flex: 1, gap: 1 },
  footRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
