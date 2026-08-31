import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { Icon } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { colors, radii } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * The Settings entry, sat in each surface's header.
 *
 * A drawn icon, not `⚙`: that character is in the emoji range, so Android hands
 * it to the emoji font and renders a blue gear no `color` can touch. 44dp
 * regardless of the icon's own size, because that is the touch target.
 */
export function SettingsButton() {
  const router = useRouter();
  const { pulse } = useHaptics();
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 14, stiffness: 350, mass: 0.6 });
    rotation.value = withSpring(35, { damping: 12, stiffness: 300, mass: 0.6 });
  }, [rotation, scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.6 });
    rotation.value = withSpring(0, { damping: 12, stiffness: 280, mass: 0.6 });
  }, [rotation, scale]);

  const handlePress = useCallback(() => {
    pulse(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(main)/settings');
  }, [pulse, router]);

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      accessibilityHint="Preferences, permissions, sync and storage"
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.button, animatedStyle]}
    >
      <Icon name="cog-outline" size={25} color={colors.textSecondary} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
});
