import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { spacing } from '@/theme';

export type ErrorStateProps = {
  /** What failed, in the user's terms. Not the exception message. */
  title: string;
  /**
   * What it means for them, and what they can do. A failure the person cannot
   * act on should still say whether their data is safe — for an observation
   * that has been written to the device, saying so is the whole message.
   */
  body: string;
  onRetry?: () => void;
  retryLabel?: string;
  /** A way forward when retrying is not one. */
  onDismiss?: () => void;
  dismissLabel?: string;
};

/**
 * A recoverable failure.
 *
 * Deliberately not red. §29's palette has one alarm colour, `openCondition`,
 * and it means a heritage site is damaged. Spending it on a failed network
 * request would teach people to ignore it.
 */
export function ErrorState({
  title,
  body,
  onRetry,
  retryLabel = 'Try again',
  onDismiss,
  dismissLabel,
}: ErrorStateProps) {
  return (
    <View style={styles.wrap} accessibilityRole="alert">
      <Text variant="heading" center>
        {title}
      </Text>
      <Text variant="body" tone="secondary" center>
        {body}
      </Text>
      <View style={styles.actions}>
        {onRetry ? <Button label={retryLabel} variant="secondary" onPress={onRetry} /> : null}
        {onDismiss && dismissLabel ? (
          <Button label={dismissLabel} variant="quiet" onPress={onDismiss} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.base,
  },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', justifyContent: 'center' },
});
