import { Pressable, StyleSheet, View } from 'react-native';

import { Button, BottomSheet, ProgressIndicator, Text } from '@/components/ui';
import { SiteVisual } from '@/components/site';
import { findSite, siteIdsForQuest } from '@/data';
import { colors, radii, spacing } from '@/theme';
import type { QuestWithProgress } from '@/types';

/**
 * The mission panel.
 *
 * A sheet rather than a route, so the world stays visible behind it — §14 of
 * the spec for this phase, and the same reason the condition flow is a sheet:
 * a step inside one act should not become a screen you navigate back out of.
 *
 * Everything here is location-aware. A quest belongs to the sites its tasks
 * name, so the quests offered are the ones for the place the player is standing
 * in, and a quest from elsewhere shows locked with the way to it rather than
 * being hidden — hiding it would remove the reason to walk there.
 */

export type QuestSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** The site the player is at, or null when between places. */
  atSiteId: string | null;
  /** Quests for the current place. */
  here: QuestWithProgress[];
  /** Quests elsewhere, shown locked so the world has somewhere to point at. */
  elsewhere: QuestWithProgress[];
  /** Ticks a task done. The temporary completion interaction — no capture yet. */
  onCompleteTask: (questId: string, taskId: string) => void;
  /** Un-ticks it. A checkbox with no way back is a trap, not a checkbox. */
  onUndoTask: (questId: string, taskId: string) => void;
  /** Takes the player to the place a locked quest belongs to. */
  onGoToSite: (siteId: string) => void;
  /**
   * Opens the quest's own screen.
   *
   * The sheet is the glance — what is here, how far through, tick it off. The
   * quest screen is the depth: the intention, the evidence a task wants, the
   * photographs already filed against it. They are two views of one quest, not
   * two quest systems, and this is the seam that keeps them one.
   */
  onOpenQuest: (questId: string) => void;
  /**
   * Hands a task that wants evidence over to Sākṣī, which is where evidence is
   * captured. Quest and Sākṣī stay separate features; this is the seam between
   * them, not a merge.
   */
  onWitness: (siteId: string) => void;
};

function questDone(quest: QuestWithProgress): boolean {
  return quest.progress?.status === 'completed';
}

function tasksDone(quest: QuestWithProgress): number {
  const completed = quest.progress?.completedTasks ?? [];
  return quest.tasks.filter((t) => completed.includes(t.id)).length;
}

export function QuestSheet({
  visible,
  onClose,
  atSiteId,
  here,
  elsewhere,
  onCompleteTask,
  onUndoTask,
  onGoToSite,
  onOpenQuest,
  onWitness,
}: QuestSheetProps) {
  const site = atSiteId ? findSite(atSiteId) : undefined;
  const completedHere = here.filter(questDone).length;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={site ? site.name : 'Quests'}
      subtitle={
        here.length > 0
          ? `${completedHere} / ${here.length} complete`
          : 'Nothing to do where you are standing'
      }
      scroll
    >
      <View style={styles.body}>
        {here.length > 0 ? (
          <>
            <ProgressIndicator value={completedHere} total={here.length} />
            {here.map((quest) => (
              <QuestRow
                key={quest.id}
                quest={quest}
                locked={false}
                onCompleteTask={onCompleteTask}
                onUndoTask={onUndoTask}
                onGoToSite={onGoToSite}
                onOpenQuest={onOpenQuest}
                onWitness={onWitness}
              />
            ))}
          </>
        ) : (
          <View style={styles.empty}>
            <Text variant="body" tone="secondary">
              {site
                ? 'This place has no quests yet. What it has is its story.'
                : 'Walk to a monument to pick up its quests.'}
            </Text>
          </View>
        )}

        {elsewhere.length > 0 ? (
          <View style={styles.section}>
            <Text variant="label" tone="muted" uppercase>
              Elsewhere in Lumbini
            </Text>
            {elsewhere.map((quest) => (
              <QuestRow
                key={quest.id}
                quest={quest}
                locked
                onCompleteTask={onCompleteTask}
                onUndoTask={onUndoTask}
                onGoToSite={onGoToSite}
                onOpenQuest={onOpenQuest}
                onWitness={onWitness}
              />
            ))}
          </View>
        ) : null}
      </View>
    </BottomSheet>
  );
}

function QuestRow({
  quest,
  locked,
  onCompleteTask,
  onUndoTask,
  onGoToSite,
  onOpenQuest,
  onWitness,
}: {
  quest: QuestWithProgress;
  locked: boolean;
  onCompleteTask: (questId: string, taskId: string) => void;
  onUndoTask: (questId: string, taskId: string) => void;
  onGoToSite: (siteId: string) => void;
  onOpenQuest: (questId: string) => void;
  onWitness: (siteId: string) => void;
}) {
  const done = questDone(quest);
  const completedIds = quest.progress?.completedTasks ?? [];
  const homeSiteId = siteIdsForQuest(quest)[0];
  const homeSite = homeSiteId ? findSite(homeSiteId) : undefined;


  if (locked) {
    return (
      <View style={[styles.card, styles.cardLocked]}>
        {homeSiteId ? <SiteVisual siteId={homeSiteId} height={96} style={styles.heroDim} /> : null}
        <View style={styles.cardHead}>
          <Text variant="body" style={styles.lockMark}>
            🔒
          </Text>
          <View style={styles.cardTitle}>
            <Text variant="heading">{quest.title}</Text>
            <Text variant="caption" tone="muted">
              {homeSite ? `Visit ${homeSite.name} to unlock this quest.` : 'Locked.'}
            </Text>
          </View>
        </View>
        {homeSiteId ? (
          <Button
            label="Go to location"
            variant="secondary"
            onPress={() => onGoToSite(homeSiteId)}
            accessibilityHint={`Takes you to ${homeSite?.name ?? 'the place this quest belongs to'}`}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.card, done && styles.cardDone]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${quest.title}`}
        accessibilityHint="Shows the full quest, its intention and any evidence filed"
        onPress={() => onOpenQuest(quest.id)}
        style={({ pressed }) => [styles.cardOpen, pressed && styles.cardPressed]}
      >
        {homeSiteId ? <SiteVisual siteId={homeSiteId} height={120} /> : null}
        <View style={styles.cardHead}>
          <Text variant="body" style={styles.lockMark}>
            {done ? '🏆' : '🎯'}
          </Text>
          <View style={styles.cardTitle}>
            <Text variant="heading">{quest.title}</Text>
            {/*
              No amount. `+{tasks.length * 100}` used to sit here, and it was
              invented twice over: quests carry no value of their own — puṇya is
              weighted by the kind of attention, never by the quest — and the
              daily cap means the figure would often be granted in full to
              nobody. types/quests.ts states the rule: "Putting a number here
              would invite tuning quests for points."
            */}
            <Text variant="caption" tone={done ? 'sandstone' : 'muted'}>
              {tasksDone(quest)} / {quest.tasks.length} tasks
            </Text>
          </View>
          <Text variant="body" tone="muted">
            ›
          </Text>
        </View>
      </Pressable>

      <View style={styles.tasks}>
        {quest.tasks.map((task) => {
          const taskDone = completedIds.includes(task.id);
          return (
            <View key={task.id} style={styles.task}>
              {/* The state is the mark, not a sentence about the state. */}
              <View style={[styles.tick, taskDone && styles.tickDone]}>
                <Text variant="caption" tone={taskDone ? 'inverse' : 'muted'} style={styles.tickMark}>
                  {taskDone ? '✓' : ''}
                </Text>
              </View>

              <View style={styles.taskText}>
                <Text variant="body" tone={taskDone ? 'muted' : 'primary'}>
                  {task.title}
                </Text>
                {/* The description is the instruction. Once done it has been
                    followed, so it stops being worth the two lines. */}
                {!taskDone ? (
                  <Text variant="caption" tone="muted" numberOfLines={2}>
                    {task.description}
                  </Text>
                ) : null}
              </View>

              {/*
                A tick, for now. The spec asks for the simple completion
                interaction first so that real verification — a photograph
                matched to a vantage — can replace it without the surrounding
                flow changing. Tasks that already declare `evidence` say so, so
                nobody mistakes the tick for the evidence it will one day want.
              */}
              {!taskDone ? (
                <View style={styles.taskActions}>
                  {/*
                    A task that wants a photograph is handed to Sākṣī, which is
                    the surface that takes one against a vantage. The two stay
                    separate features — this is the seam, and the tick beside it
                    is still there for someone who cannot capture right now.
                  */}
                  {task.evidence && task.evidence !== 'none' && homeSiteId ? (
                    <Button
                      label="Witness"
                      variant="secondary"
                      onPress={() => onWitness(task.targetId ?? homeSiteId)}
                      accessibilityHint="Opens Sākṣī to record what you can see here"
                    />
                  ) : null}
                  <Button
                    label="Mark done"
                    variant="secondary"
                    onPress={() => onCompleteTask(quest.id, task.id)}
                    accessibilityHint="Records this objective as done"
                  />
                </View>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Undo ${task.title}`}
                  onPress={() => onUndoTask(quest.id, task.id)}
                  hitSlop={10}
                  style={styles.undo}
                >
                  <Text variant="caption" tone="muted">
                    Undo
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /** Locked quests still show their place, held back. */
  heroDim: { opacity: 0.45 },
  body: { gap: spacing.md, paddingBottom: spacing.base },
  empty: { paddingVertical: spacing.sm },
  section: { gap: spacing.sm, paddingTop: spacing.sm },
  card: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardDone: { borderColor: colors.resolved, backgroundColor: colors.surfaceSecondary },
  cardOpen: { gap: spacing.sm },
  cardPressed: { opacity: 0.75 },
  cardLocked: { backgroundColor: colors.surfaceSecondary, opacity: 0.9 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { flex: 1, gap: 2 },
  lockMark: { fontSize: 18, lineHeight: 22 },
  tasks: { gap: spacing.sm },
  task: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  taskText: { flex: 1, gap: 2 },
  taskActions: { gap: spacing.xs, alignItems: 'flex-end' },
  tick: {
    width: 22,
    height: 22,
    borderRadius: radii.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tickDone: { backgroundColor: colors.resolved, borderColor: colors.resolved },
  tickMark: { fontSize: 12, lineHeight: 14, fontWeight: '700' },
  undo: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
});
