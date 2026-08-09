import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { HeritageSite, UserPreferences } from '@/types';
import { formatDistance } from '@/utils';

/**
 * How far you are from the place a task names.
 *
 * A `site_visit` task said "Visit Maya Devi Temple Precinct" and gave you a
 * checkbox. The app knew your position and the site's, and said neither. That
 * is the shape of the whole complaint about this surface: it described things
 * it could have shown.
 *
 * The bar is a distance readout, not a map — it belongs inside a list row and
 * has to stay legible at 32 points tall. It fills as you close, which makes
 * walking toward something feel like progress rather than like waiting.
 */
export type TaskProximityProps = {
  site: HeritageSite;
  distanceM: number | null;
  unit: UserPreferences['distanceUnit'];
};

/**
 * The distance at which the bar starts registering.
 *
 * 400 m rather than a kilometre: the Sacred Garden's monuments sit within about
 * 90 m of each other, so a scale that only moves once you are within shouting
 * distance would read as broken for the whole walk in.
 */
const APPROACH_M = 400;

export function TaskProximity({ site, distanceM, unit }: TaskProximityProps) {
  // Each site carries its own radius — 20 m for the Marker Stone, 60 m for
  // Tilaurakot — so "arrived" means what it means at that particular place
  // rather than at an average one.
  const reachM = site.radiusMeters ?? 50;

  if (distanceM == null) {
    return (
      <View style={styles.row}>
        <View style={[styles.dot, styles.dotUnknown]} />
        <Text variant="caption" tone="muted">
          Waiting for a position fix
        </Text>
      </View>
    );
  }

  const arrived = distanceM <= reachM;
  const fraction = Math.max(0, Math.min(1, 1 - (distanceM - reachM) / APPROACH_M));

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={[styles.dot, arrived ? styles.dotArrived : styles.dotApproaching]} />
        <Text variant="caption" tone={arrived ? 'secondary' : 'muted'}>
          {arrived
            ? `You are here — within ${reachM} m of ${site.name}`
            : `${formatDistance(distanceM, unit)} away`}
        </Text>
      </View>

      {/* Hidden once you have arrived: a full bar you can no longer move is
          just decoration, and the sentence above already says it. */}
      {arrived ? null : (
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.round(fraction * 100)}%` }]} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 7, height: 7, borderRadius: radii.full },
  // Lapis means alignment achieved and appears nowhere else in the app;
  // standing inside a site's own radius is the same class of fact.
  dotArrived: { backgroundColor: colors.alignmentLocked },
  dotApproaching: { backgroundColor: colors.sandstone },
  dotUnknown: { backgroundColor: colors.border },
  track: {
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  fill: { height: 3, borderRadius: radii.full, backgroundColor: colors.sandstone },
});
