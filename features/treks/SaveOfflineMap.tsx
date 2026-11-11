import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Text } from '@/components/ui';
import type { Bounds } from '@/core';
import { useOfflinePacks } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePlan } from '@/store';
import { spacing } from '@/theme';

/** Formats a byte count as MB with one decimal. */
export function formatMegabytes(bytes: number): string {
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

/**
 * Save one area's map to the phone. Pro, because the packs are what Pro
 * promised as offline maps; free visitors see what it would do and how to unlock it.
 */
export function SaveOfflineMap({ id, label, bounds }: { id: string; label: string; bounds: Bounds | null }) {
  const ui = useVisitorLiteralCopy();
  const router = useRouter();
  const { canUse } = usePlan();
  const { packs, saving, save } = useOfflinePacks();
  if (!bounds) return null;
  const pack = packs.find((existing) => existing.id === id);
  const mine = saving?.id === id ? saving : null;

  if (!canUse('offline-packs')) {
    return (
      <View style={styles.wrap}>
        <Button label="Save map for offline · Pro" icon="download-outline" variant="secondary" onPress={() => router.push('/(main)/settings/plans')} />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Button
        label={pack ? 'Update offline map' : 'Save map for offline'}
        icon="download-outline"
        variant="secondary"
        loading={mine != null}
        disabled={saving != null}
        onPress={() => void save(id, label, bounds)}
      />
      <Text variant="caption" tone="muted" translate={false}>
        {mine
          ? `${ui('Saving')} ${mine.done} / ${mine.total}`
          : pack
            ? `${ui('Saved on this phone')} · ${formatMegabytes(pack.bytes)}${pack.failed ? ` · ${pack.failed} ${ui('tiles could not be fetched; update to retry')}` : ''}`
            : ui('Saves the map, terrain and labels for this area, for use with no signal. Satellite is not saved.')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginTop: spacing.sm },
});
