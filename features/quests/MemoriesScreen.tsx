import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';

import { EmptyState, ScreenHeader } from '@/components/common';
import { BottomSheet, Card, Screen, Text } from '@/components/ui';
import { findSite, findVantage, areaForQuest } from '@/data';
import { database } from '@/services';
import { useQuests } from '@/store/quests';
import { colors, spacing } from '@/theme';
import type { QuestSubmission } from '@/types';

type Memory = QuestSubmission & {
  questTitle: string;
  taskTitle: string;
  siteName?: string;
};

/** A personal album made from the photographs already stored as quest evidence. */
export function MemoriesScreen() {
  const router = useRouter();
  const { quests } = useQuests();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selected, setSelected] = useState<Memory | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    const submissions = await database.listAllQuestSubmissions();
    const rows = submissions.flatMap((submission) => {
      const quest = quests.find((item) => item.id === submission.questId);
      const task = quest?.tasks.find((item) => item.id === submission.taskId);
      if (!quest || !task || !submission.photoUri) return [];
      return [{
        ...submission,
        questTitle: quest.title,
        taskTitle: task.title,
        siteName: areaForQuest(quest)?.name ?? (task.targetId ? findSite(task.targetId)?.name ?? findSite(findVantage(task.targetId)?.siteId ?? '')?.name : undefined),
      }];
    });
    setMemories(rows);
    setError(false);
  }, [quests]);

  useFocusEffect(useCallback(() => {
    void load().catch(() => setError(true));
  }, [load]));

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Inventory"
        title="Memories"
        subtitle="Photographs you captured while completing quests."
      />

      {error ? <Text tone="secondary">Your memories could not load. Reopen this album to retry.</Text> : null}
      {memories.length === 0 && !error ? (
        <EmptyState
          title="No memories stored yet"
          body="Capture a photo for a quest and store it here with the task and place it belongs to."
          actionLabel="Explore quests"
          onAction={() => router.replace('/(main)/tirtha/quests')}
        />
      ) : (
        <View style={styles.grid}>
          {memories.map((memory) => (
            <Pressable
              key={`${memory.questId}-${memory.taskId}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${memory.taskTitle} in ${memory.questTitle}`}
              onPress={() => setSelected(memory)}
            >
              <Card style={styles.memory}>
                <Image source={{ uri: memory.photoUri }} style={styles.photo} resizeMode="cover" />
                <View style={styles.copy}>
                  <Text variant="label" uppercase tone="sandstone">{memory.questTitle}</Text>
                  <Text variant="body">{memory.taskTitle}</Text>
                  <Text variant="caption" tone="secondary">
                    {memory.siteName ?? 'Quest memory'} · {new Date(memory.submittedAt).toLocaleDateString()}
                  </Text>
                  {memory.note ? (
                    <Text variant="caption" tone="muted" numberOfLines={2}>{memory.note}</Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}
      <BottomSheet visible={selected !== null} onClose={() => setSelected(null)} title={selected?.taskTitle ?? 'Memory'} subtitle={selected?.siteName} scroll>
        {selected?.photoUri ? <Image source={{ uri: selected.photoUri }} style={styles.fullPhoto} resizeMode="contain" /> : null}
        {selected ? <Text variant="caption" tone="muted">{new Date(selected.submittedAt).toLocaleString()}</Text> : null}
        {selected?.note ? <Text>{selected.note}</Text> : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fullPhoto: { width: '100%', height: 320 },
  grid: { gap: spacing.md, marginTop: spacing.lg },
  memory: { padding: 0, overflow: 'hidden', backgroundColor: colors.surface },
  photo: { width: '100%', height: 210, backgroundColor: colors.surfaceSecondary },
  copy: { gap: spacing.xs, padding: spacing.md },
});
