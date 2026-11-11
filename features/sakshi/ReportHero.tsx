import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon, Text } from '@/components/ui';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, radii, spacing } from '@/theme';

const STEPS = [
  { icon: 'camera-outline', label: 'Photograph' },
  { icon: 'pencil-outline', label: 'Describe' },
  { icon: 'timeline-check-outline', label: 'Follow' },
] as const;

/**
 * The Report tab's opening card, in the same deep-jade voice as Explore's
 * Guide card, so the three verbs read as one app. It promises only what the
 * report flow does: a photo, a few words, and a timeline that moves when the
 * site acts, never on its own.
 */
export function ReportHero() {
  const ui = useVisitorLiteralCopy();
  return (
    <Animated.View entering={FadeInDown.duration(420)} style={styles.card}>
      <View pointerEvents="none" style={styles.glow} />
      <Text variant="label" tone="accent" uppercase>
        Report
      </Text>
      <Text variant="title" tone="onScrim" style={styles.title}>
        See something wrong?
      </Text>
      <Text variant="title" tone="accent" style={styles.titleAccent}>
        Flag it, then follow it.
      </Text>
      <Text variant="body" tone="onScrim" style={styles.body}>
        It works offline and sends when you are back in range. Each step is added by the people who look after the site, only when they act.
      </Text>
      <View style={styles.steps}>
        {STEPS.map((step, index) => (
          <View key={step.label} style={styles.step}>
            <View style={styles.stepIcon}>
              <Icon name={step.icon} size={18} color={colors.accent} />
            </View>
            <Text variant="caption" tone="onScrim">
              {`${index + 1}. ${ui(step.label)}`}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

const GLOW = 200;
const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundDeep,
    padding: spacing.lg,
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  glow: {
    position: 'absolute',
    width: GLOW,
    height: GLOW,
    borderRadius: GLOW / 2,
    right: -GLOW / 3,
    top: -GLOW / 3,
    backgroundColor: colors.accentSoft,
  },
  title: { marginTop: spacing.sm },
  titleAccent: { marginTop: -spacing.xs },
  body: { marginTop: spacing.sm, opacity: 0.85 },
  steps: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  step: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.scrimSoft,
    borderWidth: 1,
    borderColor: colors.onScrimBorder,
  },
  stepIcon: { height: 24, justifyContent: 'center' },
});
