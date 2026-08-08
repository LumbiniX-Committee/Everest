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

  // A real lock records as an aligned capture; anything else is an honest
  // "match by eye" — the capture screen records which, and never fakes a lock.
  const openCapture = () => {
    router.push({
      pathname: '/(main)/sakshi/capture',
      params: { vantageId: vantage.id, mode: locked ? 'aligned' : 'manual' },
    });
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

      {needsLocation ? (
        <View style={styles.notice}>
          <Text variant="body" tone="secondary">
            Alignment needs to know where you are standing. Without it you can still frame the shot
            by eye against the ghost overlay — it is recorded as a by-eye capture, not an aligned one.
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
          label={locked ? 'Witness — aligned' : 'Match by eye'}
          block
          onPress={openCapture}
          accessibilityHint="Opens the camera to record an observation against the ghost overlay"
        />

        {!locked ? (
          <Text variant="caption" tone="muted" center>
            {alignment.phase === 'unavailable'
              ? 'No position fix. You can still frame by eye against the ghost — it is recorded as a by-eye capture.'
              : 'Not yet within tolerance. Keep aligning, or frame by eye — the capture records which it was.'}
          </Text>
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
    case 'manual':
      return 'By eye';
    case 'unavailable':
      return 'No signal';
    default:
      return 'Idle';
  }
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, gap: spacing.xs },
  reticleBlock: { alignItems: 'center', gap: spacing.base, paddingVertical: spacing.xl },
  notice: { gap: spacing.md, alignItems: 'flex-start', paddingBottom: spacing.lg },
  readout: { paddingBottom: spacing.lg },
  note: { paddingVertical: spacing.lg },
  meta: { paddingBottom: spacing.lg },
  actions: { gap: spacing.md, paddingTop: spacing.sm },
});
