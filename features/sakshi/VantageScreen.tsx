import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

import { Button, Card, Chip, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { BackBar, EmptyState, ProGate } from '@/components/common';
import { AlignmentReadout, CompassCalibrationPrompt, Reticle } from '@/components/reticle';
import { findSite, findVantage } from '@/data';
import { useAlignment, useHaptics, useOpenInTabs, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePermission } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatCoordinate } from '@/utils';

import { GuidanceSteps } from './GuidanceSteps';

/**
 * Align to a vantage.
 *
 * Designed as a clean native mobile instrument: reticle HUD above,
 * numeric readout in floating mobile cards below, capture unlocked on alignment.
 */
export function VantageScreen({ vantageId }: { vantageId: string }) {
  const ui = useVisitorLiteralCopy();
  const router = useRouter();
  const goBack = useSafeBack();
  const openInTabs = useOpenInTabs();
  const vantage = findVantage(vantageId);
  const { state: locationPermission, request: requestLocation } = usePermission('location');
  const { pulse } = useHaptics();
  const { width } = useWindowDimensions();

  const alignment = useAlignment({ vantage });
  const locked = alignment.phase === 'locked';
  const [calibrating, setCalibrating] = useState(false);

  useEffect(() => {
    if (locked) {
      pulse();
    }
  }, [locked, pulse]);

  if (!vantage) {
    return (
      <Screen>
        <EmptyState
          title="No such vantage"
          body="This viewpoint is not in the catalogue."
          actionLabel="Back"
          onAction={goBack}
        />
      </Screen>
    );
  }

  const site = findSite(vantage.siteId);
  const needsLocation = locationPermission.status !== 'granted';
  const photographyRestricted = site?.photography != null && site.photography !== 'allowed';
  const reticleSize = Math.min(280, width - spacing.gutter * 2);

  const openCapture = () => {
    router.push({
      pathname: '/visit/capture',
      params: { vantageId: vantage.id, mode: locked ? 'aligned' : 'manual' },
    });
  };

  return (
    <Screen scroll>
      <BackBar />
      <View style={styles.head}>
        <View style={styles.instrumentHeader}>
          <Chip label={site?.name ?? 'VANTAGE'} style={styles.siteChip} />
          <Chip label={phaseLabel(alignment.phase)} selected={locked} />
        </View>
        <Text variant="title">{vantage.label}</Text>
        {vantage.estimated ? (
          <Text variant="caption" tone="seeking">
            Estimated viewpoint: placed from a map and not yet surveyed on site.
          </Text>
        ) : null}
      </View>

      {photographyRestricted ? (
        <Card>
          <Text variant="bodyStrong">Photography is restricted at this site.</Text>
          <Text variant="body" tone="secondary">
            You can still use this viewpoint to look and learn, but the camera stays off here.
          </Text>
        </Card>
      ) : null}

      <Button
        label="Directions to this viewpoint"
        icon="directions"
        variant="secondary"
        onPress={() => openInTabs({ pathname: '/(main)/tirtha/map', params: { guideTo: vantage.id } })}
      />
      <Button
        label="Try the alignment first"
        variant="quiet"
        onPress={() => router.push('/visit/practice')}
      />

      <View style={styles.reticleBlock}>
        <Reticle size={reticleSize} progress={alignment.progress} phase={alignment.phase} />
      </View>

      {needsLocation ? (
        <View style={styles.notice}>
          <Text variant="body" tone="secondary">
            Alignment needs your location. Without it, you can still frame the shot by eye.
          </Text>
          <Button label="Allow location" variant="secondary" onPress={requestLocation} />
        </View>
      ) : (
        <View style={styles.readoutCard}>
          <AlignmentReadout alignment={alignment} vantage={vantage} />
        </View>
      )}

      {!needsLocation ? (
        <ProGate
          feature="close-up-guidance"
          title="Step-by-step guidance"
          body="Pro guides you onto the mark and into the view, one step at a time. You can still take the photograph by eye."
        >
          <GuidanceSteps alignment={alignment} vantage={vantage} />
        </ProGate>
      ) : null}

      {alignment.blockedBy === 'heading' || alignment.headingQuality === 'poor' ? (
        <Button label="Calibrate compass" icon="compass-outline" variant="quiet" onPress={() => setCalibrating(true)} />
      ) : null}

      <Divider />

      {vantage.note ? (
        <Text variant="body" tone="secondary" style={styles.note}>
          {vantage.note}
        </Text>
      ) : null}

      <View style={styles.meta}>
        <MetaRow label="Vantage" value={formatCoordinate(vantage.coordinate)} />
        <MetaRow
          label="Tolerance"
          value={`±${vantage.positionToleranceM} m · ±${vantage.bearingToleranceDeg}°`}
        />
      </View>

      <View style={styles.actions}>
        <Button
          disabled={photographyRestricted}
          label={locked ? 'Take it, aligned' : 'Match by eye'}
          icon={locked ? 'camera-outline' : 'eye-outline'}
          block
          onPress={openCapture}
          accessibilityHint={ui('Opens the camera to record an observation')}
        />

        {!locked ? (
          <Text variant="caption" tone="muted" center>
            {alignment.phase === 'unavailable'
              ? 'No position fix. Frame the shot by eye.'
              : 'Not yet within tolerance. Align further, or capture by eye.'}
          </Text>
        ) : null}
      </View>
      <CompassCalibrationPrompt visible={calibrating} onDismiss={() => setCalibrating(false)} />
    </Screen>
  );
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'locked':
      return 'ALIGNED';
    case 'seeking':
      return 'SEEKING';
    case 'manual':
      return 'BY EYE';
    case 'unavailable':
      return 'NO SIGNAL';
    default:
      return 'IDLE';
  }
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.md, gap: spacing.lg },
  instrumentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  siteChip: { flex: 1 },
  reticleBlock: { alignItems: 'center', paddingVertical: spacing.lg },
  notice: { gap: spacing.md, alignItems: 'flex-start', paddingBottom: spacing.lg },
  readoutCard: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  note: { paddingVertical: spacing.md },
  meta: { paddingBottom: spacing.lg },
  actions: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl },
});

