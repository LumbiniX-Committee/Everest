import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import { VISITOR_TYPE_OPTIONS } from '@/types';

import { ChoiceCard } from './ChoiceCard';
import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

const ICONS = { foreign: 'airplane', nepali: 'home-heart' } as const;

/** Self-declared: it only chooses which prices and entry fees to show. */
export function VisitorScreen() {
  const router = useRouter();
  const next = nextRoute('visitor');
  const { preferences, update } = usePreferences();
  const chosen = preferences.visitorType !== 'unset';

  return (
    <OnboardingFrame
      stepKey="visitor"
      footer={
        <Button label="Continue" block disabled={!chosen} onPress={() => next && router.push(next)} />
      }
    >
      <View style={styles.wrap}>
        <View style={styles.heading}>
          <Text variant="title">Who is visiting?</Text>
          <Text variant="body" tone="secondary">
            Entry fees and prices differ in Nepal. This shows you the right ones. We never ask for any document.
          </Text>
        </View>
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {VISITOR_TYPE_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              hint={option.hint}
              icon={ICONS[option.value as keyof typeof ICONS]}
              selected={preferences.visitorType === option.value}
              onPress={() => void update('visitorType', option.value)}
            />
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  heading: { gap: spacing.sm },
  choices: { gap: spacing.md },
});
