import { Pressable, StyleSheet } from 'react-native';
import type { Href } from 'expo-router';

import { Icon, Text } from '@/components/ui';
import { useHaptics, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, radii, spacing } from '@/theme';

/**
 * The back control for screens with their own title block.
 *
 * Every pushed screen needs a visible way out. The stacks run without native
 * headers, so without this one, edge-swipe was the only route back.
 */
export function BackBar({ fallback, onBack }: { fallback?: Href; onBack?: () => void }) {
  const safeBack = useSafeBack(fallback);
  const { selection } = useHaptics();
  const ui = useVisitorLiteralCopy();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ui('Back')}
      hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
      onPress={() => {
        selection();
        (onBack ?? safeBack)();
      }}
      style={({ pressed }) => [styles.back, pressed && styles.pressed]}
    >
      <Icon name="chevron-left" size={24} color={colors.textSecondary} />
      <Text variant="body" tone="secondary">
        Back
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    minHeight: 44,
    paddingRight: spacing.md,
    borderRadius: radii.md,
  },
  pressed: { opacity: 0.6 },
});
