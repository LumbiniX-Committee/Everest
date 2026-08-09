import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Button, Chip, Divider, Icon, MetaRow, Screen, Text } from '@/components/ui';
import { TimeSeriesScrubber } from '@/components';
import { EmptyState, LoadingState } from '@/components/common';
import {
  ConditionSheet,
  type ConditionDraft,
  YoloVisionOverlay,
  PathologySummaryCard,
} from '@/components/observation';
import { MeritAcknowledgement } from '@/components/practice';
import { findSite, findVantage } from '@/data';
import { database } from '@/services';
import { useDamageDetector, scanToSuggestion, type YoloScanResult } from '@/services/ai/yoloEngine';
import { usePractice, useQuests } from '@/store';
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
 * Presented as a record with visual HUD badges, direct 1899 heritage reconstruction overlay,
 * and AI damage inspection.
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
  /** How many quest tasks the last report satisfied. Null until one is filed. */
  const [questsCredited, setQuestsCredited] = useState<number | null>(null);
  const [seriesObservations, setSeriesObservations] = useState<Observation[]>([]);
  const [yoloResult, setYoloResult] = useState<YoloScanResult | null>(null);
  const [yoloScanning, setYoloScanning] = useState(false);
  const [aiDraft, setAiDraft] = useState<Partial<ConditionDraft> | undefined>(undefined);
  const { recognise, summary } = usePractice();
  const { creditConditionReport } = useQuests();
  const detector = useDamageDetector();
  const aiAvailable = detector.status !== 'no-model' && detector.status !== 'unsupported';

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

  useEffect(() => {
    if (!observation) return;
    database.listObservations(observation.vantageId).then(setSeriesObservations).catch(() => {});
  }, [observation]);

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

      // A report is a side quest completing itself. Every seeded quest ends
      // with a condition_report task naming a site, and until now filing one
      // left the person to go and tick a box claiming they had done the thing
      // they had just done. Credited after the report is safely stored, never
      // before — a tick that outlives the record it stands for is worse than
      // an untidy quest screen.
      const credited = await creditConditionReport(observation.siteId).catch(() => 0);
      setQuestsCredited(credited);

      await acknowledge(observation);
    } catch {
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
  const framedByEye =
    observation.gateMode === 'manual' ||
    observation.positionErrorM == null ||
    observation.bearingErrorDeg == null;
  const withinTolerance =
    !framedByEye &&
    vantage != null &&
    observation.positionErrorM! <= vantage.positionToleranceM &&
    observation.bearingErrorDeg! <= vantage.bearingToleranceDeg;

  return (
    <Screen scroll>
      <View style={styles.head}>
        <View style={styles.headRow}>
          <Text variant="label" tone="muted" uppercase>
            Observation Record
          </Text>
          <Chip label={withinTolerance ? 'ALIGNED' : 'BY EYE'} selected={withinTolerance} />
        </View>
        <Text variant="title">{site?.name ?? observation.siteId}</Text>
        <Text variant="body" tone="secondary">
          {vantage?.label ?? observation.vantageId} · {formatTimestamp(observation.capturedAt)}
        </Text>
      </View>

      {/* Feature Action Bar */}
      <View style={styles.featureBar}>
        <Button
          label="⏳ Compare Then / Now"
          variant="secondary"
          onPress={() => router.push('/(main)/sakshi')}
          style={styles.featureBtn}
        />
        {aiAvailable ? (
          <Button
            label={yoloScanning ? 'Scanning…' : '🤖 AI Scan'}
            variant="secondary"
            loading={yoloScanning}
            onPress={async () => {
              setYoloScanning(true);
              const result = await detector.scan(observation.photoUri);
              setYoloResult(result);
              setYoloScanning(false);
            }}
            style={styles.featureBtn}
          />
        ) : null}
      </View>

      {/* Observation Photo with Floating Telemetry HUD */}
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: observation.photoUri }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel={`Observation recorded ${formatTimestamp(observation.capturedAt)}`}
        />
        {yoloResult && yoloResult.detections.length > 0 ? (
          <YoloVisionOverlay detections={yoloResult.detections} />
        ) : null}

        {/* Floating Telemetry HUD */}
        <View style={styles.hudOverlay}>
          <View style={styles.hudBadge}>
            <Icon name="crosshairs-gps" size={13} color={colors.surface} />
            <Text variant="mono" style={styles.hudText}>
              {formatDistance(observation.positionErrorM)}
            </Text>
          </View>
          <View style={styles.hudBadge}>
            <Icon name="compass-outline" size={13} color={colors.surface} />
            <Text variant="mono" style={styles.hudText}>
              {formatBearing(observation.bearing)}
            </Text>
          </View>
        </View>
      </View>

      {/* On-device damage detection summary */}
      {yoloResult ? (
        <View style={styles.aiRow}>
          <PathologySummaryCard
            result={yoloResult}
            onApplyAiSuggestion={(res) => {
              const suggestion = scanToSuggestion(res);
              if (!suggestion) return;
              setAiDraft(suggestion);
              setSheetOpen(true);
            }}
          />
        </View>
      ) : null}

      {/* Vantage Time Series Scrubber */}
      {seriesObservations.length > 0 ? (
        <View style={styles.section}>
          <TimeSeriesScrubber
            observations={seriesObservations}
            vantageLabel={vantage?.label ?? 'Vantage Series'}
          />
        </View>
      ) : null}

      <Divider />

      <View style={styles.meta}>
        <Text variant="label" tone="muted" uppercase>
          Accuracy at capture
        </Text>
        {framedByEye ? (
          <>
            <MetaRow label="Alignment" value="Framed by eye" tone="seeking" />
            {observation.alignScore != null ? (
              <MetaRow label="Align score" value={observation.alignScore.toFixed(2)} tone="seeking" />
            ) : null}
            <Text variant="caption" tone="secondary" style={styles.accuracyNote}>
              Framed by eye — not measured within the vantage tolerance. It is part of the record,
              but is not directly comparable frame-to-frame the way an aligned capture is.
            </Text>
          </>
        ) : (
          <>
            <MetaRow
              label="Position error"
              value={formatDistance(observation.positionErrorM)}
              tone={withinTolerance ? 'locked' : 'seeking'}
            />
            <MetaRow
              label="Bearing error"
              value={`${observation.bearingErrorDeg!.toFixed(1)}°`}
              tone={withinTolerance ? 'locked' : 'seeking'}
            />
            <Text variant="caption" tone="secondary" style={styles.accuracyNote}>
              {withinTolerance
                ? 'Within the vantage tolerance. This frame is directly comparable with the rest of the series.'
                : 'Outside the vantage tolerance. Still part of the record, but flag it when comparing.'}
            </Text>
          </>
        )}
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

      {/* Puṇya acknowledgement card */}
      {observation.assessment !== 'unreviewed' ? (
        <View style={styles.complete}>
          <Text variant="title" center>
            Witnessed
          </Text>
          <Text variant="body" tone="secondary" center>
            This frame joins the record for {site?.name ?? 'this site'}. Someone comparing it in ten
            years will know exactly where you stood.
          </Text>

          {merit ? <MeritAcknowledgement event={merit} /> : null}

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
        onClose={() => {
          setSheetOpen(false);
          setAiDraft(undefined);
        }}
        onSubmit={recordCondition}
        submitting={submitting}
        initialDraft={aiDraft}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.md, paddingBottom: spacing.sm, gap: spacing.xxs },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  featureBar: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  featureBtn: {
    flex: 1,
  },
  photoWrap: {
    position: 'relative',
    borderRadius: radii.lg,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  photo: {
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  hudOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  hudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  hudText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: { paddingVertical: spacing.md },
  aiRow: { paddingVertical: spacing.sm },
  choice: { paddingVertical: spacing.lg, gap: spacing.md },
  choiceActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  report: { gap: spacing.xxs },
  reportNote: { marginTop: spacing.xs },
  complete: { paddingVertical: spacing.xl, gap: spacing.base },
  enough: { gap: spacing.xs, paddingTop: spacing.sm },
  actions: { paddingTop: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  meta: { paddingVertical: spacing.lg, gap: spacing.xxs },
  accuracyNote: { paddingTop: spacing.sm },
});
