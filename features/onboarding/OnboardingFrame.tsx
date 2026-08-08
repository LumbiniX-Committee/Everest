import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Screen, Text } from '@/components/ui';
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
  const router = useRouter();
  const index = stepIndex(stepKey);
  // Onboarding is the one flow people most often want to step back through —
  // to re-read what a permission is for before granting it. There was no way
  // back at all, and the step marks implied a sequence you could not reverse.
  const canGoBack = index > 0 && router.canGoBack();

  return (
    <Screen edges={['top', 'bottom']} contentStyle={styles.content}>
      {canGoBack ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
        >
          <Text variant="body" tone="secondary">
            ‹ Back
          </Text>
        </Pressable>
      ) : null}

      {showProgress ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.progress}
          accessibilityRole="progressbar"
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View key={i} style={[styles.mark, i <= index && styles.markActive]} />
          ))}
        </Animated.View>
      ) : (
        <View style={styles.progressSpacer} />
      )}

      {/* The body rises as it fades, and the footer follows a beat later, so a
          screen composes itself rather than appearing all at once. Short
          enough not to be a wait: 380ms, with a 90ms stagger. */}
      <Animated.View entering={FadeInDown.duration(380).damping(18)} style={styles.body}>
        {children}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(90).duration(380)} style={styles.footer}>
        {footer}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: spacing.md,
  },
  backPressed: { opacity: 0.6 },
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
