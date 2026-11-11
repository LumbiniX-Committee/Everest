import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { PlanComparison, RedeemCode } from '@/features/plans';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { useFinishOnboarding } from './useFinishOnboarding';

/** The free path is the main action. Nobody has to decide about Pro to get started. */
export function PlanStepScreen() {
  const { preferences } = usePreferences();
  const finish = useFinishOnboarding();

  return (
    <OnboardingFrame
      stepKey="plan"
      footer={<Button label="Continue free" block onPress={() => void finish()} />}
    >
      <View style={styles.wrap}>
        <Text variant="title">Start free</Text>
        <PlanComparison visitor={preferences.visitorType} />
        <RedeemCode onRedeemed={() => void finish()} />
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
});
