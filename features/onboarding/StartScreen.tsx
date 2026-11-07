import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import { HOME_HUB_OPTIONS } from '@/types';

import { ChoiceCard } from './ChoiceCard';
import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

const ICONS = {
  'near-me': 'crosshairs-gps',
  lumbini: 'flower-outline',
  kathmandu: 'temple-buddhist-outline',
  pokhara: 'image-filter-hdr',
  chitwan: 'pine-tree',
} as const;

export function StartScreen() {
  const router = useRouter();
  const next = nextRoute('start');
  const { preferences, update } = usePreferences();

  return (
    <OnboardingFrame
      stepKey="start"
      footer={<Button label="Continue" block onPress={() => next && router.push(next)} />}
    >
      <View style={styles.wrap}>
        <Text variant="title">Where would you like to start?</Text>
        <View accessibilityRole="radiogroup" style={styles.choices}>
          {HOME_HUB_OPTIONS.map((option) => (
            <ChoiceCard
              key={option.value}
              label={option.label}
              hint={option.hint}
              icon={ICONS[option.value as keyof typeof ICONS]}
              selected={preferences.homeHub === option.value}
              onPress={() => void update('homeHub', option.value)}
            />
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  choices: { gap: spacing.sm },
});
