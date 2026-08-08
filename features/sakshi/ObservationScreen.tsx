import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Button, Divider, MetaRow, Screen, Text } from '@/components/ui';
<<<<<<< HEAD
import { ConditionReportForm, TimeSeriesScrubber } from '@/components';
import { EmptyState } from '@/components/common';
=======
import { EmptyState, LoadingState } from '@/components/common';
import { ConditionSheet, type ConditionDraft } from '@/components/observation';
import { MeritAcknowledgement } from '@/components/practice';
>>>>>>> origin/main
import { findSite, findVantage } from '@/data';
import { database } from '@/services';
import { usePractice } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatBearing, formatCoordinate, formatDelta, formatDistance, formatTimestamp } from '@/utils';
import {
  CONDITION_CATEGORY_LABELS,
  SEVERITY_LABELS,
  type ConditionReport,
  type MeritEvent,
  type Observation,
} from '@/types';

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
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [status, setStatus] = useState<LoadState>('loading');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [merit, setMerit] = useState<MeritEvent | null>(null);
  const { recognise, summary } = usePractice();

  useEffect(() => {
    let active = true;

    Promise.all([
      database.getObservation(observationId),
      database.listConditionReports(observationId),
    ])
      .then(([found, foundReports]) => {
        if (!active) return;
        setObservation(found);
        setReports(foundReports);
        setStatus(found ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStatus('missing');
      });

    return () => {
      active = false;
    };
  }, [observationId]);

  /**
   * "Nothing changed" is written, not merely skipped. A dated photograph with a
   * finding of stability attached is evidence; the same photograph with no
   * assessment is only a picture.
   */
  const recordNoChange = async () => {
    if (!observation || submitting) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      await database.setObservationAssessment(observation.id, 'no-change');
      setObservation({ ...observation, assessment: 'no-change' });
      await acknowledge(observation);
    } catch {
      setSaveError('That could not be saved. Your photograph is safe on this device.');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Recognition, after the finding is safely written.
   *
   * Its failure is swallowed on purpose. Puṇya is an acknowledgement of
   * something that has already been saved, so losing it costs the record
   * nothing — and an error about a merit event would tell the person their
   * observation failed when it did not.
   */
  const acknowledge = async (saved: Observation) => {
    try {
      const event = await recognise({
        kind: 'observation',
        siteId: saved.siteId,
        observationId: saved.id,
      });
      setMerit(event);
    } catch {
      setMerit(null);
    }
  };

  const recordCondition = async (draft: ConditionDraft) => {
    if (!observation || submitting) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      const report: ConditionReport = {
        id: `cond-${Date.now()}`,
        observationId: observation.id,
        siteId: observation.siteId,
        category: draft.category,
        subtype: draft.subtype,
        severity: draft.severity,
        note: draft.note,
        recordedAt: new Date().toISOString(),
        synced: false,
      };
      await database.insertConditionReport(report);
      setReports((previous) => [report, ...previous]);
      setObservation({ ...observation, assessment: 'reported' });
      setSheetOpen(false);
      await acknowledge(observation);
    } catch {
      // The sheet stays open so the person does not lose what they chose.
      setSaveError('That could not be saved. Your photograph is safe on this device.');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState label="Reading the record" />
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

      {observation.assessment === 'unreviewed' ? (
        <View style={styles.choice}>
          <Text variant="heading">What did you notice?</Text>
          <Text variant="body" tone="secondary">
            Both answers are worth recording. A series of frames where nothing changed is how
            stability gets established.
          </Text>
          {saveError ? (
            <Text variant="caption" tone="open">
              {saveError}
            </Text>
          ) : null}
          <View style={styles.choiceActions}>
            <Button
              label="Nothing changed"
              variant="secondary"
              loading={submitting}
              onPress={recordNoChange}
            />
            <Button
              label="Something changed"
              disabled={submitting}
              onPress={() => setSheetOpen(true)}
            />
          </View>
        </View>
      ) : (
        <View style={styles.choice}>
          <Text variant="label" tone="muted" uppercase>
            Your finding
          </Text>
          {observation.assessment === 'no-change' ? (
            <Text variant="body">
              Nothing had changed. Recorded as part of the series.
            </Text>
          ) : (
            reports.map((report) => (
              <View key={report.id} style={styles.report}>
                <Text variant="heading">{CONDITION_CATEGORY_LABELS[report.category]}</Text>
                <Text variant="body" tone="secondary">
                  {report.subtype} · {SEVERITY_LABELS[report.severity]}
                </Text>
                {report.note ? (
                  <Text variant="body" tone="secondary" style={styles.reportNote}>
                    “{report.note}”
                  </Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      )}

      <Divider />

      <View style={styles.meta}>
        <MetaRow
          label="Status"
          value={observation.synced ? 'Synced' : 'On this device only'}
          mono={false}
          tone={observation.synced ? 'resolved' : 'seeking'}
        />
      </View>

      {observation.assessment !== 'unreviewed' ? (
        <View style={styles.complete}>
          {/*
            The closing line. Deliberately terminal — §27 wants the app to
            encourage stopping, so the end of the witness loop reads as an
            ending rather than a prompt to go and do the next one.
          */}
          <Text variant="title" center>
            Witnessed
          </Text>
          <Text variant="body" tone="secondary" center>
            This frame joins the record for {site?.name ?? 'this site'}. Someone comparing it in ten
            years will know exactly where you stood.
          </Text>

          {merit ? <MeritAcknowledgement event={merit} /> : null}

          {/*
            Shown when the finding saved but no puṇya followed, because the
            day's practice was already complete. Stated as a closing rather
            than a refusal — the observation was recorded in full, and the
            only thing withheld is being told so again.
          */}
          {!merit && summary.dayComplete ? (
            <View style={styles.enough}>
              <Text variant="bodyLarge" center>
                You’ve done enough today.
              </Text>
              <Text variant="caption" tone="secondary" center>
                Your observation is recorded in full. Puṇya rests until tomorrow.
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {observation.assessment !== 'unreviewed' ? (
          <Button
            label="See this site's record"
            variant="secondary"
            block
            onPress={() =>
              router.push({
                pathname: '/(main)/sakshi/register/[siteId]',
                params: { siteId: observation.siteId },
              })
            }
          />
        ) : null}
        <Button label="Done" block onPress={() => router.replace('/(main)/sakshi')} />
      </View>

      <ConditionSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSubmit={recordCondition}
        submitting={submitting}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  choice: { paddingVertical: spacing.lg, gap: spacing.md },
  choiceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  report: { gap: spacing.xxs },
  reportNote: { marginTop: spacing.xs },
  complete: { paddingVertical: spacing.xl, gap: spacing.base },
  enough: { gap: spacing.xs, paddingTop: spacing.sm },
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.xs },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  meta: { paddingVertical: spacing.lg, gap: spacing.xxs },
  accuracyNote: { paddingTop: spacing.sm },
  actions: { paddingTop: spacing.lg, gap: spacing.md },
});
