import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Icon } from '@/components/ui';
import { colors, radii } from '@/theme';

/**
 * The Settings entry, sat in each surface's header.
 *
 * A drawn icon, not `⚙`: that character is in the emoji range, so Android hands
 * it to the emoji font and renders a blue gear no `color` can touch. 44dp
 * regardless of the icon's own size, because that is the touch target.
 */
export function SettingsButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      accessibilityHint="Preferences, permissions, sync and storage"
      onPress={() => router.push('/(main)/settings')}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="cog-outline" size={22} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
  },
  pressed: { backgroundColor: colors.surfaceSecondary },
});
