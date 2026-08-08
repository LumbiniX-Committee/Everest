import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Reticle } from '@/components/reticle';
import { Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { AlignmentPhase } from '@/types';

/**
 * The alignment, rehearsed once before it matters.
 *
 * Everything else in this app is eventually explained by a sentence. This is
 * not: aligning a device to a fixed vantage until the reticle locks is a
 * physical skill, and reading "align the reticle to the vantage" teaches
 * nobody what that feels like. So the introduction hands it over — drag the
 * reticle onto the mark, watch the instrument close on it, feel the lock.
 *
 * It is deliberately the only interactive moment in onboarding. §30 asks the
 * app to recede, and a second flourish would spend what this one earns.
 *
 * The lapis is honest here. `alignmentLocked` is reserved for "you are standing
 * in the right place, facing the right way", and that is exactly what this is —
 * a rehearsal of that state, not a decorative use of its colour.
 */

/** How near the mark counts as aligned, in points. */
const LOCK_RADIUS = 26;

/** Travel beyond which the instrument reports nothing — the far end of seeking. */
const SEEK_RANGE = 150;

export type AlignmentRehearsalProps = {
  /** Called once, the first time the reticle locks. */
  onLocked?: () => void;
  size?: number;
};

export function AlignmentRehearsal({ onLocked, size = 132 }: AlignmentRehearsalProps) {
  const { preferences } = usePreferences();
  const [phase, setPhase] = useState<AlignmentPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [hasLocked, setHasLocked] = useState(false);

  // The offset the drag starts from, so a second drag does not jump.
  const x = useSharedValue(78);
  const y = useSharedValue(54);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const report = useCallback(
    (nextPhase: AlignmentPhase, nextProgress: number) => {
      setPhase(nextPhase);
      setProgress(nextProgress);
    },
    [],
  );

  const lock = useCallback(() => {
    if (hasLocked) return;
    setHasLocked(true);
    // The pulse is the whole point of rehearsing: on site, the lock is often
    // felt before it is seen, because the phone is held at arm's length.
    if (preferences.hapticsEnabled) {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    onLocked?.();
  }, [hasLocked, onLocked, preferences.hapticsEnabled]);

  const pan = Gesture.Pan()
    .onBegin(() => {
      startX.value = x.value;
      startY.value = y.value;
    })
    .onUpdate((event) => {
      const nx = startX.value + event.translationX;
      const ny = startY.value + event.translationY;
      const distance = Math.sqrt(nx * nx + ny * ny);

      if (distance <= LOCK_RADIUS) {
        // Snap the last few points. An instrument that has found its vantage
        // should settle onto it rather than hover, and without this the reticle
        // trembles against the mark and never reads as locked.
        x.value = withSpring(0, { damping: 18, stiffness: 220 });
        y.value = withSpring(0, { damping: 18, stiffness: 220 });
        runOnJS(report)('locked', 1);
        runOnJS(lock)();
        return;
      }

      x.value = nx;
      y.value = ny;
      const closeness = Math.max(0, 1 - (distance - LOCK_RADIUS) / SEEK_RANGE);
      runOnJS(report)('seeking', closeness);
    })
    .onFinalize(() => {
      const distance = Math.sqrt(x.value * x.value + y.value * y.value);
      if (distance > LOCK_RADIUS) runOnJS(report)('seeking', 0.05);
    });

  const reticleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }, { translateY: y.value }],
  }));

  // The mark brightens as the instrument closes on it, so the target confirms
  // the approach rather than sitting inert while only the reticle responds.
  const markOpacity = useSharedValue(0.35);
  useEffect(() => {
    markOpacity.value = withTiming(phase === 'locked' ? 1 : 0.35 + progress * 0.4, {
      duration: 160,
    });
  }, [phase, progress, markOpacity]);

  const markStyle = useAnimatedStyle(() => ({ opacity: markOpacity.value }));

  return (
    <View style={styles.wrap}>
      <View style={styles.stage}>
        <Animated.View style={[styles.mark, markStyle]}>
          <View style={[styles.markRing, hasLocked && styles.markRingLocked]} />
        </Animated.View>

        <GestureDetector gesture={pan}>
          <Animated.View
            style={[styles.reticle, reticleStyle]}
            accessibilityRole="adjustable"
            accessibilityLabel="Practice reticle"
            accessibilityHint="Drag onto the mark to align"
          >
            <Reticle size={size} phase={phase} progress={progress} />
          </Animated.View>
        </GestureDetector>
      </View>

      <Text variant="caption" tone={hasLocked ? 'locked' : 'muted'} center>
        {hasLocked ? 'Aligned. That is the whole gesture.' : 'Drag the reticle onto the mark.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.base, alignItems: 'center' },
  stage: {
    height: 236,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  mark: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  markRing: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.textMuted,
  },
  markRingLocked: { borderColor: colors.alignmentLocked, borderStyle: 'solid' },
  reticle: { position: 'absolute' },
});
