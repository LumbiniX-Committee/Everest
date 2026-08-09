import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { AlignmentReadout, Reticle } from '@/components/reticle';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { findSite, findVantage } from '@/data';
import { useAlignment, useHaptics } from '@/hooks';
import { usePermission } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatCoordinate } from '@/utils';
import { alignmentHint } from '@/utils/alignmentHint';

/**
 * Align to a vantage.
 *
 * Designed as a clean native mobile instrument: reticle HUD above,
 * numeric readout in floating mobile cards below, capture unlocked on alignment.
 */
export function VantageScreen({ vantageId }: { vantageId: string }) {
  const router = useRouter();
  const vantage = findVantage(vantageId);
  const { state: locationPermission, request: requestLocation } = usePermission('location');
  const { pulse } = useHaptics();

  const alignment = useAlignment({ vantage });

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

  const site = findSite(vantage.siteId);
  const locked = alignment.phase === 'locked';
  const needsLocation = locationPermission.status !== 'granted';
  const spokenHint = alignmentHint(alignment);

  useEffect(() => {
    if (locked) {
      pulse();
    }
  }, [locked, pulse]);

  const openCapture = () => {
    router.push({
      pathname: '/(main)/sakshi/capture',
      params: { vantageId: vantage.id, mode: locked ? 'aligned' : 'manual' },
    });
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <View style={styles.badgeRow}>
          <Chip label={site?.name ?? 'VANTAGE'} />
          <Chip label={phaseLabel(alignment.phase)} selected={locked} />
        </View>
        <Text variant="title">{vantage.label}</Text>
      </View>

      <View style={styles.reticleBlock}>
        <Reticle size={240} progress={alignment.progress} phase={alignment.phase} />
      </View>

      {needsLocation ? (
        <View style={styles.notice}>
          <Text variant="body" tone="secondary">
            Alignment needs your location. Without it, you can still frame the shot by eye against the ghost overlay.
          </Text>
          <Button label="Allow location" variant="secondary" onPress={requestLocation} />
        </View>
      ) : (
        <View style={styles.readoutCard}>
          <AlignmentReadout alignment={alignment} vantage={vantage} />
        </View>
      )}

      <View style={styles.voiceHint}>
        <Text variant="caption" tone="muted">Alignment voice hint</Text>
        <SpeakButton text={spokenHint} language="en" />
      </View>

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
          label={locked ? 'Take it, aligned' : 'Match by eye'}
          block
          onPress={openCapture}
          accessibilityHint="Opens the camera to record an observation"
        />

        {!locked ? (
          <Text variant="caption" tone="muted" center>
            {alignment.phase === 'unavailable'
              ? 'No position fix. Frame by eye against the ghost overlay.'
              : 'Not yet within tolerance. Align further, or capture by eye.'}
          </Text>
        ) : null}
      </View>
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
  head: { paddingTop: spacing.md, gap: spacing.xs },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reticleBlock: { alignItems: 'center', paddingVertical: spacing.lg },
  notice: { gap: spacing.md, alignItems: 'flex-start', paddingBottom: spacing.lg },
  voiceHint: { gap: spacing.xs, paddingBottom: spacing.md },
  readoutCard: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  note: { paddingVertical: spacing.md },
  meta: { paddingBottom: spacing.lg },
  actions: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xl },
});

