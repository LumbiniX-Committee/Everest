import { useEffect, useRef, useState } from 'react';
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
import { detectorMessage } from '@/core/vision/candidate';
import { findSite, findVantage } from '@/data';
import {
  conditionCategoryCopy,
  conditionSeverityCopy,
  conditionSubtypeCopy,
} from '@/i18n/condition';
import { formatVisitorCopy, visitorCopy, type VisitorCopyKey } from '@/i18n/visitor';
import { database } from '@/services';
import { useDamageDetector, scanToSuggestion, type YoloScanResult } from '@/services/ai/yoloEngine';
import { usePractice, usePreferences, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatBearing, formatCoordinate, formatDelta, formatDistance, formatTimestamp } from '@/utils';
import {
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
  const { preferences } = usePreferences();
  const language = preferences.interfaceLanguage;
  const t = (key: VisitorCopyKey) => visitorCopy(language, key);
  const { creditConditionReport } = useQuests();
  const detector = useDamageDetector();
  // Read stable fields instead of depending on the detector wrapper object.
  // The hook returns a fresh wrapper whenever its `scanning` state changes. If
  // the scan effect depends on that wrapper, calling scan triggers a render,
  // runs this effect's cleanup, and discards both the result and the final
  // loading-state update. The UI then spins forever even though inference
  // completed successfully.
  const detectorStatus = detector.status;
  const detectorScan = detector.scan;
  const detectorModel = detector.model;
  // The sentence shown when there is no scan is decided in
  // core/vision/candidate.ts, where the test harness covers it. It is null while
  // the detector can still work, and never empty when it cannot: silence was
  // what made a trained, bundled model look like a feature nobody had built.
  const detectorNote = language === 'en'
    ? detectorMessage(detector.status, detector.reason)
    : detector.status === 'unsupported'
      ? t('observation.detectorUnsupported')
      : detector.status === 'no-model'
        ? t('observation.detectorNoModel')
        : detector.status === 'error'
          ? t('observation.detectorError')
          : null;

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

  /**
   * The scan runs on arrival, once, without being asked.
   *
   * It replaces a button labelled "AI Scan", which put a decision in front of
   * someone who has just taken a photograph of a crack and has no way to know
   * what pressing it would do. The photograph is here and the model is loaded;
   * the scan takes about a second and asserts nothing on its own. Waiting for
   * permission to look was ceremony.
   *
   * Nothing is filed by this. The model offers a candidate and the surveyor
   * confirms it, which is the invariant the whole surface rests on.
   */
  const scanned = useRef(false);
  useEffect(() => {
    if (scanned.current || detectorStatus !== 'ready' || !observation?.photoUri) return;
    scanned.current = true;
    let active = true;
    setYoloScanning(true);
    detectorScan(observation.photoUri)
      .then((result) => {
        if (active) setYoloResult(result);
      })
      .catch(() => {
        if (active) {
          setYoloResult({
            status: 'error',
            detections: [],
            inferenceMs: null,
            model: detectorModel,
            error: visitorCopy(language, 'observation.scanFailed'),
          });
        }
      })
      .finally(() => {
        if (active) setYoloScanning(false);
      });
    return () => {
      active = false;
    };
  }, [detectorModel, detectorScan, detectorStatus, language, observation?.photoUri]);

  const recordNoChange = async () => {
    if (!observation || submitting) return;
    setSubmitting(true);
    setSaveError(null);
    try {
      await database.setObservationAssessment(observation.id, 'no-change');
      setObservation({ ...observation, assessment: 'no-change' });
      await acknowledge(observation);
    } catch {
      setSaveError(t('observation.saveFailed'));
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
        // Carried through, at last. The column, the migration and the sheet's
        // banner all existed; the flag was dropped at this one hop, so every
        // model-assisted report was stored as though a person had written it
        // unaided. Provenance that is recorded everywhere except where it is
        // saved is not recorded.
        aiAssisted: draft.aiAssisted,
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
      setSaveError(t('observation.saveFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <Screen>
        <LoadingState label={t('observation.reading')} />
      </Screen>
    );
  }

  if (!observation) {
    return (
      <Screen>
        <EmptyState
          title={t('observation.missingTitle')}
          body={t('observation.missingBody')}
          actionLabel={t('capture.back')}
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
            {t('observation.record')}
          </Text>
          <Chip
            label={(withinTolerance ? t('observation.aligned') : t('observation.byEye')).toUpperCase()}
            selected={withinTolerance}
          />
        </View>
        <Text variant="title">{site?.name ?? observation.siteId}</Text>
        <Text variant="body" tone="secondary">
          {vantage?.label ?? observation.vantageId} · {formatTimestamp(observation.capturedAt)}
        </Text>
      </View>

      <View style={styles.featureBar}>
        <Button
          label={t('observation.compare')}
          variant="secondary"
          onPress={() => router.push('/(main)/sakshi')}
          style={styles.featureBtn}
        />
      </View>

      {/* Observation Photo with Floating Telemetry HUD */}
      <View style={styles.photoWrap}>
        <Image
          source={{ uri: observation.photoUri }}
          style={styles.photo}
          resizeMode="cover"
          accessibilityLabel={formatVisitorCopy(language, 'observation.photoLabel', {
            date: formatTimestamp(observation.capturedAt),
          })}
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

      {/*
        What the scan found, or why there was none.
        
        The third branch is the one that was missing. This rendered `null` when
        the detector was unavailable, so a build without the native runtime
        showed no scan, no boxes and no explanation, and the trained model
        looked like something nobody had written.
      */}
      <View style={styles.aiRow}>
        {yoloScanning ? (
          <LoadingState label={t('observation.scanning')} fill={false} />
        ) : yoloResult ? (
          <PathologySummaryCard
            result={yoloResult}
            onApplyAiSuggestion={(res) => {
              const suggestion = scanToSuggestion(res);
              if (!suggestion) return;
              setAiDraft(suggestion);
              setSheetOpen(true);
            }}
          />
        ) : detectorNote ? (
          <Text variant="caption" tone="secondary">
            {detectorNote} {t('observation.manualFallback')}
          </Text>
        ) : null}
      </View>

      {/* Vantage Time Series Scrubber */}
      {seriesObservations.length > 0 ? (
        <View style={styles.section}>
          <TimeSeriesScrubber
            observations={seriesObservations}
            vantageLabel={vantage?.label ?? t('observation.series')}
          />
        </View>
      ) : null}

      <Divider />

      <View style={styles.meta}>
        <Text variant="label" tone="muted" uppercase>
          {t('observation.accuracy')}
        </Text>
        {framedByEye ? (
          <>
            <MetaRow label={t('observation.alignment')} value={t('capture.framedByEye')} tone="seeking" />
            {observation.alignScore != null ? (
              <MetaRow label={t('observation.alignScore')} value={observation.alignScore.toFixed(2)} tone="seeking" />
            ) : null}
            <Text variant="caption" tone="secondary" style={styles.accuracyNote}>
              {t('observation.byEyeNote')}
            </Text>
          </>
        ) : (
          <>
            <MetaRow
              label={t('capture.positionError')}
              value={formatDistance(observation.positionErrorM)}
              tone={withinTolerance ? 'locked' : 'seeking'}
            />
            <MetaRow
              label={t('capture.bearingError')}
              value={`${observation.bearingErrorDeg!.toFixed(1)}°`}
              tone={withinTolerance ? 'locked' : 'seeking'}
            />
            <Text variant="caption" tone="secondary" style={styles.accuracyNote}>
              {withinTolerance
                ? t('observation.withinTolerance')
                : t('observation.outsideTolerance')}
            </Text>
          </>
        )}
      </View>

      <Divider />

      {observation.assessment === 'unreviewed' ? (
        <View style={styles.choice}>
          <Text variant="heading">{t('observation.whatNotice')}</Text>
          <Text variant="body" tone="secondary">
            {t('observation.noticeBody')}
          </Text>
          {saveError ? (
            <Text variant="caption" tone="open">
              {saveError}
            </Text>
          ) : null}
          <View style={styles.choiceActions}>
            <Button
              label={t('observation.nothingChanged')}
              variant="secondary"
              loading={submitting}
              onPress={recordNoChange}
            />
            <Button
              label={t('observation.somethingChanged')}
              disabled={submitting}
              onPress={() => setSheetOpen(true)}
            />
          </View>
        </View>
      ) : (
        <View style={styles.choice}>
          <Text variant="label" tone="muted" uppercase>
            {t('observation.finding')}
          </Text>
          {observation.assessment === 'no-change' ? (
            <Text variant="body">
              {t('observation.stableRecorded')}
            </Text>
          ) : (
            reports.map((report) => (
              <View key={report.id} style={styles.report}>
                <Text variant="heading">{conditionCategoryCopy(language, report.category)}</Text>
                <Text variant="body" tone="secondary">
                  {conditionSubtypeCopy(language, report.subtype)} · {conditionSeverityCopy(language, report.severity)}
                </Text>
                {report.note ? (
                  <Text variant="body" tone="secondary" style={styles.reportNote} translate={false}>
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
          label={t('observation.status')}
          value={observation.synced ? t('observation.synced') : t('observation.localOnly')}
          mono={false}
          tone={observation.synced ? 'resolved' : 'seeking'}
        />
      </View>

      {/* Puṇya acknowledgement card */}
      {observation.assessment !== 'unreviewed' ? (
        <View style={styles.complete}>
          <Text variant="title" center>
            {t('observation.witnessed')}
          </Text>
          <Text variant="body" tone="secondary" center>
            {formatVisitorCopy(language, 'observation.witnessedBody', {
              site: site?.name ?? t('observation.thisSite'),
            })}
          </Text>

          {merit ? <MeritAcknowledgement event={merit} /> : null}

          {!merit && summary.dayComplete ? (
            <View style={styles.enough}>
              <Text variant="bodyLarge" center>
                {t('observation.enoughToday')}
              </Text>
              <Text variant="caption" tone="secondary" center>
                {t('observation.meritRests')}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.actions}>
        {observation.assessment !== 'unreviewed' ? (
          <Button
            label={t('observation.openSiteRecord')}
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
        <Button label={t('observation.done')} block onPress={() => router.replace('/(main)/sakshi')} />
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
