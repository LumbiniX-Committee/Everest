import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { Text } from '@/components/ui';
import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type ChoiceOption<T extends string> = {
  value: T;
  label: string;
  hint: string;
};

export type SettingsChoiceProps<T extends string> = {
  legend: string;
  options: ChoiceOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
};

/**
 * A single-choice group, laid out as rows rather than a picker.
 *
 * Every option shows its consequence in a line of text underneath. A dropdown
 * would hide those, and these are choices where the label alone ("Strict",
 * "Forgiving") does not tell a first-time user what they are agreeing to.
 */
export function SettingsChoice<T extends string>({
  legend,
  options,
  selected,
  onSelect,
}: SettingsChoiceProps<T>) {
  const { selection } = useHaptics();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={legend} style={styles.group}>
      {options.map((option) => (
        <ChoiceRow
          key={option.value}
          option={option}
          isSelected={option.value === selected}
          onSelect={(val) => {
            selection();
            onSelect(val as T);
          }}
        />
      ))}
    </View>
  );
}

function ChoiceRow<T extends string>({
  option,
  isSelected,
  onSelect,
}: {
  option: ChoiceOption<T>;
  isSelected: boolean;
  onSelect: (val: string) => void;
}) {
  const scale = useSharedValue(1);
  const dotScale = useSharedValue(isSelected ? 1 : 0.8);

  useEffect(() => {
    if (isSelected) {
      dotScale.value = withSequence(
        withTiming(0.6, { duration: 60 }),
        withSpring(1.2, { damping: 10, stiffness: 280, mass: 0.6 }),
        withSpring(1, { damping: 12, stiffness: 300, mass: 0.6 }),
      );
    } else {
      dotScale.value = withTiming(0.8, { duration: 120 });
    }
  }, [isSelected, dotScale]);

  const rowAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const dotAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.985, { damping: 15, stiffness: 350, mass: 0.7 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 280, mass: 0.7 });
  }, [scale]);

  return (
    <AnimatedPressable
      accessibilityRole="radio"
      accessibilityState={{ selected: isSelected, checked: isSelected }}
      accessibilityLabel={option.label}
      accessibilityHint={option.hint}
      onPress={() => onSelect(option.value)}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.option,
        isSelected && styles.optionSelected,
        rowAnimStyle,
      ]}
    >
      <View style={styles.textColumn}>
        <Text variant="body" tone={isSelected ? 'sandstone' : 'primary'}>
          {option.label}
        </Text>
        <Text variant="caption" tone="muted">
          {option.hint}
        </Text>
      </View>
      {/* Not the only signal — the selected row also carries a border and
          a toned label, so the choice survives a colourblind reading. */}
      <Animated.View style={dotAnimStyle}>
        <Text
          variant="body"
          tone={isSelected ? 'sandstone' : 'muted'}
          accessibilityElementsHidden
          importantForAccessibility="no"
        >
          {isSelected ? '●' : '○'}
        </Text>
      </Animated.View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 44,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionSelected: { borderColor: colors.sandstone, backgroundColor: colors.surfaceSecondary },
  textColumn: { flex: 1, gap: spacing.xxs },
});

