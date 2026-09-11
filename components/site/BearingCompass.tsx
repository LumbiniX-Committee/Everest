import { StyleSheet, View } from 'react-native';

import { colors, radii } from '@/theme';

export type BearingCompassProps = {
  /** Target compass bearing in degrees, 0–360, true north. */
  bearingDeg: number;
  size?: number;
};

/**
 * A small instrument face for a saved viewpoint: cardinal ticks, as on the
 * alignment `Reticle`, plus a needle rotated to the vantage's target bearing.
 * No compass letters on the face — the exact bearing is set in the reading
 * beside it, same convention as the full-size reticle.
 */
export function BearingCompass({ bearingDeg, size = 56 }: BearingCompassProps) {
  const angle = ((bearingDeg % 360) + 360) % 360;
  const tickLength = size * 0.14;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.frame, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={[styles.tick, styles.tickTop, { height: tickLength }]} />
      <View style={[styles.tick, styles.tickBottom, { height: tickLength }]} />
      <View style={[styles.tickH, styles.tickLeft, { width: tickLength }]} />
      <View style={[styles.tickH, styles.tickRight, { width: tickLength }]} />
      <View style={[styles.needle, { transform: [{ rotate: `${angle}deg` }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceRaised,
  },
  tick: {
    position: 'absolute',
    width: 1,
    backgroundColor: colors.textMuted,
  },
  tickH: {
    position: 'absolute',
    height: 1,
    backgroundColor: colors.textMuted,
  },
  tickTop: { top: 0 },
  tickBottom: { bottom: 0 },
  tickLeft: { left: 0 },
  tickRight: { right: 0 },
  needle: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderBottomWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.primary,
    borderRadius: radii.none,
  },
});
