import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { useQuests } from '@/store/quests';
import { colors, spacing } from '@/theme';

export function QuestCompletedScreen({ questId }: { questId: string }) {
  const router = useRouter();
  const { getQuestById } = useQuests();
  const quest = getQuestById(questId);

  return (
    <Screen style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.badgeWrapper}>
          <Text style={styles.icon}>🪷</Text>
        </View>

        <Text variant="title" style={styles.title}>
          Quest Completed!
        </Text>
        <Text variant="body" tone="secondary" style={styles.subtitle}>
          You have completed "{quest?.title ?? 'Heritage Quest'}".
        </Text>

        <Card style={styles.rewardCard}>
          <Text variant="label" uppercase tone="muted">
            Puṇya Merit Recognized
          </Text>
          <Text variant="body" style={styles.rewardValue}>
            {quest?.intention ?? 'One act of attention, recognised.'}
          </Text>
          <Text variant="caption" tone="secondary" style={styles.quote}>
            "What you saw is now part of the record."
          </Text>
        </Card>

        <View style={styles.actions}>
          <Button
            label="Back to Quests"
            variant="primary"
            block
            onPress={() => router.replace('/(main)/tirtha/quests')}
          />
          <Button
            label="Return to Tīrtha"
            variant="secondary"
            block
            onPress={() => router.replace('/(main)/tirtha')}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  container: { alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.md },
  badgeWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 40 },
  title: { textAlign: 'center' },
  subtitle: { textAlign: 'center', paddingHorizontal: spacing.md },
  rewardCard: { width: '100%', alignItems: 'center', gap: spacing.sm, marginVertical: spacing.lg },
  rewardValue: { color: colors.sandstoneDeep },
  quote: { fontStyle: 'italic', textAlign: 'center' },
  actions: { width: '100%', gap: spacing.md },
});
