import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { profileColumns } from '@/core';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { formatDistance } from '@/utils';

import { formatAltitude } from './format';

const COLUMNS = 72;

/**
 * Altitude along the trail, as columns.
 *
 * Each column is the highest sample in its stretch, so a pass is never shaved
 * off. Gaps in the elevation model stay gaps rather than dropping to the floor:
 * a missing value drawn as zero would read as a valley that does not exist.
 * Thin ticks mark where days (or stops) begin, and the distance axis says how
 * long the stretch is, so the steepness reads true.
 */
export function ElevationProfile({
  profile,
  marker,
  ticks,
  distanceM,
  height = 96,
}: {
  profile: readonly (number | null)[];
  /** Fraction along the trail to mark, such as where you are now. */
  marker?: number | null;
  /** Fractions along the trail where a day or stop begins. */
  ticks?: readonly number[];
  /** Length of the trail drawn, for the distance axis. Null when unmeasured. */
  distanceM?: number | null;
  height?: number;
}) {
  const { preferences } = usePreferences();
  const unit = preferences.distanceUnit;
  const known = profile.filter((value): value is number => value != null);
  if (known.length < 2) return null;

  const low = Math.min(...known);
  const high = Math.max(...known);
  // At least 50 m of range, so a gentle day does not look like a cliff.
  const span = Math.max(high - low, 50);
  const columns = profileColumns(profile, COLUMNS);
  const markerColumn = marker == null ? -1 : Math.min(columns.length - 1, Math.floor(marker * columns.length));
  const columnHeight = (value: number) => Math.max(2, ((value - low) / span) * (height - 4) + 4);

  return (
    <View
      accessible
      accessibilityLabel={`${formatAltitude(low, unit)} – ${formatAltitude(high, unit)}${distanceM != null ? `, ${formatDistance(distanceM, unit)}` : ''}`}
    >
      <View style={styles.axis}>
        <Text variant="caption" tone="muted" translate={false}>
          {formatAltitude(high, unit)}
        </Text>
      </View>
      <View style={[styles.chart, { height }]}>
        {columns.map((value, i) => (
          <View
            key={i}
            style={[
              styles.column,
              value == null ? styles.gap : { height: columnHeight(value) },
              i === markerColumn && styles.marker,
            ]}
          />
        ))}
        {(ticks ?? []).map((fraction) => (
          <View key={fraction} pointerEvents="none" style={[styles.tick, { left: `${fraction * 100}%` }]} />
        ))}
      </View>
      <View style={[styles.axis, styles.axisRow]}>
        <Text variant="caption" tone="muted" translate={false}>
          {formatAltitude(low, unit)}
        </Text>
        {distanceM != null ? (
          <Text variant="caption" tone="muted" translate={false}>
            {formatDistance(distanceM, unit)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 1,
    paddingHorizontal: spacing.xs,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  column: { flex: 1, backgroundColor: colors.primarySoft, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  gap: { height: 0 },
  marker: { backgroundColor: colors.accent },
  tick: { position: 'absolute', top: 0, bottom: 0, width: StyleSheet.hairlineWidth, backgroundColor: colors.borderStrong },
  axis: { paddingVertical: spacing.xxs },
  axisRow: { flexDirection: 'row', justifyContent: 'space-between' },
});
