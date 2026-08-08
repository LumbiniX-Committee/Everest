import { useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';

import { Button, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { Reticle } from '@/components/reticle';
import { findVantage } from '@/data';
import { useAlignment } from '@/hooks';
import { camera as cameraService, database } from '@/services';
import { usePermission } from '@/store';
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
  const { state: cameraPermission, request: requestCamera, openSettings } = usePermission('camera');
  const alignment = useAlignment({ vantage });
  const cameraRef = useRef<CameraView>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const onCapture = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);

    try {
      const photo = await cameraRef.current?.takePictureAsync(cameraService.OBSERVATION_CAPTURE);
      if (!photo?.uri) throw new Error('The camera returned no image.');

      const observation: Observation = {
        id: `obs-${Date.now()}`,
        vantageId: vantage.id,
        siteId: vantage.siteId,
        capturedAt: new Date().toISOString(),
        photoUri: photo.uri,
        coordinate: vantage.coordinate,
        bearing: vantage.bearing - (alignment.bearingDeltaDeg ?? 0),
        pitch: vantage.pitch - (alignment.pitchDeltaDeg ?? 0),
        positionErrorM: alignment.distanceM ?? 0,
        bearingErrorDeg: Math.abs(alignment.bearingDeltaDeg ?? 0),
        // The photograph is the record; what it shows is a separate judgement
        // made on the next screen. Writing it unreviewed means walking away
        // here still keeps the frame.
        assessment: 'unreviewed',
        synced: false,
      };

      await database.insertObservation(observation);
      router.replace({
        pathname: '/(main)/sakshi/observation',
        params: { observationId: observation.id },
      });
    } catch (caught) {
      // The photograph may be irreplaceable, so failure is surfaced and the
      // screen stays put rather than navigating away from a lost capture.
      setError(caught instanceof Error ? caught.message : 'The capture failed.');
    } finally {
      setSaving(false);
    }
  };

  const locked = alignment.phase === 'locked';

  return (
    <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
      <View style={styles.viewfinder}>
        <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

        <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
          <Reticle size={240} progress={alignment.progress} phase={alignment.phase} />
        </View>
      </View>

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

        {error ? (
          <Text variant="caption" tone="open" center>
            {error}
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Record observation"
          accessibilityState={{ disabled: !locked || saving, busy: saving }}
          disabled={!locked || saving}
          onPress={onCapture}
          style={({ pressed }) => [
            styles.shutter,
            locked ? styles.shutterReady : styles.shutterWaiting,
            pressed && styles.shutterPressed,
          ]}
        >
          <View style={[styles.shutterCore, locked && styles.shutterCoreReady]} />
        </Pressable>

        <Text variant="caption" tone="muted" center>
          {locked ? 'Aligned. Record when the light is right.' : 'Move until the reticle closes.'}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { paddingHorizontal: 0 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base },
  viewfinder: { flex: 1, backgroundColor: colors.textPrimary, overflow: 'hidden' },
  overlay: { alignItems: 'center', justifyContent: 'center', zIndex: layers.reticle },
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
