import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Divider, MetaRow, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { AlignmentReadout, Reticle } from '@/components/reticle';
import { findSite, findVantage } from '@/data';
import { useAlignment } from '@/hooks';
import { usePermission } from '@/store';
import { spacing } from '@/theme';
import { formatCoordinate } from '@/utils';

/**
 * Align to a vantage.
 *
 * The live alignment screen: reticle above, numeric readout below, capture
 * unlocked only on a true lock. Degradation is layered rather than all-or-
 * nothing — without motion the reticle stops moving but the written bearing
 * still guides; without location nothing can be computed and the screen says so
 * plainly instead of showing a reticle that will never close.
 */
export function VantageScreen({ vantageId }: { vantageId: string }) {
  const router = useRouter();
  const vantage = findVantage(vantageId);
  const { state: locationPermission, request: requestLocation } = usePermission('location');
  const [simulatedAtVantage, setSimulatedAtVantage] = useState(false);

  // If simulatedAtVantage is true, override input position/heading to match vantage exactly
  const mockAlignment = useMemo(() => {
    if (simulatedAtVantage && vantage) {
      return {
        phase: 'locked' as const,
        progress: 1,
        bearingDeltaDeg: 0,
        distanceM: 0,
        pitchDeltaDeg: 0,
      };
    }
    return null;
  }, [simulatedAtVantage, vantage]);

  const realAlignment = useAlignment({ vantage });
  const alignment = mockAlignment ?? realAlignment;

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
  const needsLocation = locationPermission.status !== 'granted' && !simulatedAtVantage;

  const openCapture = () => {
    router.push({ pathname: '/(main)/sakshi/capture', params: { vantageId: vantage.id } });
  };

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          {site?.name ?? 'Vantage'}
        </Text>
        <Text variant="title">{vantage.label}</Text>
      </View>

      <View style={styles.reticleBlock}>
        <Reticle size={220} progress={alignment.progress} phase={alignment.phase} />
        <Text variant="label" tone={locked ? 'locked' : 'muted'} uppercase>
          {phaseLabel(alignment.phase)}
        </Text>
      </View>

      {/* Testing / Indoor Simulation Toggle */}
      <View style={styles.simulatedRow}>
        <Button
          label={simulatedAtVantage ? 'Simulated at Vantage (ON)' : 'Simulate Standing at Vantage'}
          variant={simulatedAtVantage ? 'secondary' : 'quiet'}
          onPress={() => setSimulatedAtVantage(!simulatedAtVantage)}
        />
      </View>

      {needsLocation ? (
        <View style={styles.notice}>
          <Text variant="body" tone="secondary">
            Alignment needs to know where you are standing. Without it, use the bearing below or simulate standing at the vantage.
          </Text>
          <Button label="Allow location" variant="secondary" onPress={requestLocation} />
        </View>
      ) : (
        <View style={styles.readout}>
          <AlignmentReadout alignment={alignment} vantage={vantage} />
        </View>
      )}

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
          label={locked ? 'Witness (Open Camera)' : 'Align to witness'}
          block
          disabled={!locked}
          onPress={openCapture}
          accessibilityHint="Opens the camera to record an observation"
        />

        {/* Match by Eye Escape Hatch (Demo Insurance) */}
        {!locked ? (
          <>
            <Button
              label="Match by eye (Override Gate)"
              variant="quiet"
              onPress={openCapture}
              accessibilityHint="Demo escape hatch: bypass alignment gate to test camera & dissolve"
            />
            <Text variant="caption" tone="muted" center>
              Capture opens when position, bearing and tilt match. Use "Simulate" or "Match by eye" to test indoors.
            </Text>
          </>
        ) : null}
      </View>
    </Screen>
  );
}

function phaseLabel(phase: string): string {
  switch (phase) {
    case 'locked':
      return 'Aligned';
    case 'seeking':
      return 'Seeking';
    case 'unavailable':
      return 'No signal';
    default:
      return 'Idle';
  }
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, gap: spacing.xs },
  reticleBlock: { alignItems: 'center', gap: spacing.base, paddingVertical: spacing.xl },
  simulatedRow: { alignItems: 'center', paddingBottom: spacing.md },
  notice: { gap: spacing.md, alignItems: 'flex-start', paddingBottom: spacing.lg },
  readout: { paddingBottom: spacing.lg },
  note: { paddingVertical: spacing.lg },
  meta: { paddingBottom: spacing.lg },
  actions: { gap: spacing.md, paddingTop: spacing.sm },
});
