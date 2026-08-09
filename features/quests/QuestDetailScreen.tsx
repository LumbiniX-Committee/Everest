import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorState, LoadingState, ScreenHeader } from '@/components/common';
import { BottomSheet, Button, Card, Screen, Text } from '@/components/ui';
import { SitePlan } from '@/components/map';
import { findSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePreferences } from '@/store';
import { useQuests } from '@/store/quests';
import { colors, spacing } from '@/theme';
import type { ConditionSeverity, HeritageSite, QuestSubmission, QuestTask } from '@/types';
import { distanceMeters } from '@/utils';

/** Least to most serious, so a sort by index puts urgent first. */
const SEVERITY_ORDER: ConditionSeverity[] = ['noted', 'concerning', 'urgent'];

import { QuestCategoryBadge } from './components/QuestCategoryBadge';
import { QuestProgressBar } from './components/QuestProgressBar';
import { TaskEvidenceSheet } from './components';
import { QuestTaskItem } from './components/QuestTaskItem';

export function QuestDetailScreen({ questId }: { questId: string }) {
  const router = useRouter();
  const { hydrated, getQuestById, startQuest, completeTask } = useQuests();
  // Watched, not sampled once: a task row that says how far away you are has to
  // keep saying it while you walk.
  const { coordinate } = useCurrentPosition({ watch: true });
  const { preferences } = usePreferences();

  // Declared before any early return. React requires hooks to run
  // unconditionally on every render, and the loading and not-found branches
  // below both return before this point otherwise.
  const [openTask, setOpenTask] = useState<QuestTask | null>(null);

  /**
   * Reports already filed, per site. Read once here rather than per task so a
   * quest with several report tasks does not query the database once each.
   */
  const [reportsBySite, setReportsBySite] = useState<
    Record<string, { count: number; severities: ConditionSeverity[] }>
  >({});

  /** What has been brought back, by task. Reloaded whenever one is submitted. */
  const [submissions, setSubmissions] = useState<Record<string, QuestSubmission>>({});

  const loadSubmissions = useCallback(async () => {
    try {
      const rows = await database.listQuestSubmissions(questId);
      setSubmissions(Object.fromEntries(rows.map((row) => [row.taskId, row])));
    } catch {
      // The tick still stands without its evidence on screen.
    }
  }, [questId]);

  useEffect(() => {
    void loadSubmissions();
  }, [loadSubmissions]);

  useEffect(() => {
    let active = true;
    void database
      .listConditionReports()
      .then((reports) => {
        if (!active) return;
        const byId: Record<string, { count: number; severities: ConditionSeverity[] }> = {};
        for (const report of reports) {
          const id = findSite(report.siteId)?.id ?? report.siteId;
          const entry = byId[id] ?? { count: 0, severities: [] };
          entry.count += 1;
          entry.severities.push(report.severity);
          byId[id] = entry;
        }
        // Most serious first: if a place has an urgent finding, that is the one
        // worth seeing without expanding anything.
        for (const entry of Object.values(byId)) {
          entry.severities.sort(
            (a, b) => SEVERITY_ORDER.indexOf(b) - SEVERITY_ORDER.indexOf(a),
          );
        }
        setReportsBySite(byId);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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

  /**
   * The places this quest touches, and whether each is settled.
   *
   * A place counts as done when every task naming it is ticked — a site with a
   * visit and a condition report is not finished halfway through. Sites the
   * registry does not know (monastic-zone) drop out rather than being drawn at
   * a guessed position.
   */
  const planSites: HeritageSite[] = [];
  for (const task of tasks) {
    if (!task.targetId) continue;
    const site = findSite(task.targetId);
    if (site && !planSites.some((existing) => existing.id === site.id)) planSites.push(site);
  }

  const planState: Record<string, 'done' | 'todo'> = {};
  for (const site of planSites) {
    const itsTasks = tasks.filter(
      (task) => task.targetId && findSite(task.targetId)?.id === site.id,
    );
    planState[site.id] = itsTasks.every((task) => progress.completedTasks.includes(task.id))
      ? 'done'
      : 'todo';
  }
  const planDone = planSites.filter((site) => planState[site.id] === 'done').length;

  // A task that asks for something opens the sheet; a task that asks for
  // nothing still ticks straight through, because demanding a photograph of a
  // gate you walked past is busywork dressed as rigour.
  const finishTask = async (taskId: string) => {
    const result = await completeTask(questId, taskId);
    if (result.questCompleted) {
      router.replace(`/(main)/tirtha/quests/completed/${questId}`);
    }
  };

  const handleTaskToggle = async (taskId: string) => {
    if (progress.completedTasks.includes(taskId)) return;

    const task = tasks.find((t) => t.id === taskId);
    const wantsEvidence = task && (task.evidence ?? 'none') !== 'none';
    if (wantsEvidence) {
      setOpenTask(task);
      return;
    }
    await finishTask(taskId);
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
          {/*
            The quest in space, before the quest as a list.
            A quest that crosses four monuments read as four rows of prose;
            nothing said they were 90 m apart, or which of them you had already
            settled, or that one is behind you. The plan is schematic on purpose
            — the same component the explore surface uses, with no map SDK and
            no tiles.
          */}
          {planSites.length > 1 ? (
            <View style={styles.planBlock}>
              <SitePlan
                sites={planSites}
                observer={coordinate}
                siteState={planState}
                height={180}
              />
              <Text variant="caption" tone="muted">
                {planDone === planSites.length
                  ? 'Every place this quest asks for is settled.'
                  : `${planDone} of ${planSites.length} places settled · hollow marks are done`}
              </Text>
            </View>
          ) : null}

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
              site={task.targetId ? findSite(task.targetId) : undefined}
              distanceM={
                task.targetId && coordinate
                  ? (() => {
                      const target = findSite(task.targetId);
                      return target ? distanceMeters(coordinate, target.coordinate) : null;
                    })()
                  : null
              }
              distanceUnit={preferences.distanceUnit}
              reportCount={
                task.targetId
                  ? reportsBySite[findSite(task.targetId)?.id ?? task.targetId]?.count ?? 0
                  : 0
              }
              submission={submissions[task.id]}
              filedSeverities={
                task.targetId
                  ? reportsBySite[findSite(task.targetId)?.id ?? task.targetId]?.severities ?? []
                  : []
              }
            />
          ))}
        </View>
      )}

      <BottomSheet
        visible={openTask !== null}
        onClose={() => setOpenTask(null)}
        title={openTask?.title ?? 'Record what you saw'}
        scroll
      >
        {openTask ? (
          <TaskEvidenceSheet
            questId={questId}
            task={openTask}
            onCancel={() => setOpenTask(null)}
            onSubmitted={async () => {
              const id = openTask.id;
              setOpenTask(null);
              await finishTask(id);
              // Re-read so the photograph appears on the row it belongs to
              // rather than only after the screen is left and reopened.
              await loadSubmissions();
            }}
          />
        ) : null}
      </BottomSheet>

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
  planBlock: { gap: spacing.sm, paddingBottom: spacing.base },
  tasksHeader: { marginBottom: spacing.xs },
});
