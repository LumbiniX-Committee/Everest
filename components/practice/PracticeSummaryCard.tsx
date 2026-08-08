import { StyleSheet, View } from 'react-native';

import { ProgressIndicator, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import { DAILY_PRACTICE_LIMIT, type PracticeSummary } from '@/types';

export type PracticeSummaryCardProps = {
  summary: PracticeSummary;
};

/**
 * A day's practice, and the record behind it.
 *
 * The progress bar is the one place this could have gone wrong. It is a
 * *sufficiency* meter, not a target: filling it means the day is done, and the
 * copy underneath says so. It is drawn in sandstone, never in the locked blue,
 * because that colour means the device matches a viewpoint and must not come to
 * mean "goal achieved".
 *
 * Nothing here compares the person to anyone, to their own past, or to a
 * streak. The lifetime numbers are stated as a record, in the same register as [lint-vocab:allow — naming the anti-pattern we refuse]
 * the rest of the app's metadata.
 */
export function PracticeSummaryCard({ summary }: PracticeSummaryCardProps) {
  return (
    <View style={styles.wrap}>
      <ProgressIndicator
        value={summary.todayCount}
        total={DAILY_PRACTICE_LIMIT}
        label="Today"
        color={summary.dayComplete ? colors.resolved : colors.sandstone}
      />

      <Text variant="body" tone={summary.dayComplete ? 'primary' : 'secondary'}>
        {summary.dayComplete
          ? 'You’ve done enough today. The record will keep.'
          : summary.todayCount === 0
            ? 'Nothing recorded yet today.'
            : 'A day’s practice does not have to be a long one.'}
      </Text>

      {summary.totalCount > 0 ? (
        <View style={styles.record}>
          <Text variant="caption" tone="muted">
            {summary.totalCount} {summary.totalCount === 1 ? 'act' : 'acts'} recognised
            {summary.sitesWitnessed > 0
              ? ` · ${summary.sitesWitnessed} ${summary.sitesWitnessed === 1 ? 'site' : 'sites'} witnessed`
              : ''}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  record: { paddingTop: spacing.xs },
});
