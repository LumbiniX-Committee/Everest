import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { EmptyState, ScreenHeader, SettingsButton } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { PracticeSummaryCard } from '@/components/practice';
import { demoSites, demoVantages, findSite, historicalImagesForSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePractice } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { distanceMeters, formatDistance, formatTimestamp } from '@/utils';
import type { Observation, ObservationAssessment } from '@/types';

// Moved below the imports rather than sitting between them — same map, same
// behaviour, it just no longer interrupts the import block.
const siteHeroImages: Record<string, number> = {
  'maya-devi-temple': require('../../assets/plates/maya-devi-temple.aerial.jpg'),
};

type TabMode = 'vantages' | 'thennow' | 'records';

/**
 * Sites with a comparison worth opening.
 *
 * Computed rather than listed, so a site gains a Then / Now the moment a
 * matched plate is added and never appears with an empty one. Sites whose only
 * archive image cannot honestly be wiped against a photograph — a plan drawn
 * from directly above — are absent by the same rule, because `historicalImages`
 * is what the comparison itself reads.
 */
const COMPARABLE_SITES = demoSites.filter((site) => historicalImagesForSite(site.id).length > 0);

/**
 * Sākṣī — the witnessing surface.
 *
 * Organized as a native mobile app dashboard with segmented navigation tabs,
 * hero quick witness card, and structured observation cards.
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

  const vantages = coordinate
    ? [...demoVantages].sort(
        (a, b) =>
          distanceMeters(coordinate, a.coordinate) - distanceMeters(coordinate, b.coordinate),
      )
    : demoVantages;

  const nearestVantage = vantages[0];
  const nearestSite = nearestVantage ? findSite(nearestVantage.siteId) : null;
  const nearestDistance = coordinate && nearestVantage ? distanceMeters(coordinate, nearestVantage.coordinate) : null;

  return (
    <Screen scroll>
      <ScreenHeader
        canGoBack={false}
        eyebrow="Sākṣī"
        title="Witness"
        subtitle="Return to a fixed viewpoint, align, and record what is there today."
        rightAction={<SettingsButton />}
      />

      {/* Hero Quick Witness Card */}
      {nearestVantage ? (
        <View style={styles.heroCard}>
          {nearestSite && siteHeroImages[nearestSite.id] ? (
            <View style={styles.heroImageBanner}>
              <Image
                source={siteHeroImages[nearestSite.id]}
                style={styles.heroImage}
                resizeMode="cover"
              />
            </View>
          ) : null}
          <View style={styles.heroBody}>
            <View style={styles.heroHeader}>
              <Chip label="NEAREST VANTAGE" />
              {nearestDistance != null ? (
                <Text variant="mono" tone="sandstone" style={styles.heroDistance}>
                  {formatDistance(nearestDistance)}
                </Text>
              ) : null}
            </View>
            <Text variant="heading" style={styles.heroTitle}>
              {nearestSite?.name ?? 'Sacred Site'} — {nearestVantage.label}
            </Text>
            <Text variant="caption" tone="secondary" style={styles.heroSub}>
              Tolerance: ±{nearestVantage.positionToleranceM} m · ±{nearestVantage.bearingToleranceDeg}°
            </Text>
            <Button
              label="Align & Witness Now"
              onPress={() =>
                router.push({
                  pathname: '/(main)/sakshi/vantage',
                  params: { vantageId: nearestVantage.id },
                })
              }
            />
          </View>
        </View>
      ) : null}

      {/* Segmented Mobile Tab Navigation Bar */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabItem, activeTab === 'vantages' && styles.tabItemActive]}
          onPress={() => setActiveTab('vantages')}
        >
          <Text variant="label" tone={activeTab === 'vantages' ? 'sandstone' : 'muted'} uppercase>
            Vantages ({vantages.length})
          </Text>
        </Pressable>
        {/*
          Then / Now sits in the middle because it is the one thing here that
          needs no equipment, no fix and no permission — it is what someone can
          look at the moment they open the surface. It had no entry point in
          Sākṣī at all before this: the comparison lived only behind Tīrtha → a
          site → then-now, three taps into a different surface, which is why the
          product's headline feature was the hardest thing here to find.
        */}
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

      {/* Tab Content 1: Vantages */}
      {activeTab === 'vantages' ? (
        <View style={styles.section}>
          <View style={styles.list}>
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
        </View>
      ) : null}

      {/* Tab Content 2: Then / Now */}
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
                    {/* The count is the honest measure of how deep the record
                        goes — one plate is a pair, three is a series. */}
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

      {/* Tab Content 3: Your Records */}
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

          {/*
            Practice and the register moved here from a third tab of their own.
            They belong beside the records they are a summary *of*, and a tab
            holding one card and two links was a tab most people never opened —
            which is how the site register came to be the least reachable thing
            in a surface built around going to sites.
          */}
          <PracticeSummaryCard summary={summary} />
          <Button
            label="Open complete site register"
            variant="secondary"
            onPress={() => router.push('/(main)/sakshi/register' as any)}
          />
          {/* Sits under the practice summary, not beside puṇya. The summary
              above is yours and unranked; this is the separate, openly
              competitive count of what has reached the shared record. */}
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

const assessmentTone: Record<ObservationAssessment, 'seeking' | 'resolved' | 'open'> = {
  unreviewed: 'seeking',
  'no-change': 'resolved',
  reported: 'open',
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
    marginTop: spacing.lg,
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
  observationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  observationText: { flexShrink: 1, gap: spacing.xxs },
});

