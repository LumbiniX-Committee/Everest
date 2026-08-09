import { useState } from 'react';
import { StyleSheet, View, Image, type LayoutChangeEvent } from 'react-native';

import { Text } from '@/components/ui';
import { LUMBINI_BOUNDS } from '@/constants';
import { colors, radii, spacing } from '@/theme';
import type { Coordinate, HeritageSite } from '@/types';
import { MONK_STILL } from '@/components/monk';

/**
 * A schematic site plan, not a map.
 *
 * There is deliberately no map SDK here. A tiled basemap would bring a native
 * dependency, an API key, and a visual language — road colours, POI pins — that
 * fights everything else in this app. What an observer needs on the explore
 * surface is relative position within the sacred garden, which a measured plan
 * gives more legibly than a satellite tile.
 *
 * When a real basemap is justified, it slots in behind this component's props
 * without any caller changing.
 */
export function SitePlan({
  sites,
  observer,
  selectedSiteId,
  onSelectSite,
  height = 220,
}: {
  sites: HeritageSite[];
  observer?: Coordinate | null;
  selectedSiteId?: string;
  onSelectSite?: (siteId: string) => void;
  height?: number;
}) {
  const [width, setWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => setWidth(event.nativeEvent.layout.width);

  // Normalise a coordinate into the plan's pixel box. North is up.
  const project = (coordinate: Coordinate) => {
    const x =
      (coordinate.longitude - LUMBINI_BOUNDS.west) /
      (LUMBINI_BOUNDS.east - LUMBINI_BOUNDS.west);
    const y =
      (LUMBINI_BOUNDS.north - coordinate.latitude) /
      (LUMBINI_BOUNDS.north - LUMBINI_BOUNDS.south);
    return { left: clamp(x) * width, top: clamp(y) * height };
  };

  return (
    <View style={[styles.frame, { height }]} onLayout={onLayout}>
      {/* Survey grid. Four cells, hairline — a reference, not a decoration. */}
      <View style={[styles.grid, styles.gridVertical]} />
      <View style={[styles.grid, styles.gridHorizontal]} />

      <Text variant="label" tone="muted" uppercase style={styles.northMark}>
        N
      </Text>

      {width > 0 &&
        sites.map((site) => {
          const { left, top } = project(site.coordinate);
          const selected = site.id === selectedSiteId;
          return (
            <View
              key={site.id}
              accessible
              accessibilityRole={onSelectSite ? 'button' : 'image'}
              accessibilityLabel={site.name}
              onTouchEnd={onSelectSite ? () => onSelectSite(site.id) : undefined}
              style={[styles.marker, selected && styles.markerSelected, { left: left - 5, top: top - 5 }]}
            />
          );
        })}

      {width > 0 && observer ? (
        <Image
          accessible
          accessibilityLabel="Your position"
          source={MONK_STILL}
          style={[styles.observer, positionStyle(project(observer))]}
          resizeMode="contain"
        />
      ) : null}
    </View>
  );
}

function positionStyle({ left, top }: { left: number; top: number }) {
  return { left: left - 16, top: top - 16 };
}

function clamp(value: number) {
  return Math.min(1, Math.max(0, value));
}

const styles = StyleSheet.create({
  frame: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  grid: { position: 'absolute', backgroundColor: colors.border },
  gridVertical: { width: StyleSheet.hairlineWidth, top: 0, bottom: 0, left: '50%' },
  gridHorizontal: { height: StyleSheet.hairlineWidth, left: 0, right: 0, top: '50%' },
  northMark: { position: 'absolute', top: spacing.sm, right: spacing.md },
  marker: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: radii.full,
    backgroundColor: colors.sandstoneDeep,
  },
  markerSelected: {
    backgroundColor: colors.earth,
    transform: [{ scale: 1.4 }],
  },
  observer: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
});
