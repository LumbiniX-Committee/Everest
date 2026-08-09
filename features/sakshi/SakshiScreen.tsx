import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { EmptyState, ScreenHeader, SettingsButton } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { PracticeSummaryCard } from '@/components/practice';
import { demoVantages, findSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePractice } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { distanceMeters, formatDistance, formatTimestamp } from '@/utils';
import type { Observation, ObservationAssessment } from '@/types';

type TabMode = 'vantages' | 'records' | 'register';

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
        <Pressable
          style={[styles.tabItem, activeTab === 'records' && styles.tabItemActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text variant="label" tone={activeTab === 'records' ? 'sandstone' : 'muted'} uppercase>
            Records ({observations.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'register' && styles.tabItemActive]}
          onPress={() => setActiveTab('register')}
        >
          <Text variant="label" tone={activeTab === 'register' ? 'sandstone' : 'muted'} uppercase>
            Practice
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

      {/* Tab Content 2: Your Records */}
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
        </View>
      ) : null}

      {/* Tab Content 3: Practice & Register */}
      {activeTab === 'register' ? (
        <View style={styles.section}>
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
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: colors.sandstone,
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

