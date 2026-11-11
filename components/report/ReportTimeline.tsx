import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import type { TimelineStep } from '@/core';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, spacing } from '@/theme';

const STEP_LABEL: Record<TimelineStep['key'], string> = {
  waiting: 'Waiting to send',
  received: 'Received',
  acknowledged: 'Acknowledged by the site',
  in_progress: 'Being worked on',
  resolved: 'Resolved',
};

/** "8 Nov 2026" in the visitor's locale, or a dash. */
function day(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * What has happened to a report, step by step.
 *
 * Steps not yet reached are drawn hollow and undated, so nobody reads a
 * future step as a promise. The note under a step is the custodian's own words.
 */
export function ReportTimeline({ steps, fetchedAt }: { steps: TimelineStep[]; fetchedAt: string | null }) {
  const ui = useVisitorLiteralCopy();
  return (
    <View accessibilityLabel={ui('What has happened to this report')} style={styles.wrap}>
      {steps.map((step, index) => (
        <View key={step.key} style={styles.row}>
          <View style={styles.rail}>
            <View style={[styles.dot, step.done ? styles.dotDone : styles.dotTodo, step.current && styles.dotCurrent]} />
            {index < steps.length - 1 ? <View style={[styles.line, step.done && steps[index + 1].done && styles.lineDone]} /> : null}
          </View>
          <View style={styles.body}>
            <Text variant={step.current ? 'bodyStrong' : 'body'} tone={step.done ? 'primary' : 'muted'}>
              {STEP_LABEL[step.key]}
            </Text>
            {step.done && step.at ? (
              <Text variant="caption" tone="secondary" translate={false}>
                {day(step.at)}
              </Text>
            ) : null}
            {step.note ? (
              <Text variant="caption" tone="secondary" translate={false}>
                {`“${step.note}”`}
              </Text>
            ) : null}
          </View>
        </View>
      ))}
      {steps[0]?.key !== 'waiting' ? (
        <Text variant="caption" tone="muted" translate={false}>
          {fetchedAt ? `${ui('Last checked')} ${day(fetchedAt)}` : ui('Not checked yet: connect to see updates.')}
        </Text>
      ) : null}
    </View>
  );
}

const DOT = 12;
const styles = StyleSheet.create({
  wrap: { gap: 0, marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md, minHeight: 44 },
  rail: { width: DOT, alignItems: 'center' },
  dot: { width: DOT, height: DOT, borderRadius: DOT / 2, borderWidth: 2, marginTop: spacing.xs },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotTodo: { backgroundColor: colors.surface, borderColor: colors.border },
  dotCurrent: { borderColor: colors.accent },
  line: { flex: 1, width: 2, backgroundColor: colors.border },
  lineDone: { backgroundColor: colors.primary },
  body: { flex: 1, paddingBottom: spacing.sm, gap: spacing.xxs },
});
