import { StyleSheet, View } from 'react-native';

import { spacing } from '@/theme';

import { Text } from './Text';

export type MetaRowProps = {
  label: string;
  value: string;
  /** Values that are measurements set in mono; prose values do not. */
  mono?: boolean;
  tone?: 'primary' | 'secondary' | 'locked' | 'seeking' | 'warning' | 'open' | 'resolved';
};

/**
 * A label/value pair as it would appear on a survey record. Used for
 * coordinates, bearings, distances and timestamps.
 */
export function MetaRow({ label, value, mono = true, tone = 'primary' }: MetaRowProps) {
  return (
    <View style={styles.row}>
      <Text variant="label" tone="muted" uppercase style={styles.label}>
        {label}
      </Text>
      <Text variant={mono ? 'mono' : 'caption'} tone={tone} style={styles.value}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    gap: spacing.base,
  },
  label: { flexShrink: 0 },
  value: { flexShrink: 1, textAlign: 'right' },
});
