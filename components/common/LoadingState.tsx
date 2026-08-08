import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export type LoadingStateProps = {
  /**
   * What is being waited on, as a statement: "Acquiring position",
   * "Reading the record". Never "Loading…" — on a screen where a GPS fix can
   * take thirty seconds, naming the wait is the difference between patience
   * and a suspected crash.
   */
  label?: string;
  /** Fills the available space rather than sitting inline. */
  fill?: boolean;
};

export function LoadingState({ label, fill = true }: LoadingStateProps) {
  return (
    <View
      style={[styles.wrap, fill && styles.fill]}
      accessibilityRole="progressbar"
      accessibilityLabel={label ?? 'Loading'}
    >
      <ActivityIndicator color={colors.sandstoneDeep} />
      {label ? (
        <Text variant="caption" tone="muted" center>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  fill: { flex: 1 },
});
