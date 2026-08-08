import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState, ScreenHeader } from '@/components/common';
import { Button, Card, Screen, Text } from '@/components/ui';
import { useQuests } from '@/store/quests';
import { colors, spacing } from '@/theme';

import { QuestCategoryBadge } from './components/QuestCategoryBadge';
import { QuestProgressBar } from './components/QuestProgressBar';
import { QuestTaskItem } from './components/QuestTaskItem';

export function QuestDetailScreen({ questId }: { questId: string }) {
  const router = useRouter();
  const { hydrated, getQuestById, startQuest, completeTask } = useQuests();

  if (!hydrated) return <LoadingState label="Reading quest details" />;

  const quest = getQuestById(questId);
  if (!quest) {
    return (
      <Screen>
        <ErrorState
          title="Quest Not Found"
          body="The requested quest could not be found."
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const { progress, tasks, title, subtitle, description, intention, category, difficulty, estimatedMinutes } = quest;
  const isNotStarted = progress.status === 'not_started';
  const isCompleted = progress.status === 'completed';

  const handleTaskToggle = async (taskId: string) => {
    const isTaskDone = progress.completedTasks.includes(taskId);
    if (isTaskDone) return;

    const result = await completeTask(questId, taskId);
    if (result.questCompleted) {
      router.replace(`/(main)/tirtha/quests/completed/${questId}`);
    }
  };

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Quest Details"
        title={title}
        subtitle={subtitle}
      />

      <Card style={styles.summaryCard}>
        <View style={styles.headerRow}>
          <QuestCategoryBadge category={category} />
          <Text variant="label" uppercase tone="muted">
            Difficulty: {difficulty}
          </Text>
        </View>

        <Text variant="body" tone="secondary" style={styles.description}>
          {description}
        </Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text variant="caption" tone="muted">ESTIMATED TIME</Text>
            <Text variant="heading">~{estimatedMinutes} mins</Text>
          </View>
        </View>

        <Text variant="caption" tone="muted">WHY THIS MATTERS</Text>
        <Text variant="body" style={{ color: colors.sandstoneDeep }}>
          {intention}
        </Text>

        {!isNotStarted ? (
          <View style={styles.progressWrap}>
            <QuestProgressBar completed={progress.completedTasks.length} total={tasks.length} />
          </View>
        ) : null}
      </Card>

      {isNotStarted ? (
        <View style={styles.actionWrap}>
          <Button
            label="Begin Quest"
            variant="primary"
            block
            onPress={() => void startQuest(questId)}
          />
        </View>
      ) : (
        <View style={styles.tasksSection}>
          <Text variant="heading" style={styles.tasksHeader}>
            Tasks ({progress.completedTasks.length}/{tasks.length})
          </Text>
          {tasks.map((task) => (
            <QuestTaskItem
              key={task.id}
              task={task}
              completed={progress.completedTasks.includes(task.id)}
              disabled={isCompleted || isNotStarted}
              onToggle={() => void handleTaskToggle(task.id)}
            />
          ))}
        </View>
      )}

      {isCompleted ? (
        <View style={styles.actionWrap}>
          <Button
            label="View Completion Summary"
            variant="secondary"
            block
            onPress={() => router.push(`/(main)/tirtha/quests/completed/${questId}`)}
          />
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summaryCard: { gap: spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  description: { lineHeight: 22 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: spacing.sm },
  statItem: { alignItems: 'center', gap: spacing.xxs },
  progressWrap: { paddingTop: spacing.sm },
  actionWrap: { marginTop: spacing.lg },
  tasksSection: { marginTop: spacing.lg, gap: spacing.md },
  tasksHeader: { marginBottom: spacing.xs },
});
