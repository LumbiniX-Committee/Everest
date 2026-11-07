import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { spacing } from '@/theme';

/**
 * "What now?" on any screen where a task has just ended.
 *
 * A finished task must always point somewhere, so nobody is left on a screen
 * wondering where to go. One clear primary action, and at most one alternative.
 */
export function NextStep({
  title,
  body,
  actionLabel,
  onAction,
  secondaryLabel,
  onSecondary,
}: {
  title: string;
  body?: string;
  actionLabel: string;
  onAction: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.copy}>
        <Text variant="heading">{title}</Text>
        {body ? (
          <Text variant="body" tone="secondary">
            {body}
          </Text>
        ) : null}
      </View>
      <Button label={actionLabel} block onPress={onAction} />
      {secondaryLabel && onSecondary ? (
        <Button label={secondaryLabel} variant="quiet" block onPress={onSecondary} />
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  copy: { gap: spacing.xs },
});
