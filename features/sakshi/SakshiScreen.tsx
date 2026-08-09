import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Divider, Screen, Text } from '@/components/ui';
import { EmptyState, ScreenHeader, SettingsButton } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { PracticeSummaryCard } from '@/components/practice';
import { SourceCard } from '@/components/source';
import { ThenNowCompare } from '@/components/thennow';
import { TimeSeriesScrubber } from '@/components/series';
import {
  demoSites,
  demoVantages,
  findSite,
  findSource,
  historicalImagesForSite,
  nowImageForSite,
  vantagesForSite,
} from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePractice } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { distanceMeters, formatDistance, formatTimestamp } from '@/utils';
import type { Observation, ObservationAssessment } from '@/types';

const siteHeroImages: Record<string, number> = {
  'maya-devi-temple': require('../../assets/plates/maya-devi-temple.aerial.jpg'),
};

type TabMode = 'reconstruction' | 'vantages' | 'thennow' | 'records';

const COMPARABLE_SITES = demoSites.filter((site) => historicalImagesForSite(site.id).length > 0);

/**
 * Sākṣī — GPS Location-Anchored Heritage Reconstruction & Witness Surface.
 *
 * Automatically detects your active heritage site via GPS and displays:
 * 1. Historical reconstruction & timeline comparison ONLY for that location.
 * 2. Viewpoint alignment trigger ONLY for that location.
 * 3. Recorded observation series ONLY for that location.
 */
export function SakshiScreen() {
  const router = useRouter();
  const { coordinate } = useCurrentPosition({ watch: true });
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeTab, setActiveTab] = useState<TabMode>('reconstruction');
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const { summary, refresh: refreshPractice } = usePractice();

  // Re-read on focus: an observation may have been recorded since we last looked.
  useFocusEffect(
    useCallback(() => {
      let active = true;
      database
        .listObservations()
        .then((rows) => {
          if (active) setObservations(rows);
        })
        .catch(() => {});
      void refreshPractice();
      return () => {
        active = false;
      };
    }, [refreshPractice]),
  );

  // Automatically determine current heritage site based on GPS position
  const sortedVantages = coordinate
    ? [...demoVantages].sort(
        (a, b) =>
          distanceMeters(coordinate, a.coordinate) - distanceMeters(coordinate, b.coordinate),
      )
    : demoVantages;

  const nearestVantage = sortedVantages[0];
  const activeSiteId = nearestVantage ? nearestVantage.siteId : 'ashokan-pillar';
  const activeSite = findSite(activeSiteId);

  // Vantages for the current GPS-detected site ONLY
  const siteVantages = vantagesForSite(activeSiteId);
  const primaryVantage = siteVantages[0] ?? nearestVantage;
  const distanceToSite =
    coordinate && primaryVantage ? distanceMeters(coordinate, primaryVantage.coordinate) : null;

  // Historical images for the current GPS-detected site ONLY
  const historicalImages = historicalImagesForSite(activeSiteId);
  const selectedHistorical =
    historicalImages.find((img) => img.id === selectedImageId) ?? historicalImages[0];
  const source = selectedHistorical ? findSource(selectedHistorical.sourceId) : undefined;
  const nowImage = nowImageForSite(activeSiteId);

  // Observations recorded for the current GPS-detected site ONLY
  const siteObservations = observations.filter((obs) => obs.siteId === activeSiteId);

  return (
    <Screen scroll>
      <ScreenHeader
        canGoBack={false}
        eyebrow="Sākṣī"
        title="Witness"
        subtitle="Return to a fixed viewpoint, align, and record what is there today."
        rightAction={<SettingsButton />}
      />

      {/* Location-Driven Hero Quick Witness Card */}
      {primaryVantage ? (
        <View style={styles.heroCard}>
          {activeSite && siteHeroImages[activeSite.id] ? (
            <View style={styles.heroImageBanner}>
              <Image
                source={siteHeroImages[activeSite.id]}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <View style={styles.heroBody}>
            <View style={styles.heroHeader}>
              <Chip label="LOCATION HERITAGE" />
              {distanceToSite != null ? (
                <Text variant="mono" tone="sandstone" style={styles.heroDistance}>
                  {formatDistance(distanceToSite)}
                </Text>
              ) : null}
            </View>
            <Text variant="heading" style={styles.heroTitle}>
              {activeSite?.name ?? 'Sacred Site'} — {primaryVantage.label}
            </Text>
            <Text variant="caption" tone="secondary" style={styles.heroSub}>
              Tolerance: ±{primaryVantage.positionToleranceM} m · ±{primaryVantage.bearingToleranceDeg}°
            </Text>
            <Button
              label="Align & Witness Now"
              onPress={() =>
                router.push({
                  pathname: '/(main)/sakshi/vantage',
                  params: { vantageId: primaryVantage.id },
                })
              }
            />
          </View>
        </View>
      ) : null}

      {/* Segmented Mobile Navigation Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'reconstruction' && styles.tabItemActive]}
          onPress={() => setActiveTab('reconstruction')}
        >
          <Text variant="label" tone={activeTab === 'reconstruction' ? 'sandstone' : 'muted'} uppercase>
            Reconstruction
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'vantages' && styles.tabItemActive]}
          onPress={() => setActiveTab('vantages')}
        >
          <Text variant="label" tone={activeTab === 'vantages' ? 'sandstone' : 'muted'} uppercase>
            Vantages ({siteVantages.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'thennow' && styles.tabItemActive]}
          onPress={() => setActiveTab('thennow')}
        >
          <Text variant="label" tone={activeTab === 'thennow' ? 'sandstone' : 'muted'} uppercase>
            Then / Now
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'records' && styles.tabItemActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text variant="label" tone={activeTab === 'records' ? 'sandstone' : 'muted'} uppercase>
            Records ({observations.length})
          </Text>
        </Pressable>
      </View>

      {/* Tab Content 1: Reconstruction for CURRENT Location ONLY */}
      {activeTab === 'reconstruction' ? (
        <View style={styles.section}>
          <Text variant="title" style={styles.compareTitle}>
            {activeSite?.name ?? 'Heritage Site'}
          </Text>

          {selectedHistorical ? (
            <>
              {/* Interactive Draggable Wipe Frame */}
              <ThenNowCompare
                then={{
                  image: selectedHistorical.image,
                  date: selectedHistorical.date,
                  placeholderNote: selectedHistorical.caption,
                  tier: selectedHistorical.evidenceTier,
                }}
                now={{
                  image: nowImage,
                  date: 'Today',
                  placeholderNote:
                    'Your own photograph appears here once you have witnessed this site from the fixed viewpoint.',
                }}
              />

              {/* Historical Date Switcher Chips */}
              {historicalImages.length > 1 ? (
                <View style={styles.chips}>
                  {historicalImages.map((img) => (
                    <Chip
                      key={img.id}
                      label={img.date}
                      selected={img.id === selectedHistorical.id}
                      onPress={() => setSelectedImageId(img.id)}
                    />
                  ))}
                </View>
              ) : null}

              {/* Caption */}
              <Text variant="body" style={styles.caption}>
                {selectedHistorical.caption}
              </Text>

              {/* Approximate Viewpoint Disclaimer */}
              {!selectedHistorical.viewpointConfirmed ? (
                <View style={styles.qualifier}>
                  <Text variant="label" tone="seeking" uppercase>
                    Approximate viewpoint
                  </Text>
                  <Text variant="caption" tone="secondary">
                    The historical image was not made from a surveyed point. Differences near the edges of
                    the frame may be a change of angle rather than a change on the ground.
                  </Text>
                </View>
              ) : null}

              <Divider />

              {/* Source Citation Card */}
              {source ? (
                <View style={styles.block}>
                  <Text variant="label" tone="muted" uppercase>
                    Source
                  </Text>
                  <SourceCard source={source} />
                </View>
              ) : null}

              {/* Observation Timeline Scrubber for this location */}
              {siteObservations.length > 0 ? (
                <>
                  <Divider />
                  <TimeSeriesScrubber
                    observations={siteObservations}
                    vantageLabel={`${activeSite?.name ?? 'Site'} Timeline`}
                    onSelectObservation={(obs) =>
                      router.push({
                        pathname: '/(main)/sakshi/observation',
                        params: { observationId: obs.id },
                      })
                    }
                  />
                </>
              ) : null}
            </>
          ) : (
            <EmptyState
              title="No historical reconstruction plate"
              body={`No historical archive plate has been matched to ${activeSite?.name ?? 'this site'} yet.`}
            />
          )}
        </View>
      ) : null}

      {/* Tab Content 2: Vantages for CURRENT Location ONLY */}
      {activeTab === 'vantages' ? (
        <View style={styles.section}>
          <View style={styles.list}>
            {siteVantages.map((vantage) => (
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
        </View>
      ) : null}

      {/* Tab Content 3: Then / Now */}
      {activeTab === 'thennow' ? (
        <View style={styles.section}>
          {COMPARABLE_SITES.length === 0 ? (
            <EmptyState
              title="No comparisons yet"
              body="A comparison needs a dated archive photograph matched to a viewpoint. None are bundled yet."
            />
          ) : (
            <View style={styles.list}>
              {COMPARABLE_SITES.map((site) => {
                const images = historicalImagesForSite(site.id);
                const oldest = images[0];
                return (
                  <Card
                    key={site.id}
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/sakshi/then-now/[siteId]',
                        params: { siteId: site.id },
                      })
                    }
                    accessibilityLabel={`Compare ${site.name} across time`}
                  >
                    <Text variant="heading">{site.name}</Text>
                    <Text variant="mono" tone="sandstone">
                      {oldest.date} → today
                    </Text>
                    <Text variant="caption" tone="muted">
                      {images.length === 1 ? '1 archive image' : `${images.length} archive images`}
                    </Text>
                  </Card>
                );
              })}
            </View>
          )}
        </View>
      ) : null}

      {/* Tab Content 4: Your Records */}
      {activeTab === 'records' ? (
        <View style={styles.section}>
          {observations.length === 0 ? (
            <EmptyState
              title="Nothing recorded yet"
              body="A series begins with one observation. Choose a vantage point and stand in it."
            />
          ) : (
            <View style={styles.list}>
              {observations.map((observation) => (
                <ObservationRow
                  key={observation.id}
                  observation={observation}
                  onPress={() =>
                    router.push({
                      pathname: '/(main)/sakshi/observation',
                      params: { observationId: observation.id },
                    })
                  }
                />
              ))}
            </View>
          )}

          <PracticeSummaryCard summary={summary} />
          <Button
            label="Open complete site register"
            variant="secondary"
            onPress={() => router.push('/(main)/sakshi/register' as any)}
          />
          <Button
            label="Guardians — who is contributing"
            variant="quiet"
            onPress={() => router.push('/(main)/sakshi/guardians' as any)}
          />
        </View>
      ) : null}
    </Screen>
  );
}

function ObservationRow({
  observation,
  onPress,
}: {
  observation: Observation;
  onPress: () => void;
}) {
  const site = findSite(observation.siteId);

  return (
    <Card onPress={onPress}>
      <View style={styles.observationRow}>
        {observation.photoUri ? (
          <Image source={{ uri: observation.photoUri }} style={styles.observationThumb} />
        ) : null}
        <View style={styles.observationText}>
          <Text variant="heading">{site?.name ?? observation.siteId}</Text>
          <Text variant="mono" tone="secondary">
            {formatTimestamp(observation.capturedAt)}
          </Text>
        </View>
        <Chip
          label={assessmentLabel[observation.assessment]}
          selected={observation.assessment !== 'unreviewed'}
        />
      </View>
    </Card>
  );
}

const assessmentLabel: Record<ObservationAssessment, string> = {
  unreviewed: 'Needs review',
  'no-change': 'No change',
  reported: 'Reported',
};

const styles = StyleSheet.create({
  heroCard: {
    marginTop: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.sandstone,
    overflow: 'hidden',
  },
  heroImageBanner: {
    width: '100%',
    aspectRatio: 2.8,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroBody: {
    padding: spacing.base,
    gap: spacing.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroDistance: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  heroSub: {
    fontSize: 12,
  },
  tabBar: {
    flexDirection: 'row',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    padding: 3,
    gap: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radii.sm,
  },
  tabItemActive: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: { paddingTop: spacing.md, gap: spacing.md },
  compareTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.sandstone,
  },
  chips: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  caption: {
    lineHeight: 20,
  },
  qualifier: {
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.seek,
    gap: spacing.xxs,
  },
  block: {
    gap: spacing.xs,
  },
  list: { gap: spacing.md },
  observationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
  },
  observationThumb: {
    width: 48,
    height: 48,
    borderRadius: radii.sm,
  },
  observationText: { flex: 1, gap: spacing.xxs },
});
