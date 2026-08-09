import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Divider, Screen, Text } from '@/components/ui';
import { EmptyState, ScreenHeader, SettingsButton } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { PracticeSummaryCard } from '@/components/practice';
import { TimeSeriesScrubber } from '@/components/series';
import {
  demoSites,
  demoVantages,
  findSite,
  historicalImagesForSite,
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

/**
 * Three tabs, and there is a reason it is three.
 *
 * A fourth — "Reconstruction" — briefly sat first here. It was an inline copy of
 * the Then/Now screen: same `ThenNowCompare`, same date chips, same source card,
 * pointed at whichever site GPS had picked. So the one comparison in the app had
 * two front doors that disagreed about which site you were looking at, and four
 * uppercase labels at `letterSpacing: 1.4` across a phone meant the longest one
 * wrapped mid-word. Then/Now already lists every comparable site and opens the
 * full screen. This is the same feature, reached once.
 */
type TabMode = 'vantages' | 'thennow' | 'records';

type TabCounts = { siteVantages: unknown[]; observations: unknown[] };

const TABS: ReadonlyArray<{
  key: TabMode;
  label: string;
  /** Tabs that carry a number say how many; Then/Now opens a list and does not. */
  count?: (counts: TabCounts) => number;
}> = [
  { key: 'vantages', label: 'Vantages', count: (c) => c.siteVantages.length },
  { key: 'thennow', label: 'Then / Now' },
  { key: 'records', label: 'Records', count: (c) => c.observations.length },
];

const COMPARABLE_SITES = demoSites.filter((site) => historicalImagesForSite(site.id).length > 0);

/**
 * Sākṣī — the witness surface, anchored to where you are standing.
 *
 * GPS picks the nearest vantage, and that decides the site the whole screen is
 * about. Three tabs follow from it: the viewpoints here, how this place compares
 * with the archive, and what you have already recorded.
 */
export function SakshiScreen() {
  const router = useRouter();
  const { coordinate } = useCurrentPosition({ watch: true });
  const [observations, setObservations] = useState<Observation[]>([]);
  const [activeTab, setActiveTab] = useState<TabMode>('vantages');
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

      {/* The nearest viewpoint, and the way straight to it. */}
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
              <Chip label="NEAREST" />
              {distanceToSite != null ? (
                <Text variant="mono" tone="sandstone">
                  {formatDistance(distanceToSite)}
                </Text>
              ) : null}
            </View>
            <Text variant="heading">
              {activeSite?.name ?? 'Sacred Site'}
            </Text>
            <Text variant="caption" tone="secondary">
              {primaryVantage.label}
            </Text>
            {/*
              The tolerance figures used to sit here, before anyone had walked
              to the spot. They are the alignment rule and they belong on the
              viewfinder, where they are being met or missed; on a card they
              were a specification of a thing not yet being done.
            */}
            <Button
              label="Take the photograph"
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

      {/*
        One loop rather than three hand-written buttons, so a fourth tab cannot
        be added without also being declared above. `numberOfLines={1}` is the
        guard the removed tab needed: these are uppercase at letterSpacing 1.4,
        which is wide, and a long label used to wrap mid-word.
      */}
      <View style={styles.tabBar} accessibilityRole="tablist">
        {TABS.map((tab) => {
          const selected = activeTab === tab.key;
          const label = tab.count ? `${tab.label} (${tab.count({ siteVantages, observations })})` : tab.label;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={label}
              style={[styles.tabItem, selected && styles.tabItemActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text variant="label" tone={selected ? 'sandstone' : 'muted'} uppercase numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tab 1: the viewpoints at the place you are standing in */}
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

      {/*
        Tab 2: the comparison. A list rather than the widget itself — the
        comparison wants the whole screen, and the list is the honest statement
        of how many places actually have an archive plate behind them.
      */}
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

      {/* Tab 3: what you have recorded */}
      {activeTab === 'records' ? (
        <View style={styles.section}>
          {/*
            This place first, everything second. The scrubber came off the tab
            that was removed; it belongs here rather than beside a comparison,
            because it is a record of your own returns to one viewpoint, not a
            comparison with the archive.
          */}
          {siteObservations.length > 0 ? (
            <>
              <TimeSeriesScrubber
                observations={siteObservations}
                vantageLabel={activeSite?.name ?? 'This place'}
                onSelectObservation={(obs) =>
                  router.push({
                    pathname: '/(main)/sakshi/observation',
                    params: { observationId: obs.id },
                  })
                }
              />
              <Divider />
            </>
          ) : null}

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
            label="Who is contributing"
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
  /*
    No size or weight overrides on the hero text. `fontWeight` does nothing once
    a real family is named — Android picks the file, not the axis — so an
    override here would silently drop the emphasis it looks like it is setting.
    The variants already carry both.
  */
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
