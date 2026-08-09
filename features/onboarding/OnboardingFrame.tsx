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
      {showProgress ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.progress}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 1, max: TOTAL_STEPS, now: index + 1 }}
          accessibilityLabel={`Step ${index + 1} of ${TOTAL_STEPS}`}
        >
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[
                styles.mark,
                i === index && styles.markCurrent,
                i < index && styles.markDone,
              ]}
            />
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

      {/* Back sits beside the action rather than up in the corner. It is the
          one control someone reaches for while already holding the phone to
          press Continue, and a top-left target on a tall screen is a two-handed
          reach for a one-handed decision. The action keeps the width it had —
          back takes its own square, not a share of the button. */}
      <Animated.View entering={FadeInDown.delay(90).duration(380)} style={styles.footerRow}>
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, pressed && styles.backPressed]}
          >
            {/* `title` rather than `body`: a lone chevron at 16pt reads as a
                stray mark inside a 52pt circle. The glyph carries no text, so
                the size is doing the work the word "Back" used to do. */}
            <Text variant="title" tone="secondary">
              ‹
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.footer}>{footer}</View>
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backPressed: { opacity: 0.6, backgroundColor: colors.surfaceSecondary },
  content: { paddingTop: spacing.lg },

  // Dots rather than a divided bar. A bar cut into equal segments reads as one
  // thing partly filled, which invites "how much is left"; discrete marks read
  // as a short list of places, which is what five screens are. The current one
  // is a lozenge instead of a dot — the same weight of ink, held longer, so
  // position is legible at a glance without adding a second colour.
  progress: { flexDirection: 'row', gap: spacing.sm, height: 6, alignItems: 'center' },
  progressSpacer: { height: 6 },
  mark: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  markCurrent: {
    width: 26,
    backgroundColor: colors.sandstone,
  },
  // Behind you, but still yours: filled, and quieter than the one you are on.
  markDone: { backgroundColor: colors.sandstoneDeep, opacity: 0.4 },

  body: { flex: 1, justifyContent: 'center', paddingVertical: spacing.xxl },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  // flex:1 so a `block` Button fills whatever back leaves, and so a screen
  // whose footer stacks a caption under the button keeps that column intact.
  footer: { flex: 1, gap: spacing.md },
});
