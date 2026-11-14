import { useCallback, type ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useHaptics } from '@/hooks';
import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, radii, spacing } from '@/theme';

import { Icon, type IconName } from './Icon';
import { Text } from './Text';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Visual height. The touch target is lifted to 44 by `hitSlop`. */
const CHIP_HEIGHT = 36;
const CHIP_SLOP = { top: 4, bottom: 4, left: 2, right: 2 };

export type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  /** A leading glyph, for a category filter. */
  icon?: IconName;
  /** A trailing count, such as how many places a filter holds. */
  count?: number;
};

/**
 * A compact, single-tap choice: a filter, a category, a step in the condition flow.
 *
 * Selection is carried by fill and border together, not by colour alone —
 * §33's smallest target devices are also the ones most often used outdoors in
 * bright sun, where a tint shift is the first thing to become invisible.
 */
export function Chip({ label, selected = false, onPress, disabled = false, style, icon, count }: ChipProps) {
  const { selection } = useHaptics();
  const language = useInterfaceLanguage();
  const displayLabel = visitorLiteralCopy(language, label);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    scale.set(withSpring(0.96, { damping: 16, stiffness: 400, mass: 0.6 }));
  }, [disabled, scale]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    scale.set(withSpring(1, { damping: 14, stiffness: 320, mass: 0.6 }));
  }, [disabled, scale]);

  const handlePress = useCallback(() => {
    if (disabled || !onPress) return;
    selection();
    onPress();
  }, [disabled, onPress, selection]);

  const foreground = selected ? colors.onPrimary : colors.textPrimary;

  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityLabel={count != null ? `${displayLabel}, ${count}` : displayLabel}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      hitSlop={CHIP_SLOP}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[styles.chip, selected && styles.selected, disabled && styles.disabled, style, animatedStyle]}
    >
      {icon ? <Icon name={icon} size={16} color={selected ? colors.onPrimary : colors.primary} /> : null}
      <Text variant="control" style={[styles.label, { color: foreground }]}>
        {displayLabel}
      </Text>
      {count != null ? (
        <Text variant="control" tone={selected ? 'inverse' : 'muted'} translate={false} style={styles.count}>
          {String(count)}
        </Text>
      ) : null}
    </AnimatedPressable>
  );
}

/**
 * One horizontal, scrolling row of chips that runs to the screen edges.
 *
 * Bleeds past the page gutter and pads its content back in, so the first chip
 * lines up with the text above it and is never clipped at the left edge. Sized
 * to its content: a horizontal ScrollView otherwise grows to fill a scrolling
 * page, which is what stretched chips to twice their height.
 */
export function ChipRow({ children, gutter = spacing.gutter, style }: { children: ReactNode; gutter?: number; style?: ViewStyle }) {
  return (
    <View style={[{ marginHorizontal: -gutter }, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.rowScroll}
        contentContainerStyle={[styles.row, { paddingHorizontal: gutter }]}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: CHIP_HEIGHT,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs + 2,
    paddingHorizontal: spacing.md + 2,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  selected: { backgroundColor: colors.primary, borderColor: colors.primary },
  disabled: { opacity: 0.45 },
  // Shrinks before it overflows, so a long condition label wraps inside a wide chip.
  label: { flexShrink: 1 },
  count: { opacity: 0.85 },
  rowScroll: { flexGrow: 0 },
  row: { gap: spacing.sm, alignItems: 'center', paddingVertical: spacing.xs },
});
