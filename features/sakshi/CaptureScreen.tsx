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
import { useAlignment } from '@/hooks';
import { camera as cameraService, database } from '@/services';
import { usePermission, usePreferences } from '@/store';
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
export function CaptureScreen({ vantageId }: { vantageId: string }) {
  const router = useRouter();
  const vantage = findVantage(vantageId);
  const site = vantage ? findSite(vantage.siteId) : undefined;
  const { state: cameraPermission, request: requestCamera, openSettings } = usePermission('camera');
  const { preferences } = usePreferences();
  const [nudgeDeg, setNudgeDeg] = useState(0);
  const [draft, setDraft] = useState<CaptureDraft | null>(null);
  const [referenceResult, setReferenceResult] = useState<ReferenceResult | null>(null);

  const alignment = useAlignment({ vantage, nudgeDeg, active: draft == null });
  const cameraRef = useRef<CameraView>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!vantage) {
    return (
      <Screen>
        <EmptyState
          title="No such vantage"
          body="This viewpoint is not in the catalogue."
          actionLabel="Back"
          onAction={() => router.back()}
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
            The camera is the instrument
          </Text>
          <Text variant="body" tone="secondary" center>
            An observation is a photograph taken from a known point. Without the camera there is
            nothing to record, though you can still read the series others have built.
          </Text>
          {cameraPermission.status === 'blocked' ? (
            <Button label="Open settings" onPress={openSettings} />
          ) : (
            <Button label="Allow camera" onPress={requestCamera} />
          )}
          <Button label="Back" variant="quiet" onPress={() => router.back()} />
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
      if (!photo?.uri) throw new Error('The camera returned no image.');

      // Freeze the record at the shutter. The live sensors keep moving while a
      // person reviews the frame, so reading them again at submit time would
      // attach a later position and orientation to an earlier photograph.
      const id = `obs-${Date.now()}`;
      const aligned = mode === 'aligned';
      const observation: Observation = {
        id,
        vantageId: vantage.id,
        siteId: vantage.siteId,
        capturedAt: new Date().toISOString(),
        // This camera-cache URI remains a draft until explicit submission.
        photoUri: photo.uri,
        // The observer's real fix, not the catalogued vantage. Falls back to the
        // vantage only when there is no fix at all — and then accuracy/error are
        // null, so the record never claims to have been taken on the survey point.
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
        gateMode: mode,
        note: isNoChange ? 'Nothing has changed: verified stability.' : undefined,
        assessment: 'unreviewed',
        synced: false,
      };

      setDraft({ observation, sourceUri: photo.uri });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The capture failed.');
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
      router.replace({
        pathname: '/(main)/sakshi/observation',
        params: { observationId: observation.id },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The observation could not be submitted.');
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
            Photography is {site.photography} here
          </Text>
          <Text variant="body" tone="secondary" center>
            {site.name} is a protected space where photography is {site.photography}. The witness
            tool is disabled at this site. Please respect the restriction and confirm with site
            staff. You can still read its record and history.
          </Text>
          <Button label="Back" onPress={() => router.back()} />
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
          date: 'Previous',
          note: `Previous submitted frame from this fixed viewpoint, recorded ${formatTimestamp(referenceObservation.capturedAt)}.`,
        }
      : historical
        ? {
            image: historical.image,
            date: historical.date,
            tier: historical.evidenceTier,
            note: historical.viewpointConfirmed
              ? 'Historical frame matched to this fixed viewpoint.'
              : 'Historical reference. Its viewpoint is approximate, so use it for visual context rather than measured alignment.',
          }
        : {
            image: bundledReference,
            date: 'Site reference',
            note: bundledReference
              ? 'Site reference only. The attached readings are the evidence of where this new frame was made.'
              : 'No earlier image is available for this viewpoint yet. Review the new frame and its attached readings before submitting.',
          };

    return (
      <Screen scroll>
        <View style={styles.reviewHead}>
          <Text variant="label" tone="muted" uppercase>
            Compare and submit
          </Text>
          <Text variant="title">Review today&apos;s frame</Text>
          <Text variant="body" tone="secondary">
            Drag the divider to compare the framing. Nothing joins the record until you submit.
          </Text>
        </View>

        <ThenNowCompare
          then={{
            image: reference.image,
            date: reference.date,
            placeholderNote: reference.note,
            tier: 'tier' in reference ? reference.tier : undefined,
          }}
          now={{ image: draft.sourceUri, date: 'Captured now' }}
          aspectRatio={3 / 4}
        />

        <Text variant="caption" tone="secondary" style={styles.referenceNote}>
          {reference.note}
        </Text>

        <Divider />

        <View style={styles.submission}>
          <Text variant="heading">Submission data</Text>
          <Text variant="body" tone="secondary">
            The photo and these readings will be saved on this phone first, then queued for sync.
          </Text>
          <View style={styles.telemetry}>
            <MetaRow label="Captured" value={formatTimestamp(draft.observation.capturedAt)} />
            <MetaRow
              label="Mode"
              value={draft.observation.gateMode === 'aligned' ? 'Measured alignment' : 'Framed by eye'}
              mono={false}
              tone={draft.observation.gateMode === 'aligned' ? 'locked' : 'seeking'}
            />
            <MetaRow label="Position" value={formatCoordinate(draft.observation.coordinate)} />
            <MetaRow
              label="GPS accuracy"
              value={formatDistance(draft.observation.gpsAccuracyM ?? null)}
            />
            <MetaRow label="Bearing" value={formatBearing(draft.observation.bearing)} />
            <MetaRow label="Pitch" value={formatDelta(draft.observation.pitch)} />
            <MetaRow
              label="Position error"
              value={formatDistance(draft.observation.positionErrorM)}
            />
            <MetaRow
              label="Bearing error"
              value={formatDelta(draft.observation.bearingErrorDeg)}
            />
            <MetaRow
              label="Alignment score"
              value={draft.observation.alignScore?.toFixed(2) ?? 'not measured'}
            />
          </View>

          {error ? (
            <Text variant="caption" tone="open">
              {error}
            </Text>
          ) : null}

          <View style={styles.reviewActions}>
            <Button
              label="Retake"
              variant="secondary"
              disabled={saving}
              onPress={() => {
                setDraft(null);
                setError(null);
              }}
            />
            <Button
              label="Submit observation"
              loading={saving}
              onPress={submitDraft}
              accessibilityHint="Saves this photo and its capture readings on this device"
            />
          </View>
        </View>
      </Screen>
    );
  }

  return (
    <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
      <View style={styles.viewfinder}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top Floating Mobile Status Bar */}
        <View style={styles.topHud}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text variant="body">‹ Back</Text>
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
        <View style={styles.nudgeRow}>
          <Button
            label="Nudge -5°"
            variant="quiet"
            onPress={() => setNudgeDeg((prev) => prev - 5)}
          />
          <Text variant="mono" tone="secondary">
            {nudgeDeg === 0 ? 'Compass 0°' : `${nudgeDeg > 0 ? '+' : ''}${nudgeDeg}°`}
          </Text>
          <Button
            label="Nudge +5°"
            variant="quiet"
            onPress={() => setNudgeDeg((prev) => prev + 5)}
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
            accessibilityLabel={locked ? 'Record aligned observation' : 'Record by eye'}
            accessibilityState={{ busy: saving }}
            accessibilityHint={
              locked
                ? 'Records a measured observation from this vantage'
                : 'Records a photograph without a measured lock: position and bearing error are left blank'
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
              label="Nothing has changed"
              variant="quiet"
              disabled={saving}
              onPress={() => onCapture('aligned', true)}
              accessibilityHint="Record a stable observation"
            />
          ) : null}
        </View>

        <Text variant="caption" tone={locked ? 'locked' : 'seeking'} center>
          {locked
            ? 'Aligned: the shutter records position and bearing error.'
            : 'By eye: the photograph is kept, the measurements are left blank.'}
        </Text>
        {!locked ? (
          <Text variant="caption" tone="muted" center>
            Move, or nudge the compass, until the reticle locks for a measured record.
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
    backgroundColor: 'rgba(14, 21, 18, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
