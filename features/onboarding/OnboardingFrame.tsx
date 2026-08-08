import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { TOTAL_STEPS, stepIndex } from './steps';

/**
 * Shared frame for every onboarding screen.
 *
 * Onboarding is the one place in the app that is allowed to be almost empty:
 * content sits low, whitespace does the pacing, and the only chrome is a row of
 * step marks. Everything is bottom-anchored so the action is always under the
 * thumb regardless of how much text a screen carries.
 */
export function OnboardingFrame({
  stepKey,
  children,
  footer,
  showProgress = true,
}: {
  stepKey: string;
  children: ReactNode;
  footer: ReactNode;
  showProgress?: boolean;
}) {
  const index = stepIndex(stepKey);

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      {showProgress ? (
        <View style={styles.progress} accessibilityRole="progressbar">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.mark, i <= index && styles.markActive]} />
          ))}
        </View>
      ) : (
        <View style={styles.progressSpacer} />
      )}

      <View style={styles.body}>{children}</View>

      <View style={styles.footer}>{footer}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: spacing.lg },
  progress: { flexDirection: 'row', gap: spacing.sm, height: 2 },
  progressSpacer: { height: 2 },
  mark: {
    flex: 1,
    height: 2,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
  markActive: { backgroundColor: colors.sandstone },
  body: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  footer: { paddingBottom: spacing.lg, gap: spacing.md },
});
