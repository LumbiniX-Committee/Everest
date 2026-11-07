import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Icon, Text, type IconName } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

const SURFACES: { icon: IconName; name: string; body: string }[] = [
  { icon: 'compass-outline', name: 'Explore', body: 'Find places on the map, walk there, and hear what they hold as you arrive.' },
  { icon: 'eye-outline', name: 'Witness', body: 'Stand at a marked viewpoint, line up your photo, and add to the record of how the place changes.' },
  { icon: 'flower-outline', name: 'Ask', body: 'Ask about what you are seeing. Every answer shows the source it came from.' },
];

/** What the three tabs are for, in tourist terms. Their real names appear beside them. */
export function DiscoverScreen() {
  const router = useRouter();
  const next = nextRoute('discover');

  return (
    <OnboardingFrame
      stepKey="discover"
      footer={<Button label="Continue" block onPress={() => next && router.push(next)} />}
    >
      <View style={styles.wrap}>
        <Text variant="title">Your guide, as you walk</Text>
        <View style={styles.list}>
          {SURFACES.map((surface) => (
            <View key={surface.name} style={styles.row}>
              <View style={styles.icon}>
                <Icon name={surface.icon} size={26} color={colors.primary} />
              </View>
              <View style={styles.copy}>
                <Text variant="heading">{surface.name}</Text>
                <Text variant="body" tone="secondary">
                  {surface.body}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  list: { gap: spacing.lg },
  row: { flexDirection: 'row', gap: spacing.md },
  icon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
  },
  copy: { flex: 1, gap: spacing.xxs },
});
