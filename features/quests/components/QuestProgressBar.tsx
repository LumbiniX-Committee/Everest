import { StyleSheet, View } from 'react-native';

import { ProgressIndicator, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

export type QuestProgressBarProps = {
  completed: number;
  total: number;
  showDetails?: boolean;
};

export function QuestProgressBar({ completed, total, showDetails = true }: QuestProgressBarProps) {
  const percentage = Math.round((completed / Math.max(1, total)) * 100);

  return (
    <View style={styles.container}>
      <ProgressIndicator value={completed} total={total} color={colors.sandstone} showCount={false} />
      {showDetails ? (
        <View style={styles.footer}>
          <Text variant="caption" tone="muted">
            {completed} of {total} tasks
          </Text>
          <Text variant="caption" tone="muted">
            {percentage}%
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
