import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { EmptyState, ScreenHeader } from '@/components/common';
import { BottomSheet, Button, Card, Screen, Text } from '@/components/ui';
import { areaForQuest, findSite, findVantage } from '@/data';
import { database } from '@/services';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { useQuests } from '@/store/quests';
import { colors, radii, spacing } from '@/theme';
import type { QuestSubmission } from '@/types';

type Memory = QuestSubmission & {
  questTitle: string;
  taskTitle: string;
  siteName?: string;
};

/** A personal album made from the photographs already stored as quest evidence. */
export function MemoriesScreen() {
  const ui = useVisitorLiteralCopy();
  const router = useRouter();
  const { quests } = useQuests();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);

  const load = useCallback(async () => {
    try {
      const submissions = await database.listAllQuestSubmissions();
      const rows = submissions.flatMap((submission) => {
        const quest = quests.find((item) => item.id === submission.questId);
        const task = quest?.tasks.find((item) => item.id === submission.taskId);
        if (!quest || !task || !submission.photoUri) return [];
        const siteId = task.targetId
          ? findSite(task.targetId)?.id ?? findVantage(task.targetId)?.siteId
          : undefined;
        const site = siteId ? findSite(siteId) : undefined;
        const siteName = areaForQuest(quest)?.name ?? site?.name;
        return [{
          ...submission,
          questTitle: quest.title,
          taskTitle: task.title,
          siteName,
        }];
      });
      setMemories(rows);
    } catch {
      // Retain the existing memory album if storage read encounters an issue.
    }
  }, [quests]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Inventory"
        title="Memories"
        subtitle="Photographs you captured while completing quests."
      />

      {memories.length === 0 ? (
        <EmptyState
          title="No memories stored yet"
          body="Capture a photo for a quest and store it here with the task and place it belongs to."
          actionLabel="Explore quests"
          onAction={() => router.push('/(main)/tirtha/quests')}
        />
      ) : (
        <View style={styles.grid}>
          {memories.map((memory) => (
            <Pressable
              key={`${memory.questId}-${memory.taskId}`}
              accessibilityRole="button"
              accessibilityLabel={`${ui('Open')} ${memory.taskTitle} ${ui('in')} ${memory.questTitle}`}
              onPress={() => setSelectedMemory(memory)}
            >
              <Card style={styles.memory}>
                <Image source={{ uri: memory.photoUri }} style={styles.photo} resizeMode="cover" />
                <View style={styles.copy}>
                  <Text variant="label" uppercase tone="sandstone" translate={false}>{memory.questTitle}</Text>
                  <Text variant="body" translate={false}>{memory.taskTitle}</Text>
                  <Text variant="caption" tone="secondary" translate={false}>
                    {memory.siteName ? `${memory.siteName} · ` : ''}{new Date(memory.submittedAt).toLocaleDateString()}
                  </Text>
                  {memory.note ? (
                    <Text variant="caption" tone="muted" numberOfLines={2} translate={false}>{memory.note}</Text>
                  ) : null}
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      )}

      <BottomSheet
        visible={selectedMemory !== null}
        onClose={() => setSelectedMemory(null)}
        title={selectedMemory?.taskTitle ?? 'Memory'}
        subtitle={selectedMemory?.siteName ?? selectedMemory?.questTitle}
        translateTitle={false}
        scroll
      >
        {selectedMemory?.photoUri ? (
          <Image
            source={{ uri: selectedMemory.photoUri }}
            style={styles.modalPhoto}
            resizeMode="contain"
          />
        ) : null}
        <View style={styles.modalContent}>
          <Text variant="caption" tone="sandstone" uppercase translate={false}>
            {selectedMemory?.questTitle}
          </Text>
          <Text variant="caption" tone="secondary" translate={false}>
            {selectedMemory ? new Date(selectedMemory.submittedAt).toLocaleString() : ''}
          </Text>
          {selectedMemory?.note ? (
            <Text variant="body" translate={false} style={styles.modalNote}>
              {selectedMemory.note}
            </Text>
          ) : null}
          <View style={styles.modalActions}>
            <Button
              label="All Quests"
              variant="secondary"
              onPress={() => {
                const questId = selectedMemory?.questId;
                setSelectedMemory(null);
                if (questId) router.push(`/(main)/tirtha/quests/${questId}`);
              }}
            />
          </View>
        </View>
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md, marginTop: spacing.lg },
  memory: { padding: 0, overflow: 'hidden', backgroundColor: colors.surface },
  photo: { width: '100%', height: 210, backgroundColor: colors.surfaceSecondary },
  copy: { gap: spacing.xs, padding: spacing.md },
  modalPhoto: { width: '100%', height: 280, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md },
  modalContent: { gap: spacing.sm, paddingTop: spacing.md },
  modalNote: { lineHeight: 22 },
  modalActions: { marginTop: spacing.md },
});
