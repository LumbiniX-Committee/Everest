import { useCallback, useState } from 'react';
import { useFocusEffect, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { EmptyState, ScreenHeader } from '@/components/common';
import { VantageListItem } from '@/components/site';
import { PracticeSummaryCard } from '@/components/practice';
import { demoVantages, findSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePractice } from '@/store';
import { spacing } from '@/theme';
import { distanceMeters, formatTimestamp } from '@/utils';
import type { Observation, ObservationAssessment } from '@/types';

/**
 * Sākṣī — the witnessing surface.
 *
 * Two halves: what you have already recorded, and where you could record next.
 * Your own record comes first. The point of the app is the series you are
 * building, not a catalogue of things to go and do.
 */
export function SakshiScreen() {
  const router = useRouter();
  const { coordinate } = useCurrentPosition({ watch: true });
  const [observations, setObservations] = useState<Observation[]>([]);
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
        .catch(() => {
          // A read failure leaves the previous list standing rather than
          // blanking a record the user knows they made.
        });
      // Re-read the summary too: the day may have rolled over while the app
      // sat in the background, and a stale "day complete" would tell someone
      // they were finished before they had begun.
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

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Sākṣī"
        title="Witness"
        subtitle="Return to a fixed viewpoint, align, and record what is there today."
      />

      <View style={styles.section}>
        <PracticeSummaryCard summary={summary} />
        <Button
          label="Open your register"
          variant="quiet"
          onPress={() => router.push('/(main)/sakshi/register' as any)}
        />
      </View>

      <View style={styles.section}>
        <Text variant="heading">Your record</Text>
        {observations.length === 0 ? (
          <EmptyState
            title="Nothing recorded yet"
            body="A series begins with one observation. Choose a vantage below and go and stand in it."
          />
        ) : (
          <View style={styles.list}>
            {observations.slice(0, 5).map((observation) => (
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

      <View style={styles.section}>
        <Text variant="heading">Vantage points</Text>
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
        {/*
          The assessment, not the sync state. Someone who pressed the shutter
          and then walked off has an unreviewed frame, and this row is the only
          route back to finishing it — sync status can wait for the detail
          screen.
        */}
        <Text variant="label" tone={assessmentTone[observation.assessment]} uppercase>
          {assessmentLabel[observation.assessment]}
        </Text>
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
  section: { paddingTop: spacing.lg, gap: spacing.md },
  list: { gap: spacing.md },
  observationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md },
  observationText: { flexShrink: 1, gap: spacing.xxs },
});
