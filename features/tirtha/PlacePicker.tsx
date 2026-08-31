import { Pressable, StyleSheet, View } from 'react-native';

import { SiteVisual } from '@/components/site';
import { BottomSheet, Text } from '@/components/ui';
import { demoSites } from '@/data';
import { colors, radii, spacing } from '@/theme';
import type { Coordinate } from '@/types';
import { distanceMeters, formatDistance } from '@/utils';

/**
 * Where to go next.
 *
 * The world opened on one fixed view and offered no way to look anywhere else,
 * so every place beyond the Sacred Garden — the monastic zones, Tilaurakot 27 km
 * out — existed in the data and nowhere a player could reach. This is the list
 * that makes them reachable.
 *
 * It takes the camera there always, and the player too when the walk is
 * driving: a demonstration nobody can steer is a video, and someone showing the
 * app should be able to say "now the pillar" and be at the pillar. On a real
 * device the player is wherever their feet are — the camera moves, the figure
 * does not, and the distance shown is the honest one.
 */

export type PlacePickerProps = {
  visible: boolean;
  onClose: () => void;
  /** Where the player is, for the distances. Null before the first fix. */
  coordinate: Coordinate | null;
  /** The site the player is standing at, marked so the list says "you are here". */
  atSiteId: string | null;
  /** True when the walk can actually carry the player there. */
  canTravel: boolean;
  onSelect: (siteId: string) => void;
};

export function PlacePicker({
  visible,
  onClose,
  coordinate,
  atSiteId,
  canTravel,
  onSelect,
}: PlacePickerProps) {
  // Nearest first. A list of places to walk to that is not ordered by how far
  // away they are is a list you have to read rather than scan.
  const places = [...demoSites]
    .map((site) => ({
      site,
      distanceM: coordinate ? distanceMeters(coordinate, site.coordinate) : null,
    }))
    .sort((a, b) => (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Go to"
      subtitle={canTravel ? 'Takes you there' : 'Moves the view; your position is your own'}
      scroll
    >
      <View style={styles.list}>
        {places.map(({ site, distanceM }) => {
          const here = site.id === atSiteId;
          return (
            <Pressable
              key={site.id}
              accessibilityRole="button"
              accessibilityLabel={site.name}
              accessibilityHint={
                here ? 'You are already here' : canTravel ? 'Travel here' : 'Move the view here'
              }
              onPress={() => onSelect(site.id)}
              style={({ pressed }) => [styles.row, here && styles.rowHere, pressed && styles.pressed]}
            >
              <SiteVisual siteId={site.id} height={76} quiet style={styles.thumb} />

              <View style={styles.rowText}>
                <Text variant="heading" numberOfLines={1} ellipsizeMode="tail">
                  {site.name}
                </Text>
                {site.summary ? (
                  <Text variant="caption" tone="secondary" numberOfLines={1} ellipsizeMode="tail">
                    {site.summary}
                  </Text>
                ) : null}
              </View>
              <Text variant="mono" tone="sandstone" numberOfLines={1}>
                {here ? 'you are here' : distanceM !== null ? formatDistance(distanceM) : '—'}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm, paddingBottom: spacing.base },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    minHeight: 94,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  rowHere: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSelected },
  pressed: { opacity: 0.7 },
  thumb: { width: 76 },
  rowText: { flex: 1, minWidth: 0, gap: spacing.xs },
});
