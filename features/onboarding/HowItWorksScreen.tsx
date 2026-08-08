import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { colors, spacing } from '@/theme';

import { OnboardingFrame } from './OnboardingFrame';
import { nextRoute } from './steps';

/** The four-step loop, stated once. Detail belongs at the point of use, not here. */
const loop = [
  { step: 'Discover', detail: 'Find heritage sites around you in Lumbini.' },
  { step: 'Align', detail: 'Return to a fixed viewpoint and match it.' },
  { step: 'Witness', detail: 'Photograph what is there today.' },
  { step: 'Record', detail: 'Your observation joins the series for that viewpoint.' },
];

export function HowItWorksScreen() {
  const router = useRouter();
  const next = nextRoute('how-it-works');

  return (
    <OnboardingFrame
      stepKey="how-it-works"
      footer={<Button label="Continue" block onPress={() => next && router.push(next)} />}
    >
      <View style={styles.wrap}>
        <Text variant="title">How it works</Text>

        <View style={styles.loop}>
          {loop.map((entry, index) => (
            <View key={entry.step} style={styles.row}>
              <View style={styles.rail}>
                <View style={styles.node} />
                {index < loop.length - 1 ? <View style={styles.connector} /> : null}
              </View>
              <View style={styles.text}>
                <Text variant="heading" uppercase>
                  {entry.step}
                </Text>
                <Text variant="body" tone="secondary">
                  {entry.detail}
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
  loop: { gap: 0 },
  row: { flexDirection: 'row', gap: spacing.base },
  rail: { alignItems: 'center', width: 12 },
  node: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.sandstone,
    marginTop: spacing.sm,
  },
  connector: { flex: 1, width: 1, backgroundColor: colors.border, marginVertical: spacing.xs },
  text: { flex: 1, gap: spacing.xxs, paddingBottom: spacing.lg },
});
