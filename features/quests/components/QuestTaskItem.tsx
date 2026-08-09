import { Image, Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type {
  ConditionSeverity,
  HeritageSite,
  QuestSubmission,
  QuestTask,
  UserPreferences,
} from '@/types';

import { TaskProximity } from './TaskProximity';

export type QuestTaskItemProps = {
  task: QuestTask;
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
  /**
   * Condition reports already filed at this task's site.
   *
   * The other direction of the same link: filing a report now ticks the task,
   * and the task says what has been filed. Without it a ticked box is the only
   * trace of an act whose actual product — a dated, categorised, photographed
   * finding — lives on a different screen entirely.
   */
  reportCount?: number;
  /** The site this task names, when it names one the registry knows. */
  site?: HeritageSite;
  /** Metres to that site, or null while there is no fix. */
  distanceM?: number | null;
  distanceUnit?: UserPreferences['distanceUnit'];
  /** Severities already filed here, most serious first. */
  filedSeverities?: ConditionSeverity[];
  /** What was actually brought back for this task, if anything. */
  submission?: QuestSubmission;
};

export function QuestTaskItem({
  task,
  completed,
  onToggle,
  disabled = false,
  reportCount = 0,
  site,
  distanceM = null,
  distanceUnit = 'metric',
  filedSeverities = [],
  submission,
}: QuestTaskItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        completed && styles.containerCompleted,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={disabled ? undefined : onToggle}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: completed, disabled }}
    >
      <View style={[styles.checkbox, completed && styles.checkboxCompleted]}>
        {completed ? <Text style={styles.checkmark}>✓</Text> : null}
      </View>

      <View style={styles.content}>
        <Text
          variant="body"
          style={[styles.taskTitle, completed && styles.textCompleted]}
        >
          {task.title}
        </Text>
        <Text variant="caption" tone="secondary" style={styles.taskDesc}>
          {task.description}
        </Text>
        <View style={styles.typeBadge}>
          <Text variant="label" uppercase tone="muted" style={styles.typeText}>
            {task.type.replace('_', ' ')}
          </Text>
        </View>

        {/*
          A task that names a place now says how far away it is, and fills as
          you close on it. The app knew both positions and stated neither — the
          checkbox was the only thing on the row that moved.
        */}
        {/*
          What you brought back, shown where you brought it back to.
          A photograph, a count and a machine's second opinion were all written
          to the database and then never surfaced again — the task went from a
          prompt to a tick with the evidence disappearing in between. The whole
          argument for evidence over a checkbox falls down if the evidence is
          invisible afterwards.
        */}
        {submission ? (
          <View style={styles.evidence}>
            {submission.photoUri ? (
              <Image
                source={{ uri: submission.photoUri }}
                style={styles.thumb}
                resizeMode="cover"
                accessibilityLabel="The photograph you recorded for this task"
              />
            ) : null}

            <View style={styles.evidenceText}>
              {submission.count != null ? (
                <Text variant="body">{submission.count} counted</Text>
              ) : null}
              {submission.note ? (
                <Text variant="caption" tone="secondary" numberOfLines={2}>
                  {submission.note}
                </Text>
              ) : null}
              {/*
                The verdict is attributed and kept subordinate to the person's
                own record. It advised; they decided; the photograph above is
                theirs and it is larger than this line.
              */}
              {submission.review && submission.review.verdict !== 'unavailable' ? (
                <Text variant="caption" tone="muted">
                  {VERDICT_LABEL[submission.review.verdict]}
                  {submission.review.model ? ` · ${submission.review.model}` : ''}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {task.type === 'site_visit' && site ? (
          <TaskProximity site={site} distanceM={distanceM} unit={distanceUnit} />
        ) : null}

        {task.type === 'condition_report' && reportCount > 0 ? (
          <View style={styles.filed}>
            {/*
              What was found, not just that something was. A count says work
              happened; a severity says what the place is doing, which is the
              thing a conservator actually wants off this screen.
            */}
            {filedSeverities.slice(0, 3).map((severity, index) => (
              <View
                key={`${severity}-${index}`}
                style={[styles.severity, { borderColor: SEVERITY_COLOUR[severity] }]}
              >
                <Text variant="label" uppercase style={{ color: SEVERITY_COLOUR[severity] }}>
                  {severity}
                </Text>
              </View>
            ))}
            <Text variant="caption" tone="muted">
              {reportCount === 1 ? '1 report filed' : `${reportCount} reports filed`}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/**
 * Severity read as colour as well as a word.
 *
 * `urgent` takes `openCondition`, whose own definition says "not an error
 * colour". That is the right register: this surface reports a finding about a
 * monument, it does not raise an alarm, and a red would ask the reader to feel
 * something the observation has not earned.
 */
/** Short forms — the sheet already gave the full wording when it was reviewed. */
const VERDICT_LABEL: Record<string, string> = {
  'looks-right': 'Second opinion: looks like what was asked',
  'looks-wrong': 'Second opinion: may not be what was asked',
  unsure: 'Second opinion: not clear enough to say',
};

const SEVERITY_COLOUR: Record<ConditionSeverity, string> = {
  noted: colors.textMuted,
  concerning: colors.sandstoneDeep,
  urgent: colors.openCondition,
};

const styles = StyleSheet.create({
  filed: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.xs },
  evidence: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.sm,
    backgroundColor: colors.surfaceSecondary,
  },
  evidenceText: { flex: 1, gap: 2 },
  severity: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    padding: spacing.base,
    minHeight: 48,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  containerCompleted: { backgroundColor: colors.surfaceSecondary, borderColor: 'transparent' },
  pressed: { opacity: 0.8 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: { backgroundColor: colors.resolved, borderColor: colors.resolved },
  checkmark: { color: colors.surface, fontWeight: 'bold', fontSize: 14 },
  content: { flex: 1, gap: spacing.xxs },
  taskTitle: { color: colors.textPrimary },
  textCompleted: { textDecorationLine: 'line-through', color: colors.textMuted },
  taskDesc: { marginTop: 2 },
  typeBadge: { alignSelf: 'flex-start', marginTop: spacing.xs },
  typeText: { fontSize: 10 },
});
