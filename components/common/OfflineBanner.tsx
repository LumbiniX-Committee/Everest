import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type SyncState = 'offline' | 'syncing' | 'failed' | 'synced';

export type OfflineBannerProps = {
  state: SyncState;
  /** Observations written on device but not yet sent. */
  pending?: number;
  onRetry?: () => void;
};

/**
 * The state of the record, stated without alarm.
 *
 * Lumbini has patchy coverage and the app is built to work without it, so
 * unsent work is an ordinary condition rather than a fault. The banner exists to
 * reassure — the record is on the device and nothing is lost — not to nag
 * someone into finding signal.
 *
 * ── Why this no longer says "Offline" ───────────────────────────────────────
 *
 * `hooks/useSync.ts` reaches the `offline` state whenever rows are unsent and no
 * remote is configured. It never asks the OS about connectivity, so it said
 * "Offline" on a phone with full signal — a claim about the network the app has
 * not checked and, without a netinfo dependency, cannot check. The copy below
 * states only what is actually known: how many rows are here and unsent.
 *
 * Renders nothing once everything is synced. A permanent green "all good" strip
 * is noise on a screen the person is using to look at a temple.
 */
export function OfflineBanner({ state, pending = 0, onRetry }: OfflineBannerProps) {
  if (state === 'synced') return null;

  const copy = messages[state](pending);

  return (
    // A polite live region, not an alert: screen readers should mention a
    // dropped connection when they reach a pause, not interrupt mid-sentence.
    <View style={[styles.wrap, { borderColor: copy.color }]} accessibilityLiveRegion="polite">
      <View style={[styles.dot, { backgroundColor: copy.color }]} />
      <Text variant="caption" tone="secondary" style={styles.text}>
        {copy.text}
      </Text>
      {state === 'failed' && onRetry ? (
        <Text
          variant="caption"
          tone="sandstone"
          onPress={onRetry}
          accessibilityRole="button"
          suppressHighlighting
        >
          Retry
        </Text>
      ) : null}
    </View>
  );
}

const messages: Record<Exclude<SyncState, 'synced'>, (pending: number) => { text: string; color: string }> = {
  offline: (pending) => ({
    color: colors.textMuted,
    text: pending
      ? `${pending} ${pending === 1 ? 'observation' : 'observations'} saved on this device — not sent yet.`
      : 'Everything you record is saved on this device.',
  }),
  syncing: (pending) => ({
    color: colors.alignmentSeeking,
    text: pending ? `Sending ${pending}…` : 'Sending…',
  }),
  failed: (pending) => ({
    color: colors.alignmentSeeking,
    text: pending
      ? `Could not send ${pending}. They are safe on this device.`
      : 'Could not send. Your record is safe on this device.',
  }),
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.surfaceSecondary,
  },
  dot: { width: 6, height: 6, borderRadius: radii.full },
  text: { flex: 1 },
});
