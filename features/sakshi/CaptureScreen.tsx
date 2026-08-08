import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';

import { Button, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { Reticle } from '@/components/reticle';
import { YoloVisionOverlay, PathologySummaryCard } from '@/components/observation';
import { findSite, findVantage } from '@/data';
import { useAlignment, useCurrentPosition } from '@/hooks';
import { camera as cameraService, database } from '@/services';
import { runYoloScan, type YoloScanResult } from '@/services/ai/yoloEngine';
import { usePermission, usePreferences } from '@/store';
import { colors, layers, radii, spacing } from '@/theme';
import { formatBearing, formatDelta, formatDistance } from '@/utils';
import type { Observation } from '@/types';

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
 */
export function CaptureScreen({ vantageId }: { vantageId: string }) {
  const router = useRouter();
  const vantage = findVantage(vantageId);
  const site = vantage ? findSite(vantage.siteId) : undefined;
  const { state: cameraPermission, request: requestCamera, openSettings } = usePermission('camera');
  const { preferences } = usePreferences();
  const [nudgeDeg, setNudgeDeg] = useState(0);
  const [aiScanOn, setAiScanOn] = useState(true);
  const [yoloResult, setYoloResult] = useState<YoloScanResult | null>(null);

  const alignment = useAlignment({ vantage, nudgeDeg });
  const { coordinate: observerCoord } = useCurrentPosition({ watch: true, highAccuracy: true });
  const cameraRef = useRef<CameraView>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Run YOLO scan when AI toggle is active
  useEffect(() => {
    let active = true;
    if (aiScanOn) {
      runYoloScan().then((res) => { if (active) setYoloResult(res); });
    } else {
      setYoloResult(null);
    }
    return () => { active = false; };
  }, [aiScanOn]);

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
            nothing to record — though you can still read the series others have built.
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

      // Persist the frame out of the camera cache, which the OS can evict —
      // leaving a record pointing at a photograph that no longer exists. For a
      // product about photographs that cannot be retaken, that is the worst gap.
      const id = `obs-${Date.now()}`;
      const dir = `${FileSystem.documentDirectory}observations/`;
      await FileSystem.makeDirectoryAsync(dir, { intermediates: true }).catch(() => {});
      const dest = `${dir}${id}.jpg`;
      await FileSystem.copyAsync({ from: photo.uri, to: dest });

      const aligned = mode === 'aligned';
      const observation: Observation = {
        id,
        vantageId: vantage.id,
        siteId: vantage.siteId,
        capturedAt: new Date().toISOString(),
        photoUri: dest,
        // The observer's real fix, not the catalogued vantage. Falls back to the
        // vantage only when there is no fix at all — and then accuracy/error are
        // null, so the record never claims to have been taken on the survey point.
        coordinate: observerCoord ?? vantage.coordinate,
        bearing: vantage.bearing - (alignment.bearingDeltaDeg ?? 0),
        pitch: vantage.pitch - (alignment.pitchDeltaDeg ?? 0),
        // Real measurements only for an aligned capture. A by-eye frame records
        // null, never a zero that would read as perfect accuracy.
        positionErrorM: aligned ? alignment.distanceM : null,
        bearingErrorDeg: aligned && alignment.bearingDeltaDeg != null
          ? Math.abs(alignment.bearingDeltaDeg)
          : null,
        alignScore: alignment.alignScore,
        gpsAccuracyM: alignment.gpsAccuracyM,
        gateMode: mode,
        note: isNoChange ? 'Nothing has changed — verified stability.' : undefined,
        assessment: 'unreviewed',
        synced: false,
      };

      await database.insertObservation(observation);
      router.replace({
        pathname: '/(main)/sakshi/observation',
        params: { observationId: observation.id },
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'The capture failed.');
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
            tool is disabled at this site — please respect the restriction and confirm with site
            staff. You can still read its record and history.
          </Text>
          <Button label="Back" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  const locked = alignment.phase === 'locked';

  return (
    <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
      <View style={styles.viewfinder}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        {/* Top Floating Mobile Status Bar */}
        <View style={styles.topHud}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text variant="body">‹ Back</Text>
          </Pressable>
          <Pressable
            style={[styles.hudBadge, aiScanOn && styles.hudBadgeActive]}
            onPress={() => setAiScanOn((v) => !v)}
          >
            <Text variant="caption" tone={aiScanOn ? 'sandstone' : 'secondary'}>
              {aiScanOn ? '✨ YOLO AI: ON' : 'YOLO AI: OFF'}
            </Text>
          </Pressable>
        </View>

        {/* YOLO AI Damage Detection Overlay */}
        {yoloResult ? (
          <YoloVisionOverlay detections={yoloResult.detections} visible={aiScanOn} />
        ) : null}

        {/* YOLO Pathology Pill */}
        {aiScanOn && yoloResult && yoloResult.detections.length > 0 ? (
          <View style={styles.pathologyPill}>
            <Text variant="caption" style={styles.pillText}>
              {yoloResult.detections.length} Defects · Integrity {yoloResult.surfaceHealth}%
            </Text>
          </View>
        ) : null}

        {/* Center Alignment Reticle HUD */}
        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <Reticle size={240} progress={alignment.progress} phase={alignment.phase} />
        </View>
      </View>

      {/* Floating Bottom Control Deck */}
      <View style={styles.controls}>
        {/* YOLO AI Pathology Summary Card */}
        {aiScanOn && yoloResult ? (
          <PathologySummaryCard result={yoloResult} />
        ) : null}

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

        <View style={styles.buttonGroup}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Record observation"
            accessibilityState={{ disabled: !locked || saving, busy: saving }}
            disabled={!locked || saving}
            onPress={() => onCapture('aligned', false)}
            style={({ pressed }) => [
              styles.shutter,
              locked ? styles.shutterReady : styles.shutterWaiting,
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
          ) : (
            <Button
              label="Capture by eye"
              variant="quiet"
              disabled={saving}
              onPress={() => onCapture('manual', false)}
              accessibilityHint="Record a by-eye observation without a measured lock"
            />
          )}
        </View>

        <Text variant="caption" tone="muted" center>
          {locked
            ? 'Aligned. Press shutter to record.'
            : 'Move or nudge compass until reticle locks — or capture by eye.'}
        </Text>
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
  hudBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: 'rgba(14, 21, 18, 0.85)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  hudBadgeActive: {
    borderColor: colors.sandstone,
  },
  pathologyPill: {
    position: 'absolute',
    bottom: spacing.base,
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: 'rgba(14, 21, 18, 0.85)',
    borderWidth: 1,
    borderColor: colors.sandstone,
    zIndex: 45,
  },
  pillText: { color: '#fff', fontWeight: '700', fontSize: 11 },
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
  shutterWaiting: { borderColor: colors.border },
  shutterPressed: { opacity: 0.7 },
  shutterCore: {
    width: 56,
    height: 56,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
  },
  shutterCoreReady: { backgroundColor: colors.alignmentLocked },
});
