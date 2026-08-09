import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Screen, Text } from '@/components/ui';
import { ScreenHeader, SettingsButton } from '@/components/common';
import { ArrivalWisdom } from '@/components/arrival';
import { SiteMap3D } from '@/components/map';
import { SiteListItem } from '@/components/site';
import { HeritageVideo } from '@/components/media/HeritageVideo';
import { demoSites } from '@/data';
import { QuestCard } from '@/features/quests';
import { useCurrentPosition, useNearbySites } from '@/hooks';
import { usePermission, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';

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
        canGoBack={false}
        eyebrow="Tīrtha"
        title="Explore Lumbini"
        subtitle={
          coordinate
            ? 'Sites near you, nearest first.'
            : 'The sacred garden and the monastic zone.'
        }
        rightAction={<SettingsButton />}
      />

      <ArrivalWisdom coordinate={coordinate} />

      <View>
        <Text variant="label" tone="muted" uppercase>Witness the place</Text>
        <Text variant="body" tone="secondary" style={styles.videoIntro}>
          A short glimpse of the heritage you are helping keep visible.
        </Text>
        <HeritageVideo compact />
      </View>

      {/* Wrapping the map is safe again: inline it is built inert, so it
          consumes no gestures and cannot fight this Pressable or the page's
          own scrolling. Panning and zooming happen on the full-screen map,
          where nothing competes for the touches. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the full screen map"
        accessibilityHint="Shows the map full screen, where you can pan and zoom"
        onPress={() => router.push('/(main)/tirtha/map')}
      >
        <SiteMap3D onSelectSite={(id) => router.push(`/(main)/tirtha/site/${id}`)} />
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open the full screen map"
        accessibilityHint="Shows the map full screen with your position on it"
        onPress={() => router.push('/(main)/tirtha/map')}
        style={({ pressed }) => [styles.mapCta, pressed && styles.mapCtaPressed]}
      >
        <Text variant="body" tone="sandstone">
          Open full screen map
        </Text>
      </Pressable>


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
  mapCta: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  mapCtaPressed: { backgroundColor: colors.surfaceSecondary },
  offer: { marginTop: spacing.lg, gap: spacing.md, alignItems: 'flex-start' },
  offerText: { paddingRight: spacing.xl },
  videoIntro: { marginTop: spacing.xs },
  questSection: { marginTop: spacing.lg, gap: spacing.xs },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  list: { marginTop: spacing.lg, gap: spacing.md },
});
