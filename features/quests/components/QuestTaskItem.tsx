import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import type { QuestTask } from '@/types';

export type QuestTaskItemProps = {
  task: QuestTask;
  completed: boolean;
  onToggle: () => void;
  disabled?: boolean;
};

export function QuestTaskItem({ task, completed, onToggle, disabled = false }: QuestTaskItemProps) {
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
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
