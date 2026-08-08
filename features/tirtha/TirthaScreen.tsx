import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { ScreenHeader } from '@/components/common';
import { SitePlan } from '@/components/map';
import { SiteListItem } from '@/components/site';
import { demoSites } from '@/data';
import { QuestCard } from '@/features/quests';
import { useCurrentPosition, useNearbySites } from '@/hooks';
import { usePermission, useQuests } from '@/store';
import { spacing } from '@/theme';

/**
 * Tīrtha — explore Lumbini.
 *
 * The landing surface, and the one that must work with nothing granted. Without
 * location it shows every site in curated order; with location it sorts by
 * distance and marks the observer on the plan. The prompt for location appears
 * inline, as an offer, and never blocks the list.
 */
export function TirthaScreen() {
  const router = useRouter();
  const { coordinate } = useCurrentPosition({ watch: true });
  const sites = useNearbySites(coordinate);
  const { state, request } = usePermission('location');
  const { inProgressQuests, availableQuests } = useQuests();

  const showLocationOffer = state.status === 'undetermined' || state.status === 'denied';
  const featuredQuest = inProgressQuests[0] ?? availableQuests[0];

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Tīrtha"
        title="Explore Lumbini"
        subtitle={
          coordinate
            ? 'Sites near you, nearest first.'
            : 'The sacred garden and the monastic zone.'
        }
      />

      <SitePlan sites={demoSites} observer={coordinate} />

      {showLocationOffer ? (
        <View style={styles.offer}>
          <Text variant="caption" tone="secondary" style={styles.offerText}>
            Allow location to sort these by how far you have to walk.
          </Text>
          <Button label="Allow location" variant="secondary" onPress={request} />
        </View>
      ) : null}

      {featuredQuest ? (
        <View style={styles.questSection}>
          <View style={styles.sectionHeader}>
            <Text variant="heading">Featured Quest</Text>
            <Button
              label="View All Quests"
              variant="quiet"
              onPress={() => router.push('/(main)/tirtha/quests')}
            />
          </View>
          <QuestCard
            quest={featuredQuest}
            onPress={() => router.push(`/(main)/tirtha/quests/${featuredQuest.id}`)}
          />
        </View>
      ) : null}

      <View style={styles.list}>
        {sites.map((site) => (
          <SiteListItem
            key={site.id}
            site={site}
            onPress={() => router.push(`/(main)/tirtha/site/${site.id}`)}
          />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  offer: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  offerText: { paddingRight: spacing.xl },
  questSection: { marginTop: spacing.lg, gap: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  list: { marginTop: spacing.lg, gap: spacing.md },
});
