import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type SettingsSectionProps = {
  title?: string;
  /** Sits below the grouped rows, for a caveat the rows cannot carry. */
  footnote?: string;
  children: ReactNode;
};

/** A titled group of rows on one raised surface. */
export function SettingsSection({ title, footnote, children }: SettingsSectionProps) {
  return (
    <View style={styles.wrap}>
      {title ? (
        <Text variant="label" tone="muted" uppercase style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.surface}>{children}</View>
      {footnote ? (
        <Text variant="caption" tone="muted" style={styles.footnote}>
          {footnote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, marginBottom: spacing.lg },
  title: { paddingHorizontal: spacing.xs },
  surface: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  footnote: { paddingHorizontal: spacing.xs },
});
