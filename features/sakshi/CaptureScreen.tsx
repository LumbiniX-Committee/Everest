import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';

import { ThenNowCompare } from '@/components/thennow';
import { Button, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { Reticle } from '@/components/reticle';
import {
  findSite,
  findVantage,
  historicalImagesForSite,
  nowImageForSite,
} from '@/data';
import { useAlignment, useConfirmLeave, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { formatVisitorCopy, visitorCopy, type VisitorCopyKey } from '@/i18n/visitor';
import { camera as cameraService, database } from '@/services';
import { usePermission, usePreferences, useQuests } from '@/store';
import { colors, layers, radii, spacing } from '@/theme';
import {
  formatBearing,
  formatCoordinate,
  formatDelta,
  formatDistance,
  formatTimestamp,
} from '@/utils';
import type { Observation } from '@/types';

type CaptureDraft = {
  observation: Observation;
  sourceUri: string;
};

type ReferenceResult = {
  vantageId: string;
  observation: Observation | null;
};

/**
 * Capture.
 *
 * The camera is full-bleed with the reticle over it; alignment keeps running
 * while the shutter is live, because a person can drift out of tolerance
 * between arriving and pressing the button.
 *
 * The shutter stays enabled once aligned rather than re-locking on every jitter
 * — a control that flickers between enabled and disabled is unusable at arm's
 * length. Whatever the readings were at the moment of capture is what gets
 * written to the record, drift included, so the observation is honest about its
 * own accuracy.
 *
 * Damage detection is not here. It belongs to the recorded photograph, where the
 * model runs on a real, saved image the surveyor can inspect — not on a jittering
 * live frame. See ObservationScreen.
 */
/** A correction for compass drift, not a way to reach any bearing. */
const MAX_NUDGE_DEG = 15;
const AUTO_CAPTURE_HOLD_MS = 1500;

export function CaptureScreen({ vantageId }: { vantageId: string }) {
  const router = useRouter();
  const goBack = useSafeBack();
  const ui = useVisitorLiteralCopy();
  const vantage = findVantage(vantageId);
  const site = vantage ? findSite(vantage.siteId) : undefined;
  const { state: cameraPermission, request: requestCamera, openSettings } = usePermission('camera');
  const { preferences } = usePreferences();
  const t = (key: VisitorCopyKey) => visitorCopy(preferences.interfaceLanguage, key);
  const { creditVantageObservation } = useQuests();
  const [nudgeDeg, setNudgeDeg] = useState(0);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [referenceResult, setReferenceResult] = useState<ReferenceResult | null>(null);

  const alignment = useAlignment({ vantage, nudgeDeg, active: draft == null });
  const cameraRef = useRef<CameraView>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A taken photograph is only on screen until it is saved.
  useConfirmLeave(draft != null && !saving);

  useEffect(() => {
    let active = true;
    if (!vantage) {
      return () => {
        active = false;
      };
    }

    database
      .listObservations(vantage.id)
      .then((observations) => {
        if (active) {
          setReferenceResult({ vantageId: vantage.id, observation: observations[0] ?? null });
        }
      })
      .catch(() => {
        if (active) setReferenceResult({ vantageId: vantage.id, observation: null });
      });

    return () => {
      active = false;
    };
  }, [vantage]);

  // Auto-capture: a lock must hold for a moment, so passing through one does not fire.
  const autoCaptureRef = useRef<(() => void) | null>(null);
  const isLocked = alignment.phase === 'locked';
  useEffect(() => {
    if (!preferences.autoCapture || !isLocked || draft != null) return;
    const timer = setTimeout(() => autoCaptureRef.current?.(), AUTO_CAPTURE_HOLD_MS);
    return () => clearTimeout(timer);
  }, [preferences.autoCapture, isLocked, draft]);

  if (!vantage) {
    return (
      <Screen>
        <EmptyState
          title={t('capture.noVantageTitle')}
          body={t('capture.noVantageBody')}
          actionLabel={t('capture.back')}
          onAction={goBack}
        />
      </Screen>
    );
  }

  if (cameraPermission.status !== 'granted') {
    return (
      <Screen>
        <View style={styles.gate}>
          <Reticle size={140} phase="unavailable" />
          <Text variant="title" center>
            {t('capture.cameraTitle')}
          </Text>
          <Text variant="body" tone="secondary" center>
            {t('capture.cameraBody')}
          </Text>
          {cameraPermission.status === 'blocked' ? (
            <Button label={t('capture.openSettings')} onPress={openSettings} />
          ) : (
            <Button label={t('capture.allowCamera')} onPress={requestCamera} />
          )}
          <Button label={t('capture.back')} variant="quiet" onPress={goBack} />
        </View>
      </Screen>
    );
  }

  const onCapture = async (mode: 'aligned' | 'manual', isNoChange = false) => {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const captureOptions = cameraService.getCaptureOptions(preferences.photoQuality);
      const photo = await cameraRef.current?.takePictureAsync(captureOptions);
      if (!photo?.uri) throw new Error(t('capture.cameraNoImage'));

      // Freeze the record at the shutter. The live sensors keep moving while a
      // person reviews the frame, so reading them again at submit time would
      // attach a later position and orientation to an earlier photograph.
      const id = `obs-${Date.now()}`;
      // Decided from the live state at the shutter, not from how this screen was
      // opened. A corrected compass or a demo position cannot claim a measured lock.
      const aligned =
        mode === 'aligned' && alignment.phase === 'locked' && nudgeDeg === 0 && !alignment.isDemo;
      const unmeasured: NonNullable<Observation['unmeasured']> = [];
      if (alignment.coordinate == null) unmeasured.push('coordinate');
      if (alignment.heading == null) unmeasured.push('bearing');
      if (alignment.pitch == null) unmeasured.push('pitch');
      const observation: Observation = {
        id,
        vantageId: vantage.id,
        siteId: vantage.siteId,
        capturedAt: new Date().toISOString(),
        // This camera-cache URI remains a draft until explicit submission.
        photoUri: photo.uri,
        // The observer's real fix, not the catalogued vantage. With no reading the
        // field holds the vantage's value only to satisfy the local column, and
        // `unmeasured` says so everywhere it is shown or sent.
        coordinate: alignment.coordinate ?? vantage.coordinate,
        // Use the exact readings that fed the reticle. Reconstructing orientation
        // from a delta is wrong while the person is still walking to the mark,
        // because the alignment target at that point is the direction of travel.
        bearing: alignment.heading ?? vantage.bearing,
        pitch: alignment.pitch ?? vantage.pitch,
        // Real measurements only for an aligned capture. A by-eye frame records
        // null, never a zero that would read as perfect accuracy.
        positionErrorM: aligned ? alignment.distanceM : null,
        bearingErrorDeg: aligned && alignment.bearingDeltaDeg != null
          ? Math.abs(alignment.bearingDeltaDeg)
          : null,
        alignScore:
          alignment.coordinate != null && alignment.heading != null
            ? alignment.alignScore
            : null,
        gpsAccuracyM: alignment.gpsAccuracyM,
        gateMode: aligned ? 'aligned' : 'manual',
        unmeasured,
        isDemo: alignment.isDemo,
        headingNudgeDeg: nudgeDeg,
        note: isNoChange ? 'Nothing has changed: verified stability.' : undefined,
        assessment: 'unreviewed',
        synced: false,
      };

      setDraft({ observation, sourceUri: photo.uri });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('capture.failed'));
    } finally {
      setSaving(false);
    }
  };

  const submitDraft = async () => {
    if (!draft || saving) return;
    setSaving(true);
    setError(null);

    try {
      // Persist the frame out of the camera cache before the local row exists.
      // A retry reuses an already-copied file, so a database failure cannot turn
      // the submit button into a permanent "destination already exists" error.
      const dir = `${FileSystem.documentDirectory}observations/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const dest = `${dir}${draft.observation.id}.jpg`;
      const existing = await FileSystem.getInfoAsync(dest);
      if (!existing.exists) {
        await FileSystem.copyAsync({ from: draft.sourceUri, to: dest });
      }

      const observation = { ...draft.observation, photoUri: dest };
      await database.insertObservation(observation);
      // A demo capture is practice, so it advances nothing real.
      if (!observation.isDemo) await creditVantageObservation(vantage.id);
      router.replace({
        pathname: '/visit/observation',
        params: { observationId: observation.id },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t('capture.submitFailed'));
    } finally {
      setSaving(false);
    }
  };

  // Charter #8: capture is hard-disabled where photography is not permitted.
  if (site && site.photography && site.photography !== 'allowed') {
    return (
      <Screen>
        <View style={styles.gate}>
          <Reticle size={140} phase="unavailable" />
          <Text variant="title" center>
            {formatVisitorCopy(preferences.interfaceLanguage, 'capture.photographyTitle', {
              status: site.photography,
            })}
          </Text>
          <Text variant="body" tone="secondary" center>
            {formatVisitorCopy(preferences.interfaceLanguage, 'capture.photographyBody', {
              site: site.name,
              status: site.photography,
            })}
          </Text>
          <Button label={t('capture.back')} onPress={goBack} />
        </View>
      </Screen>
    );
  }

  const locked = alignment.phase === 'locked';

  if (draft) {
    const referenceObservation =
      referenceResult?.vantageId === vantage.id ? referenceResult.observation : null;
    const historical = historicalImagesForSite(vantage.siteId).find(
      (image) => image.vantageId === vantage.id,
    );
    const bundledReference = nowImageForSite(vantage.siteId);
    const reference = referenceObservation
      ? {
          image: referenceObservation.photoUri,
          date: t('capture.previous'),
          note: formatVisitorCopy(preferences.interfaceLanguage, 'capture.previousNote', {
            date: formatTimestamp(referenceObservation.capturedAt),
          }),
        }
      : historical
        ? {
            image: historical.image,
            date: historical.date,
            tier: historical.evidenceTier,
            note: historical.viewpointConfirmed
              ? t('capture.historicalMatched')
              : t('capture.historicalApprox'),
          }
        : {
            image: bundledReference,
            date: t('capture.siteReference'),
            note: bundledReference
              ? t('capture.siteReferenceNote')
              : t('capture.noReference'),
          };

    return (
      <Screen scroll>
        <View style={styles.reviewHead}>
          <Text variant="label" tone="muted" uppercase>
            {t('capture.compare')}
          </Text>
          <Text variant="title">{t('capture.reviewTitle')}</Text>
          <Text variant="body" tone="secondary">
            {t('capture.reviewBody')}
          </Text>
        </View>

        <ThenNowCompare
          then={{
            image: reference.image,
            date: reference.date,
            placeholderNote: reference.note,
            tier: 'tier' in reference ? reference.tier : undefined,
          }}
          now={{ image: draft.sourceUri, date: t('capture.capturedNow') }}
          aspectRatio={3 / 4}
        />

        <Text variant="caption" tone="secondary" style={styles.referenceNote}>
          {reference.note}
        </Text>

        <Divider />

        <View style={styles.submission}>
          <Text variant="heading">{t('capture.submissionData')}</Text>
          <Text variant="body" tone="secondary">
            {t('capture.queued')}
          </Text>
          <View style={styles.telemetry}>
            <MetaRow label={t('capture.captured')} value={formatTimestamp(draft.observation.capturedAt)} />
            <MetaRow
              label={t('capture.mode')}
              value={draft.observation.gateMode === 'aligned' ? t('capture.measuredAlignment') : t('capture.framedByEye')}
              mono={false}
              tone={draft.observation.gateMode === 'aligned' ? 'locked' : 'seeking'}
            />
            <MetaRow label={t('capture.position')} value={draft.observation.unmeasured?.includes('coordinate') ? ui('Not measured') : formatCoordinate(draft.observation.coordinate)} />
            <MetaRow
              label={t('capture.gpsAccuracy')}
              value={formatDistance(draft.observation.gpsAccuracyM ?? null)}
            />
            <MetaRow label={t('capture.bearing')} value={draft.observation.unmeasured?.includes('bearing') ? ui('Not measured') : formatBearing(draft.observation.bearing)} />
            <MetaRow label={t('capture.pitch')} value={draft.observation.unmeasured?.includes('pitch') ? ui('Not measured') : formatDelta(draft.observation.pitch)} />
            <MetaRow
              label={t('capture.positionError')}
              value={formatDistance(draft.observation.positionErrorM)}
            />
            <MetaRow
              label={t('capture.bearingError')}
              value={formatDelta(draft.observation.bearingErrorDeg)}
            />
            <MetaRow
              label={t('capture.alignmentScore')}
              value={draft.observation.alignScore?.toFixed(2) ?? t('capture.notMeasured')}
            />
          </View>

          {error ? (
            <Text variant="caption" tone="open">
              {error}
            </Text>
          ) : null}

          <View style={styles.reviewActions}>
            <Button
              label={t('capture.retake')}
              variant="secondary"
              disabled={saving}
              onPress={() => {
                setDraft(null);
                setError(null);
              }}
            />
            <Button
              label={t('capture.submit')}
              loading={saving}
              onPress={submitDraft}
              accessibilityHint={t('capture.submitHint')}
            />
          </View>
        </View>
      </Screen>
    );
  }

  // Armed only here, past the permission and photography checks above.
  autoCaptureRef.current = () => void onCapture('aligned');

  return (
    <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
      <View style={styles.viewfinder}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top Floating Mobile Status Bar */}
        <View style={styles.topHud}>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text variant="body">‹ {t('capture.back')}</Text>
          </Pressable>
        </View>

        {/* Center Alignment Reticle HUD */}
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <Reticle size={240} progress={alignment.progress} phase={alignment.phase} />
        </View>
      </View>

      {/* Floating Bottom Control Deck */}
      <View style={styles.controls}>
        <View style={styles.readoutRow}>
          <Text variant="mono" tone={locked ? 'locked' : 'seeking'}>
            {formatDistance(alignment.distanceM)}
          </Text>
          <Text variant="mono" tone={locked ? 'locked' : 'seeking'}>
            {formatDelta(alignment.bearingDeltaDeg)}
          </Text>
          <Text variant="mono" tone="secondary">
            {formatBearing(vantage.bearing)}
          </Text>
        </View>

        {/* Manual Compass Heading Nudge */}
        {nudgeDeg !== 0 ? (
          <Text variant="caption" tone="seeking" center>
            With a corrected compass, this photograph is saved as framed by eye.
          </Text>
        ) : null}
        <View style={styles.nudgeRow}>
          <Button
            label={t('capture.nudgeMinus')}
            variant="quiet"
            onPress={() => setNudgeDeg((prev) => Math.max(prev - 5, -MAX_NUDGE_DEG))}
          />
          <Text variant="mono" tone="secondary">
            {nudgeDeg === 0
              ? `${t('capture.compass')} 0°`
              : `${nudgeDeg > 0 ? '+' : ''}${nudgeDeg}°`}
          </Text>
          <Button
            label={t('capture.nudgePlus')}
            variant="quiet"
            onPress={() => setNudgeDeg((prev) => Math.min(prev + 5, MAX_NUDGE_DEG))}
          />
        </View>

        {error ? (
          <Text variant="caption" tone="open" center>
            {error}
          </Text>
        ) : null}

        {/*
          Two ways to record, and by-eye is not a footnote to the other.
          
          It used to be a `quiet` text link sitting under a large, greyed-out
          shutter. That reads as one broken button, not as two choices — so the
          feature people could always reach looked like the feature that did not
          work. Unaligned, by-eye *is* the shutter; the round control is the one
          that greys out, because it is the one with a precondition.
        */}
        <View style={styles.buttonGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={locked ? t('capture.recordAligned') : t('capture.recordByEye')}
            accessibilityState={{ busy: saving }}
            accessibilityHint={
              locked
                ? t('capture.alignedHint')
                : t('capture.byEyeHint')
            }
            disabled={saving}
            onPress={() => onCapture(locked ? 'aligned' : 'manual', false)}
            style={({ pressed }) => [
              styles.shutter,
              locked ? styles.shutterReady : styles.shutterByEye,
              pressed && styles.shutterPressed,
            ]}
          >
            <View style={[styles.shutterCore, locked && styles.shutterCoreReady]} />
          </Pressable>

          {locked ? (
            <Button
              label={t('capture.nothingChanged')}
              variant="quiet"
              disabled={saving}
              onPress={() => onCapture('aligned', true)}
              accessibilityHint={t('capture.stableHint')}
            />
          ) : null}
        </View>

        <Text variant="caption" tone={locked ? 'locked' : 'seeking'} center>
          {locked
            ? t('capture.alignedStatus')
            : t('capture.byEyeStatus')}
        </Text>
        {!locked ? (
          <Text variant="caption" tone="muted" center>
            {t('capture.moveHint')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { paddingHorizontal: 0 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  viewfinder: { flex: 1, backgroundColor: colors.textPrimary, overflow: 'hidden', position: 'relative' },
  overlay: { alignItems: 'center', justifyContent: 'center', zIndex: layers.reticle },
  topHud: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 50,
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.scrim,
    borderWidth: 1,
    borderColor: colors.onScrimBorder,
  },
  controls: {
    paddingHorizontal: spacing.gutter,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.base,
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  readoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignSelf: 'stretch',
  },
  nudgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  buttonGroup: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  shutter: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterReady: { borderColor: colors.alignmentLocked },
  // Live, not disabled — by-eye is a valid record, drawn in the seeking colour
  // so it never reads as the aligned one.
  shutterByEye: { borderColor: colors.alignmentSeeking },
  shutterPressed: { opacity: 0.7 },
  shutterCore: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
  },
  shutterCoreReady: { backgroundColor: colors.alignmentLocked },
  reviewHead: { paddingTop: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  referenceNote: { paddingTop: spacing.sm, paddingBottom: spacing.lg },
  submission: { paddingVertical: spacing.lg, gap: spacing.md },
  telemetry: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
  },
  reviewActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
});
