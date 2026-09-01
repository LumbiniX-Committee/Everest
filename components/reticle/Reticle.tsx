import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { colors, radii } from '@/theme';
import type { AlignmentPhase } from '@/types';

export type ReticleProps = {
  size?: number;
  /** 0–1. Drives how far the seeking ring has contracted toward the target. */
  progress?: number;
  phase?: AlignmentPhase;
  /**
   * Onboarding shows the reticle as an emblem rather than an instrument: it
   * breathes slowly and never claims a lock.
   */
  idleAnimation?: boolean;
};

/**
 * The reticle.
 *
 * This is the app's only emblem — no Buddha, no temple, no lotus. It is a
 * sighting instrument: an outer index ring, four cardinal ticks, and an inner
 * ring that contracts as alignment improves and seats when the device matches
 * the vantage.
 *
 * The colour transition is the entire feedback mechanism, so it is worth being
 * exact about it: teal while seeking and a more settled centre on a true lock.
 * Amber is reserved for the numeric turn warning in the readout below.
 */
export function Reticle({
  size = 200,
  progress = 0,
  phase = 'idle',
  idleAnimation = false,
}: ReticleProps) {
  const locked = phase === 'locked';
  // `manual` is the by-eye escape hatch: show it as inert (static, muted) rather
  // than seeking or locked — the instrument is not tracking, the user has taken over.
  const inert = phase === 'idle' || phase === 'unavailable' || phase === 'manual';

  const animatedProgress = useSharedValue(progress);
  const lockValue = useSharedValue(locked ? 1 : 0);
  const inertValue = useSharedValue(inert ? 1 : 0);
  const breath = useSharedValue(0);

  useEffect(() => {
    animatedProgress.value = withTiming(progress, {
      duration: 260,
      easing: Easing.out(Easing.quad),
    });
  }, [progress, animatedProgress]);

  useEffect(() => {
    // A lock should feel like a mechanism seating, not a fade.
    lockValue.value = withTiming(locked ? 1 : 0, { duration: locked ? 160 : 320 });
  }, [locked, lockValue]);

  useEffect(() => {
    inertValue.value = withTiming(inert ? 1 : 0, { duration: 240 });
  }, [inert, inertValue]);

  useEffect(() => {
    if (!idleAnimation) {
      breath.value = 0;
      return;
    }
    breath.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 2600, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [idleAnimation, breath]);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(breath.value, [0, 1], [1, 1.015]) }],
  }));

  const innerStyle = useAnimatedStyle(() => {
    // Contracts from just inside the outer ring down to the target diameter.
    const scale = interpolate(animatedProgress.value, [0, 1], [0.92, 0.52]);
    const color = interpolateColor(
      lockValue.value,
      [0, 1],
      [colors.alignmentSeeking, colors.alignmentLocked],
    );
    return {
      transform: [{ scale: scale * interpolate(breath.value, [0, 1], [1, 1.04]) }],
      borderColor: color,
      opacity: interpolate(inertValue.value, [0, 1], [1, 0.28]),
    };
  });

  const centreStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      lockValue.value,
      [0, 1],
      [colors.alignmentSeeking, colors.alignmentLocked],
    ),
    opacity: interpolate(inertValue.value, [0, 1], [1, 0.35]),
    transform: [{ scale: interpolate(lockValue.value, [0, 1], [1, 1.6]) }],
  }));

  const tickLength = size * 0.08;

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={reticleLabel(phase)}
      style={[styles.frame, { width: size, height: size }]}
    >
      <Animated.View style={[styles.ring, StyleSheet.absoluteFill, outerStyle]} />

      {/* Cardinal index ticks. Four marks, no compass letters — the numbers
          live in the readout beneath, not on the instrument face. */}
      <View style={[styles.tick, styles.tickTop, { height: tickLength }]} />
      <View style={[styles.tick, styles.tickBottom, { height: tickLength }]} />
      <View style={[styles.tickH, styles.tickLeft, { width: tickLength }]} />
      <View style={[styles.tickH, styles.tickRight, { width: tickLength }]} />

      <Animated.View style={[styles.ring, styles.innerRing, StyleSheet.absoluteFill, innerStyle]} />
      <Animated.View style={[styles.centre, centreStyle]} />
    </View>
  );
}

function reticleLabel(phase: AlignmentPhase): string {
  switch (phase) {
    case 'locked':
      return 'Aligned with the vantage point';
    case 'seeking':
      return 'Seeking alignment';
    case 'manual':
      return 'Framed by eye: alignment gate bypassed';
    case 'unavailable':
      return 'Alignment unavailable';
    case 'idle':
      return 'Reticle';
  }
}

const styles = StyleSheet.create({
  frame: { alignItems: 'center', justifyContent: 'center' },
  ring: {
    borderWidth: 1,
    borderRadius: radii.full,
    borderColor: colors.border,
  },
  innerRing: { borderWidth: 1.5 },
  centre: {
    width: 5,
    height: 5,
    borderRadius: radii.full,
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
});
