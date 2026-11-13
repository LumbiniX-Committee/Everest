import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';
import type { Coordinate } from '@/types';

import { MapWebView } from './MapWebView';
import { nearestModel } from './nearestModel';

export type SiteMap3DProps = {
  /** Height of the map block. The map is a panel on a scrolling page. */
  height?: number;
  /** Tapping a monument. */
  onSelectSite?: (siteId: string) => void;
  /**
   * Where the visitor is, or the area they chose to start in. The panel opens
   * on the real 3D monument nearest to it.
   */
  near?: Coordinate | null;
};

/**
 * The map panel on Tīrtha: a close, tilted view of the nearest real monument.
 *
 * Drawn through the WebView map, not MapLibre Native. Native has no 3D model
 * support, so it could only stand plain boxes where the temples are; the
 * WebView draws the scans and our detailed models among the town, the same
 * as the full-screen map this panel opens. The opening point is read once:
 * the panel is a preview, and re-aiming it at every location fix would make
 * the page jump while someone reads it.
 */
export function SiteMap3D({ height = 320, onSelectSite, near }: SiteMap3DProps) {
  const [centre] = useState(() => nearestModel(near));
  return (
    <View style={[styles.wrap, { height }]}>
      <MapWebView height={height} onSelectSite={onSelectSite} showFigure openIn3d initialCenter={centre} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSecondary,
  },
});
