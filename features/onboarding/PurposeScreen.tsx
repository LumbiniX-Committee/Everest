import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

/**
 * Why Sākṣī.
 *
 * Three sentences, generous leading, nothing else. The argument for the app is
 * short enough to hold in one breath, and dressing it up would weaken it.
 */
export function PurposeScreen() {
  const router = useRouter();
  const next = nextRoute('purpose');

  return (
    <OnboardingFrame
      stepKey="purpose"
      footer={<Button label="Continue" block onPress={() => next && router.push(next)} />}
    >
      <View style={styles.lines}>
        <Text variant="title">Things change.</Text>
        <Text variant="title">Heritage changes.</Text>
        <Text variant="title">Someone has to notice.</Text>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  lines: { gap: spacing.lg },
});
