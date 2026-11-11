import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Card, Icon, Text } from '@/components/ui';
import type { ProFeature } from '@/core';
import { usePlan } from '@/store';
import { colors, spacing } from '@/theme';

/** Shows its children when the feature is open, otherwise a way to unlock it. */
export function ProGate({
  feature,
  title,
  body,
  children,
}: {
  feature: ProFeature;
  title: string;
  body: string;
  children: ReactNode;
}) {
  const { canUse } = usePlan();
  const router = useRouter();

  if (canUse(feature)) return <>{children}</>;

  return (
    <Card style={styles.card}>
      <View style={styles.head}>
        <Icon name="star-four-points-outline" size={22} color={colors.primary} />
        <Text variant="heading" style={styles.title}>
          {title}
        </Text>
      </View>
      <Text variant="body" tone="secondary">
        {body}
      </Text>
      <Button label="See Pro" variant="secondary" onPress={() => router.push('/(main)/settings/plans')} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { flex: 1 },
});
