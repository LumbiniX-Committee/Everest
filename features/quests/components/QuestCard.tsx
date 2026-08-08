import { StyleSheet, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';
import type { QuestWithProgress } from '@/types';

import { QuestCategoryBadge } from './QuestCategoryBadge';
import { QuestProgressBar } from './QuestProgressBar';

export type QuestCardProps = {
  quest: QuestWithProgress;
  onPress: () => void;
};

export function QuestCard({ quest, onPress }: QuestCardProps) {
  const { progress, tasks, category, title, subtitle, estimatedMinutes } = quest;
  const completedCount = progress.completedTasks.length;
  const totalTasks = tasks.length;
  const isCompleted = progress.status === 'completed';
  const isInProgress = progress.status === 'in_progress';

  return (
    <Card onPress={onPress} accessibilityLabel={`Quest: ${title}`}>
      <View style={styles.header}>
        <QuestCategoryBadge category={category} />
        <View style={styles.badges}>
          {isCompleted ? (
            <View style={[styles.statusTag, styles.statusCompleted]}>
              <Text variant="label" uppercase style={{ color: colors.resolved }}>
                Completed
              </Text>
            </View>
          ) : isInProgress ? (
            <View style={[styles.statusTag, styles.statusActive]}>
              <Text variant="label" uppercase style={{ color: colors.sandstoneDeep }}>
                Active
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Text variant="heading" style={styles.title}>
        {title}
      </Text>
      <Text variant="body" tone="secondary" style={styles.subtitle} numberOfLines={2}>
        {subtitle}
      </Text>

      <View style={styles.metaRow}>
        <Text variant="caption" tone="muted">
          ⏱ ~{estimatedMinutes} mins
        </Text>
        <Text variant="caption" tone="muted">
          {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
        </Text>
      </View>

      {isInProgress || isCompleted ? (
        <View style={styles.progressSection}>
          <QuestProgressBar completed={completedCount} total={totalTasks} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  badges: { flexDirection: 'row', gap: spacing.xs },
  statusTag: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: 12 },
  statusCompleted: {
    backgroundColor: colors.surfaceSecondary,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.resolved,
  },
  statusActive: { backgroundColor: colors.surfaceSecondary },
  title: { marginTop: spacing.xs },
  subtitle: { marginTop: spacing.xxs },
  metaRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm, alignItems: 'center' },
  progressSection: { marginTop: spacing.md },
});
