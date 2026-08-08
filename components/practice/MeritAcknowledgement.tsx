import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';
import { MERIT_LABELS, type MeritEvent } from '@/types';

export type MeritAcknowledgementProps = {
  event: MeritEvent;
};

/**
 * Puṇya, acknowledged once.
 *
 * Everything this component does not do is deliberate: no animation, no
 * counter ticking up, no badge, no sound, no "+1". §11 asks for recognition of
 * practice, and recognition is a sentence, not a reward.
 *
 * It also does not say what comes next. A person who has just recorded
 * something should be able to put the phone away, and a "keep going" line here
 * is exactly the pull the product is built to leave out.
 */
export function MeritAcknowledgement({ event }: MeritAcknowledgementProps) {
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="sandstone" uppercase>
        Puṇya · {MERIT_LABELS[event.kind]}
      </Text>
      <Text variant="bodyLarge">{event.acknowledgement}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.sandstone,
  },
});
