import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

import { AlignmentRehearsal } from './AlignmentRehearsal';
import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

/**
 * The one thing that has to be felt rather than read.
 *
 * Every other step here is a sentence. Alignment is a physical skill — holding
 * a device until an instrument agrees with you — and no amount of copy conveys
 * what the lock feels like. So this step hands it over for ten seconds.
 *
 * The button stays available before the lock rather than gating on it. Someone
 * who already understands, or who cannot drag comfortably, should not be held
 * at a tutorial; the label changes instead, which invites the rehearsal without
 * requiring it.
 */
export function AlignScreen() {
  const router = useRouter();
  const next = nextRoute('align');
  const [locked, setLocked] = useState(false);

  return (
    <OnboardingFrame
      stepKey="align"
      footer={
        <Button
          label={locked ? 'Continue' : 'Skip for now'}
          variant={locked ? 'primary' : 'quiet'}
          block
          onPress={() => next && router.push(next)}
        />
      }
    >
      <View style={styles.wrap}>
        <View style={styles.heading}>
          <Text variant="title">Try the alignment</Text>
          <Text variant="body" tone="secondary">
            On site you will hold the phone until the instrument agrees with you. It is easier
            done than described.
          </Text>
        </View>

        <AlignmentRehearsal onLocked={() => setLocked(true)} />

        {locked ? (
          <Text variant="body" tone="secondary">
            The blue means the device matches the viewpoint. It appears nowhere else in the app,
            so when you see it, it means only that.
          </Text>
        ) : null}
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  heading: { gap: spacing.sm },
});
