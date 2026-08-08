import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import type { ConditionStatus, SourceTier } from '@/types';

import { Text } from './Text';

const conditionCopy: Record<ConditionStatus, { label: string; color: string }> = {
  stable: { label: 'Stable', color: colors.resolved },
  watch: { label: 'Watch', color: colors.alignmentSeeking },
  open: { label: 'Open condition', color: colors.openCondition },
  resolved: { label: 'Resolved', color: colors.resolved },
};

const sourceCopy: Record<SourceTier, string> = {
  archaeological: 'Archaeological',
  documented: 'Documented',
  community: 'Community-reported',
};

/**
 * A small status marker. Colour is carried by a dot and the text, never by a
 * filled pill — filled colour blocks read as decoration and this palette is
 * meant to read as annotation.
 */
export function ConditionBadge({ status }: { status: ConditionStatus }) {
  const { label, color } = conditionCopy[status];
  return (
    <View style={styles.row}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text variant="label" uppercase style={{ color }}>
        {label}
      </Text>
    </View>
  );
}

/** Provenance, always visible. A community report must not look excavated. */
export function SourceBadge({ tier }: { tier: SourceTier }) {
  return (
    <View style={styles.tier}>
      <Text variant="label" tone="muted" uppercase>
        {sourceCopy[tier]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: radii.full },
  tier: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
});
