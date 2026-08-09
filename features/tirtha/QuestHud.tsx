import { useCallback, useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

/**
 * The quest marker, floating over the world.
 *
 * Not a map pin and not attached to a coordinate — it is HUD, in screen space,
 * the way a mission indicator is. It says "there is something to do where you
 * are standing", which is a fact about the player rather than about a point on
 * the ground.
 *
 * It pulses only when there is an unstarted quest here. A control that animates
 * permanently stops meaning anything, and this one has exactly one thing to
 * say.
 */

export type QuestHudProps = {
  /** Quests belonging to the place the player is at. */
  available: number;
  completed: number;
  total: number;
  /** True when at least one quest here has not been done — the reason to pulse. */
  pulse: boolean;
  onPress: () => void;
};

export function QuestHud({ available, completed, total, pulse, onPress }: QuestHudProps) {
  const beat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!pulse) {
      beat.stopAnimation();
      beat.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(beat, { toValue: 0, duration: 0, useNativeDriver: true }),
        Animated.delay(700),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, beat]);

  if (total === 0) return null;

  const done = completed >= total;

  return (
    <View style={styles.wrap} pointerEvents="box-none">
      {/* A ring that expands and fades out from under the button. Rendered
          behind and ignored by touch, so it can never eat the tap it is
          drawing attention to. */}
      {pulse ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.ping,
            {
              opacity: beat.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
              transform: [
                { scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.9] }) },
              ],
            },
          ]}
        />
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={
          done
            ? `Quests here complete, ${completed} of ${total}`
            : `${available} quest${available === 1 ? '' : 's'} available here, ${completed} of ${total} done`
        }
        accessibilityHint="Opens the quests for this place"
        onPress={onPress}
        style={({ pressed }) => [styles.button, done && styles.buttonDone, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>{done ? '🏆' : '🎯'}</Text>
        <Text variant="caption" tone={done ? 'sandstone' : 'secondary'} style={styles.count}>
          {completed}/{total}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  ping: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: radii.full,
    backgroundColor: colors.sandstone,
  },
  button: {
    width: 58,
    height: 58,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.sandstone,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  buttonDone: { borderColor: colors.resolved },
  pressed: { opacity: 0.75 },
  icon: { fontSize: 20, lineHeight: 24 },
  count: { fontSize: 10, fontWeight: '700', lineHeight: 12 },
});

/**
 * A short, self-dismissing banner for something that just happened.
 *
 * Deliberately not a modal: a quest completing should not interrupt the walk it
 * happened during. §14's refusal of chat furniture applies to celebration too —
 * this states what was recorded and gets out of the way.
 */
export function RewardToast({
  title,
  detail,
  visible,
  onHide,
}: {
  title: string;
  detail?: string;
  visible: boolean;
  onHide: () => void;
}) {
  const enter = useRef(new Animated.Value(0)).current;
  // Keep the latest onHide in a ref so the animation effect never lists it
  // as a dependency. onHide is an inline arrow in the parent and gets a new
  // identity on every render (GPS ticks, demo walk updates). Listing it caused
  // the effect to restart the animation on every parent re-render, producing
  // the repeated flickering toast.
  const onHideRef = useRef(onHide);
  onHideRef.current = onHide;

  useEffect(() => {
    if (!visible) return;
    enter.setValue(0);
    const anim = Animated.sequence([
      Animated.timing(enter, {
        toValue: 1,
        duration: 260,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
      Animated.delay(2400),
      Animated.timing(enter, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start(({ finished }) => {
      if (finished) onHideRef.current();
    });
    return () => anim.stop();
    // Only restart when visibility flips — NOT when onHide changes identity.
  }, [visible, enter]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles2.toast,
        {
          opacity: enter,
          transform: [
            { translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { scale: enter.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) },
          ],
        },
      ]}
    >
      <Text variant="label" tone="sandstone" uppercase center>
        {title}
      </Text>
      {detail ? (
        <Text variant="caption" tone="secondary" center>
          {detail}
        </Text>
      ) : null}
    </Animated.View>
  );
}

const styles2 = StyleSheet.create({
  toast: {
    alignSelf: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.sandstone,
    elevation: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
});
