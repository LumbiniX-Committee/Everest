import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { Reticle } from '@/components/reticle';
import { HeritageVideo } from '@/components/media/HeritageVideo';
import { APP_EPIGRAPH, APP_NAME, APP_SUBTITLE } from '@/constants';
import { spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

/**
 * First screen. The reticle carries the whole visual identity — no Buddha, no
 * temple, no lotus. An instrument, presented plainly.
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
        <Reticle size={168} idleAnimation />

        <HeritageVideo />

        <View style={styles.wordmark}>
          <Text variant="display" center>
            {APP_NAME}
          </Text>
          <Text variant="body" tone="secondary" center>
            {APP_SUBTITLE}
          </Text>
        </View>

        <Text variant="mono" tone="muted" center style={styles.epigraph}>
          {APP_EPIGRAPH}
        </Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  body: { alignItems: 'center', gap: spacing.xxl },
  wordmark: { alignItems: 'center', gap: spacing.sm },
  epigraph: { letterSpacing: 1 },
});
