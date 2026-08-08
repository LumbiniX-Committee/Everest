import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Button, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { ConditionReportForm, TimeSeriesScrubber } from '@/components';
import { EmptyState } from '@/components/common';
import { findSite, findVantage } from '@/data';
import { database } from '@/services';
import { colors, radii, spacing } from '@/theme';
import { formatBearing, formatCoordinate, formatDelta, formatDistance, formatTimestamp } from '@/utils';
import type { Observation } from '@/types';

type LoadState = 'loading' | 'ready' | 'missing';

/**
 * A recorded observation.
 *
 * Presented as a record rather than a photo post: the image, then the
 * measurements that make it comparable, then its sync state. The errors at
 * capture are shown, not hidden — an observation taken 1.4 m off the vantage is
 * still useful, but only if the next person knows it was.
 */
export function ObservationScreen({ observationId }: { observationId: string }) {
  const router = useRouter();
  const [observation, setObservation] = useState<Observation | null>(null);
  const [status, setStatus] = useState<LoadState>('loading');

  useEffect(() => {
    let active = true;

    database
      .getObservation(observationId)
      .then((found) => {
        if (!active) return;
        setObservation(found);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStatus('missing');
      });

    return () => {
      active = false;
    };
  }, [observationId]);

  if (status === 'loading') {
    return (
      <Screen>
        <View style={styles.loading}>
          <Text variant="caption" tone="muted">
            Reading the record…
          </Text>
        </View>
      </Screen>
    );
  }

  if (!observation) {
    return (
      <Screen>
        <EmptyState
          title="Observation not found"
          body="It is not in the local record. If it was recorded on another device, it will appear once syncing exists."
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const vantage = findVantage(observation.vantageId);
  const site = findSite(observation.siteId);
  const withinTolerance =
    vantage != null &&
    observation.positionErrorM <= vantage.positionToleranceM &&
    observation.bearingErrorDeg <= vantage.bearingToleranceDeg;

  const [seriesObservations, setSeriesObservations] = useState<Observation[]>([]);
  const [showConditionForm, setShowConditionForm] = useState(false);

  useEffect(() => {
    if (!observation) return;
    database.listObservations(observation.vantageId).then(setSeriesObservations).catch(() => {});
  }, [observation]);

  if (showConditionForm && observation) {
    return (
      <Screen scroll>
        <ConditionReportForm
          siteId={observation.siteId}
          vantageId={observation.vantageId}
          observationId={observation.id}
          onSubmitReport={() => setShowConditionForm(false)}
          onNoChangeReport={() => setShowConditionForm(false)}
          onSkip={() => setShowConditionForm(false)}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          Observation
        </Text>
        <Text variant="title">{site?.name ?? observation.siteId}</Text>
        <Text variant="body" tone="secondary">
          {vantage?.label ?? observation.vantageId}
        </Text>
      </View>

      <Image
        source={{ uri: observation.photoUri }}
        style={styles.photo}
        resizeMode="cover"
        accessibilityLabel={`Observation recorded ${formatTimestamp(observation.capturedAt)}`}
      />

      <View style={styles.meta}>
        <MetaRow label="Recorded" value={formatTimestamp(observation.capturedAt)} />
        <MetaRow label="Position" value={formatCoordinate(observation.coordinate)} />
        <MetaRow label="Bearing" value={formatBearing(observation.bearing)} />
        <MetaRow label="Tilt" value={formatDelta(observation.pitch)} />
      </View>

      <Divider />

      {/* Task 3.4: Condition Reporting Form Access */}
      <View style={styles.actions}>
        <Button
          label="Add Structured Condition Report"
          variant="secondary"
          onPress={() => setShowConditionForm(true)}
        />
      </View>

      <Divider />

      {/* Task 3.6: Vantage Time Series Scrubber */}
      {seriesObservations.length > 0 ? (
        <TimeSeriesScrubber
          observations={seriesObservations}
          vantageLabel={vantage?.label ?? 'Vantage Series'}
        />
      ) : null}

      <Divider />

      <View style={styles.meta}>
        <Text variant="label" tone="muted" uppercase>
          Accuracy at capture
        </Text>
        <MetaRow
          label="Position error"
          value={formatDistance(observation.positionErrorM)}
          tone={withinTolerance ? 'locked' : 'seeking'}
        />
        <MetaRow
          label="Bearing error"
          value={`${observation.bearingErrorDeg.toFixed(1)}°`}
          tone={withinTolerance ? 'locked' : 'seeking'}
        />
        <Text variant="caption" tone="secondary" style={styles.accuracyNote}>
          {withinTolerance
            ? 'Within the vantage tolerance. This frame is directly comparable with the rest of the series.'
            : 'Outside the vantage tolerance. Still part of the record, but flag it when comparing.'}
        </Text>
      </View>

      <Divider />

      <View style={styles.meta}>
        <MetaRow
          label="Status"
          value={observation.synced ? 'Synced' : 'On this device only'}
          mono={false}
          tone={observation.synced ? 'resolved' : 'seeking'}
        />
      </View>

      <View style={styles.actions}>
        <Button label="Done" block onPress={() => router.replace('/(main)/sakshi')} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  meta: { paddingVertical: spacing.lg, gap: spacing.xxs },
  accuracyNote: { paddingTop: spacing.sm },
  actions: { paddingTop: spacing.lg },
});
