import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { AlignmentState, Vantage } from '@/types';
import { alignmentHint } from '@/utils/alignmentHint';

type StepKey = 'arrive' | 'stand' | 'face' | 'level' | 'capture';

const STEPS: { key: StepKey; label: string }[] = [
  { key: 'arrive', label: 'Get there' },
  { key: 'stand', label: 'Stand on the mark' },
  { key: 'face', label: 'Face the view' },
  { key: 'level', label: 'Hold level' },
  { key: 'capture', label: 'Take the photograph' },
];

/** Farther than this, the visitor still needs directions rather than fine guidance. */
const DIRECTIONS_RANGE_M = 60;

/** Which step the live readings put the visitor on. */
export function currentStep(alignment: AlignmentState, vantage: Vantage): StepKey {
  if (alignment.phase === 'locked') return 'capture';
  if (alignment.distanceM == null || alignment.distanceM > DIRECTIONS_RANGE_M) return 'arrive';
  if (alignment.distanceM > vantage.positionToleranceM || alignment.blockedBy === 'position' || alignment.blockedBy === 'gps') {
    return 'stand';
  }
  if (alignment.blockedBy === 'heading') return 'face';
  return 'level';
}

const BLOCKED: Record<string, string> = {
  gps: 'Waiting for a more precise location fix. Open sky helps.',
  heading: 'Turn until the arrow points straight up.',
  pitch: 'Tilt the phone until it is level with the view.',
  position: 'Move onto the mark.',
};

/**
 * The close-up visit, one step at a time. Each step says what to do now, in
 * words, so the visitor never has to decode the reticle on their own.
 */
export function GuidanceSteps({ alignment, vantage }: { alignment: AlignmentState; vantage: Vantage }) {
  const ui = useVisitorLiteralCopy();
  const { preferences } = usePreferences();
  const step = currentStep(alignment, vantage);
  const index = STEPS.findIndex((s) => s.key === step);
  const hint = alignmentHint(alignment);
  // Far away the bearing delta points toward the mark; close in, toward the view.
  const arrow = alignment.bearingDeltaDeg;

  return (
    <Card style={styles.card}>
      <View style={styles.steps} accessibilityRole="progressbar" accessibilityValue={{ min: 1, max: STEPS.length, now: index + 1 }}>
        {STEPS.map((s, i) => (
          <View key={s.key} style={styles.stepRow}>
            <View style={[styles.dot, i < index && styles.dotDone, i === index && styles.dotNow]}>
              {i < index ? <Icon name="check" size={14} color={colors.onPrimary} /> : null}
            </View>
            <Text variant={i === index ? 'bodyStrong' : 'body'} tone={i > index ? 'muted' : 'primary'}>
              {s.label}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.now}>
        {arrow != null && step !== 'capture' && step !== 'level' ? (
          <View style={[styles.arrow, { transform: [{ rotate: `${Math.round(arrow)}deg` }] }]}>
            <Icon name="arrow-up-bold" size={34} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.nowText}>
          <Text variant="bodyStrong">{hint}</Text>
          {alignment.blockedBy && BLOCKED[alignment.blockedBy] && step !== 'arrive' ? (
            <Text variant="caption" tone="secondary">
              {BLOCKED[alignment.blockedBy]}
            </Text>
          ) : null}
          <Text variant="caption" tone="muted">
            {alignment.gpsAccuracyM != null
              ? `${ui('Location accuracy')} ±${Math.round(alignment.gpsAccuracyM)} m`
              : ui('Location accuracy not known')}
          </Text>
        </View>
        <SpeakButton text={hint} language={preferences.interfaceLanguage} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  steps: { gap: spacing.xs },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: {
    width: 20,
    height: 20,
    borderRadius: radii.full,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  dotNow: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  now: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  arrow: { width: 44, alignItems: 'center' },
  nowText: { flex: 1, gap: spacing.xxs },
});
