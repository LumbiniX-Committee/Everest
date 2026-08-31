import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, LoadingState, ScreenHeader } from '@/components/common';
import { Chip, Screen, Text } from '@/components/ui';
import { findSite, primarySiteForQuest } from '@/data';
import { useQuests } from '@/store/quests';
import { spacing } from '@/theme';

import { QuestCard } from './components/QuestCard';

type FilterTab = 'all' | 'active' | 'available' | 'completed';

export function QuestListScreen() {
  const router = useRouter();
  const { hydrated, quests, inProgressQuests, availableQuests, completedQuests } = useQuests();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  if (!hydrated) {
    return <LoadingState label="Reading the quest record" />;
  }

  const displayedQuests =
    activeTab === 'active'
      ? inProgressQuests
      : activeTab === 'available'
      ? availableQuests
      : activeTab === 'completed'
      ? completedQuests
      : quests;

  const groups = Array.from(displayedQuests.reduce((map, quest) => {
    const primaryId = primarySiteForQuest(quest);
    const primary = primaryId ? findSite(primaryId) : undefined;
    const rootId = primary?.parentSiteId ?? primary?.id ?? 'other';
    const existing = map.get(rootId) ?? [];
    existing.push(quest);
    map.set(rootId, existing);
    return map;
  }, new Map<string, typeof displayedQuests>()));

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Tīrtha"
        title="Heritage Quests"
        subtitle="Mindful walking, historical epigraphy, and conservation practice."
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Chip label={`All (${quests.length})`} selected={activeTab === 'all'} onPress={() => setActiveTab('all')} />
        <Chip label={`Active (${inProgressQuests.length})`} selected={activeTab === 'active'} onPress={() => setActiveTab('active')} />
        <Chip label={`Available (${availableQuests.length})`} selected={activeTab === 'available'} onPress={() => setActiveTab('available')} />
        <Chip label={`Completed (${completedQuests.length})`} selected={activeTab === 'completed'} onPress={() => setActiveTab('completed')} />
      </ScrollView>

      {displayedQuests.length === 0 ? (
        <EmptyState
          title="No Quests Found"
          body="There are no quests in this category right now."
        />
      ) : (
        <View style={styles.list}>
          {groups.map(([rootId, groupQuests]) => {
            const root = findSite(rootId);
            const completed = groupQuests.filter((quest) => quest.progress.status === 'completed').length;
            const reached = groupQuests.some((quest) => quest.tasks.some((task) =>
              task.autoComplete === 'arrival' && quest.progress.completedTasks.includes(task.id),
            ));
            return (
              <View key={rootId} style={styles.placeGroup}>
                <View style={styles.placeHead}>
                  <Text variant="title">{root?.name ?? 'Heritage journeys'}</Text>
                  <Text variant="body" tone={reached ? 'secondary' : 'muted'}>
                    {reached ? 'You reached this place' : 'Reach this place to begin automatically'}
                    {` · ${completed} / ${groupQuests.length} quests complete`}
                  </Text>
                </View>
                {groupQuests.map((quest) => {
                  const primaryId = primarySiteForQuest(quest);
                  const primary = primaryId ? findSite(primaryId) : undefined;
                  return (
                    <View key={quest.id} style={styles.questBlock}>
                      {primary?.parentSiteId ? (
                        <Text variant="label" tone="sandstone" uppercase>{primary.name}</Text>
                      ) : null}
                      <QuestCard
                        quest={quest}
                        onPress={() => router.push(`/(main)/tirtha/quests/${quest.id}`)}
                      />
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { gap: spacing.sm, marginVertical: spacing.md },
  list: { gap: spacing.md, marginTop: spacing.sm },
  placeGroup: { gap: spacing.md, marginBottom: spacing.xl },
  placeHead: { gap: spacing.xs, paddingTop: spacing.md },
  questBlock: { gap: spacing.xs },
});
