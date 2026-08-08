import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii } from '@/theme';

/**
 * The Settings entry, sat in each surface's header.
 *
 * A glyph rather than an icon font: nothing else in the app pulls one in, and
 * one control is not worth the dependency. 44dp regardless of the glyph's own
 * size, because that is the touch target, not the character.
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
      <Text variant="body" tone="secondary">
        ⚙
      </Text>
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
