import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type ProgressIndicatorProps = {
  /** Completed units. Clamped to 0…total. */
  value: number;
  total: number;
  /** Shown above the track. */
  label?: string;
  /**
   * Renders "3 of 5" beside the label. Off for progress that is not a tally —
   * a retrieval, say, where a count would imply precision that is not there.
   */
  showCount?: boolean;
  /** Overrides the fill. Defaults to sandstone; the practice surfaces use it. */
  color?: string;
};

/**
 * A determinate bar.
 *
 * Segmented when the total is small enough to count at a glance, continuous
 * when it is not. Discrete steps read as "three of five things done", which is
 * what quest and practice progress actually are — a percentage would abstract
 * that into a number nobody asked for.
 */
export function ProgressIndicator({
  value,
  total,
  label,
  showCount = true,
  color = colors.sandstone,
}: ProgressIndicatorProps) {
  const safeTotal = Math.max(1, total);
  const done = Math.min(Math.max(0, value), safeTotal);
  const segmented = safeTotal <= 8;

  return (
    <View
      style={styles.wrap}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: safeTotal, now: done }}
      accessibilityLabel={label}
    >
      {label || showCount ? (
        <View style={styles.head}>
          {label ? (
            <Text variant="label" tone="muted" uppercase>
              {label}
            </Text>
          ) : null}
          {showCount ? (
            <Text variant="mono" tone="muted">
              {done} of {safeTotal}
            </Text>
          ) : null}
        </View>
      ) : null}

      {segmented ? (
        <View style={styles.segments}>
          {Array.from({ length: safeTotal }, (_, i) => (
            <View
              key={i}
              style={[styles.segment, { backgroundColor: i < done ? color : colors.surfaceSecondary }]}
            />
          ))}
        </View>
      ) : (
        <View style={styles.track}>
          <View
            style={[styles.fill, { backgroundColor: color, width: `${(done / safeTotal) * 100}%` }]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  segments: { flexDirection: 'row', gap: spacing.xs },
  segment: { flex: 1, height: 4, borderRadius: radii.full },
  track: {
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radii.full },
});
