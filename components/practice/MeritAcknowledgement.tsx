import { Modal, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Button, Card, Icon, ProgressIndicator, Text } from '@/components/ui';
import { usePractice } from '@/store/practice';
import { colors, radii, spacing } from '@/theme';
import { DAILY_MERIT_CAP, MERIT_LABELS, type MeritEvent } from '@/types';

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
        Puṇya +{event.amount} · {MERIT_LABELS[event.kind]}
      </Text>
      <Text variant="bodyLarge">{event.acknowledgement}</Text>
    </View>
  );
}

export type MeritRewardModalProps = {
  visible: boolean;
  onClose: () => void;
  event?: MeritEvent | null;
};

/**
 * What is shown at the moment of recognition: the puṇya recorded, the line
 * that goes with it, and where the day now stands against the cap.
 *
 * A null `event` is not an error and not a zero-award — it is the store saying
 * the day is already complete, or this act was already recognised. Showing
 * "+50" there would be the app congratulating itself for a ledger entry it did
 * not make, so the modal says what actually happened instead.
 */
export function MeritRewardModal({ visible, onClose, event }: MeritRewardModalProps) {
  const { summary } = usePractice();
  const awarded = event !== null && event !== undefined && event.amount > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View
          entering={FadeInDown.duration(320).damping(16)}
          style={styles.modalContainer}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Card style={styles.rewardCard}>
            <View style={styles.headerBadge}>
              <Icon name="flower-outline" size={30} />
            </View>

            <View style={styles.titleSection}>
              <Text variant="heading" center tone="sandstone">
                {awarded ? 'Recognised' : 'Recorded'}
              </Text>
              {awarded && event ? (
                <Text variant="display" center tone="sandstone" style={styles.pointsAmount}>
                  +{event.amount} puṇya
                </Text>
              ) : null}
              <Text variant="body" center tone="secondary">
                {event
                  ? event.acknowledgement
                  : summary.dayComplete
                    ? 'You have done enough today. The act is in the ledger; no further merit follows.'
                    : 'Already recognised. It stays in the ledger once.'}
              </Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statBox}>
                <Text variant="caption" tone="muted" uppercase>
                  Puṇya Balance
                </Text>
                <Text variant="label" tone="sandstone" style={styles.statValue}>
                  {summary.balance} points
                </Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statBox}>
                <Text variant="caption" tone="muted" uppercase>
                  Recognised today
                </Text>
                <Text variant="label" tone="sandstone" style={styles.statValue}>
                  {summary.todayMerit} / {DAILY_MERIT_CAP}
                </Text>
              </View>
            </View>

            <View style={styles.progressSection}>
              <View style={styles.progressHeader}>
                <Text variant="caption" tone="muted" uppercase>
                  Daily Cap Progress
                </Text>
                <Text variant="caption" tone="sandstone">
                  {summary.todayMerit} / {DAILY_MERIT_CAP}
                </Text>
              </View>
              <ProgressIndicator value={summary.todayMerit} total={DAILY_MERIT_CAP} showCount={false} />
            </View>

            <Button
              label="Continue Journey"
              variant="primary"
              onPress={onClose}
              style={styles.closeButton}
            />
          </Card>
        </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.base,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  rewardCard: {
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderColor: colors.sandstone,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  headerBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceSecondary,
    borderColor: colors.sandstone,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleSection: {
    gap: spacing.xs,
    alignItems: 'center',
    width: '100%',
  },
  pointsAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.sandstone,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: colors.border,
  },
  progressSection: {
    width: '100%',
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: '100%',
    marginTop: spacing.xs,
  },
});
