import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ConditionBadge, Divider, MetaRow, Screen, SourceBadge, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { findSite, vantagesForSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { spacing } from '@/theme';
import { distanceMeters, formatCoordinate, formatDistance } from '@/utils';

/**
 * A single heritage site.
 *
 * Provenance is shown before description, deliberately: a reader should know
 * whether they are looking at excavated evidence or a community report before
 * they read the claim, not after.
 */
export function SiteDetailScreen({ siteId }: { siteId: string }) {
  const router = useRouter();
  const site = findSite(siteId);
  const { coordinate } = useCurrentPosition();

  if (!site) {
    return (
      <Screen>
        <EmptyState
          title="No such site"
          body="This site is not in the catalogue. It may have been removed, or the link may be stale."
          actionLabel="Back to Tīrtha"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const vantages = vantagesForSite(site.id);
  const distanceM = coordinate ? distanceMeters(coordinate, site.coordinate) : null;

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          Tīrtha
        </Text>
        <Text variant="title">{site.name}</Text>
        {site.nameNepali ? (
          <Text variant="body" tone="secondary">
            {site.nameNepali}
          </Text>
        ) : null}

        <View style={styles.badges}>
          <ConditionBadge status={site.condition} />
          <SourceBadge tier={site.sourceTier} />
        </View>
      </View>

      <Text variant="body" style={styles.description}>
        {site.description}
      </Text>

      <Divider />

      <View style={styles.meta}>
        <MetaRow label="Position" value={formatCoordinate(site.coordinate)} />
        {site.elevation != null ? (
          <MetaRow label="Elevation" value={`${site.elevation} m`} />
        ) : null}
        {distanceM != null ? <MetaRow label="Distance" value={formatDistance(distanceM)} /> : null}
        {site.sourceNote ? (
          <MetaRow label="Source" value={site.sourceNote} mono={false} tone="secondary" />
        ) : null}
      </View>

      <Divider />

      <View style={styles.vantageBlock}>
        <Text variant="heading">Vantage points</Text>
        {vantages.length === 0 ? (
          <Text variant="body" tone="secondary">
            No fixed viewpoint has been established here yet. Until one is surveyed, observations
            from this site cannot be compared over time.
          </Text>
        ) : (
          <View style={styles.vantageList}>
            {vantages.map((vantage) => (
              <VantageListItem
                key={vantage.id}
                vantage={vantage}
                distanceM={coordinate ? distanceMeters(coordinate, vantage.coordinate) : null}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/sakshi/vantage',
                    params: { vantageId: vantage.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  description: { paddingBottom: spacing.lg },
  meta: { paddingVertical: spacing.lg },
  vantageBlock: { paddingTop: spacing.lg, gap: spacing.md },
  vantageList: { gap: spacing.md },
});
