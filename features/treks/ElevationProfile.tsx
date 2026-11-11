import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';

import { formatAltitude } from './format';

const BARS = 72;

/**
 * Altitude along the trail, as columns.
 *
 * Gaps in the elevation model stay gaps rather than dropping to the floor: a
 * missing value drawn as zero would read as a valley that does not exist.
 */
export function ElevationProfile({
  profile,
  marker,
  height = 96,
}: {
  profile: readonly (number | null)[];
  /** Fraction along the trail to mark, such as where you are now. */
  marker?: number | null;
  height?: number;
}) {
  const { preferences } = usePreferences();
  const known = profile.filter((value): value is number => value != null);
  if (known.length < 2) return null;

  const low = Math.min(...known);
  const high = Math.max(...known);
  const span = Math.max(high - low, 50);
  const bars = Array.from({ length: Math.min(BARS, profile.length) }, (_, i) => {
    const start = Math.floor((i * profile.length) / Math.min(BARS, profile.length));
    const end = Math.floor(((i + 1) * profile.length) / Math.min(BARS, profile.length));
    const slice = profile.slice(start, Math.max(end, start + 1)).filter((value): value is number => value != null);
    return slice.length ? Math.max(...slice) : null;
  });
  const markerBar = marker == null ? -1 : Math.min(bars.length - 1, Math.floor(marker * bars.length));

  return (
    <View
      accessible
      accessibilityLabel={`${formatAltitude(low, preferences.distanceUnit)} – ${formatAltitude(high, preferences.distanceUnit)}`}
    >
      <View style={styles.axis}>
        <Text variant="caption" tone="muted" translate={false}>
          {formatAltitude(high, preferences.distanceUnit)}
        </Text>
      </View>
      <View style={[styles.chart, { height }]}>
        {bars.map((value, i) => (
          <View
            key={i}
            style={[
              styles.bar,
              value == null
                ? styles.gap
                : { height: Math.max(2, ((value - low) / span) * (height - 4) + 4) },
              i === markerBar && styles.marker,
            ]}
          />
        ))}
      </View>
      <View style={styles.axis}>
        <Text variant="caption" tone="muted" translate={false}>
          {formatAltitude(low, preferences.distanceUnit)}
        </Text>
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
  bar: { flex: 1, backgroundColor: colors.primarySoft, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
  gap: { height: 0 },
  marker: { backgroundColor: colors.accent },
  axis: { paddingVertical: spacing.xxs },
});
