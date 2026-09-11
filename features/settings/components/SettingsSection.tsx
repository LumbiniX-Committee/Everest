import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Divider, Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type SettingsSectionProps = {
  title?: string;
  /** Sits below the grouped rows, for a caveat the rows cannot carry. */
  footnote?: string;
  children: ReactNode;
  /** A hairline between each row, as in a classic grouped list. Off by default. */
  divided?: boolean;
};

/** A titled group of rows on one raised surface. */
export function SettingsSection({ title, footnote, children, divided = false }: SettingsSectionProps) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.wrap}>
      {title ? (
        <Text variant="label" tone="muted" uppercase style={styles.title}>
          {title}
        </Text>
      ) : null}
      <View style={styles.surface}>
        {divided
          ? rows.map((row, index) => (
              <Fragment key={index}>
                {index > 0 ? <Divider inset /> : null}
                {row}
              </Fragment>
            ))
          : rows}
      </View>
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
