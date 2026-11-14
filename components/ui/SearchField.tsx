import { Pressable, StyleSheet, TextInput, View, type ViewStyle } from 'react-native';

import { useInterfaceLanguage } from '@/i18n/context';
import { visitorLiteralCopy } from '@/i18n/literals';
import { colors, radii, spacing, text } from '@/theme';

import { Icon } from './Icon';

export type SearchFieldProps = {
  value: string;
  onChangeText: (next: string) => void;
  placeholder: string;
  style?: ViewStyle;
};

/** A single-line filter box with a clear control. Filters what is already on screen; it never searches the network. */
export function SearchField({ value, onChangeText, placeholder, style }: SearchFieldProps) {
  const language = useInterfaceLanguage();
  const hint = visitorLiteralCopy(language, placeholder);
  return (
    <View style={[styles.field, style]}>
      <Icon name="magnify" size={20} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={hint}
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={hint}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        clearButtonMode="never"
        style={[text('body'), styles.input]}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visitorLiteralCopy(language, 'Clear search')}
          hitSlop={12}
          onPress={() => onChangeText('')}
        >
          <Icon name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: { flex: 1, color: colors.textPrimary, paddingVertical: spacing.sm },
});
