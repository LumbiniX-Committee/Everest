import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { GreetingMonk } from '@/components/monk';
import { APP_EPIGRAPH, APP_NAME, APP_SUBTITLE } from '@/constants';
import { colors, prayerFlags, radii, spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

/**
 * First screen.
 *
 * This screen used to open on the reticle, on the reasoning that the instrument
 * carries the identity and the app should promise nothing devotional it does not
 * deliver. That reasoning still holds everywhere else in the app, and the
 * reticle still opens the alignment rehearsal two screens later, where it is
 * about to mean something.
 *
 * It gives way here because the first screen has a different job from the rest:
 * not to state what the app measures, but to greet the person who opened it.
 * A figure with its hands together does that in the register of the place —
 * this is Lumbini, and namaste is how arriving is acknowledged there. The
 * instrument follows immediately afterwards, which is the right order: welcome
 * first, then the claim.
 */
export function WelcomeScreen() {
  const router = useRouter();
  const next = nextRoute('welcome');

  return (
    <OnboardingFrame
      stepKey="welcome"
      showProgress={false}
      footer={
        <Button
          label="Begin"
          block
          onPress={() => next && router.push(next)}
          accessibilityHint="Starts the introduction"
        />
      }
    >
      <View style={styles.body}>
        <View style={styles.greeting}>
          <View style={styles.sun} />
          <GreetingMonk height={240} />
        </View>

        <View style={styles.wordmark}>
          <Text variant="display" center>
            {APP_NAME}
          </Text>
          <Text variant="body" tone="secondary" center>
            {APP_SUBTITLE}
          </Text>
          {/* A prayer flag in miniature. Decorative, so hidden from assistive tech. */}
          <View style={styles.flags} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            {prayerFlags.map((flag) => (
              <View key={flag} style={[styles.flag, { backgroundColor: flag }]} />
            ))}
          </View>
        </View>

        <Text variant="mono" tone="muted" center style={styles.epigraph}>
          {APP_EPIGRAPH}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  // Tighter under the figure than between the text blocks: the monk and the
  // wordmark are one greeting, not two things stacked.
  body: { alignItems: 'center', gap: spacing.xl },
  greeting: { alignItems: 'center', justifyContent: 'center' },
  // The rising sun from the mark, soft enough that the monk's robe stays distinct.
  sun: {
    position: 'absolute',
    width: 224,
    height: 224,
    borderRadius: radii.full,
    backgroundColor: colors.accentSoft,
  },
  wordmark: { alignItems: 'center', gap: spacing.sm },
  // The hairline keeps the flag's white panel visible on the morning ground.
  flags: {
    flexDirection: 'row',
    marginTop: spacing.xs,
    borderRadius: radii.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  flag: { width: 20, height: 4 },
  epigraph: { letterSpacing: 1 },
});
