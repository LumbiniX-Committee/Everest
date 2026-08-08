import { useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, LoadingState, ScreenHeader } from '@/components/common';
import { Chip, Screen } from '@/components/ui';
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
          {displayedQuests.map((quest) => (
            <QuestCard
              key={quest.id}
              quest={quest}
              onPress={() => router.push(`/(main)/tirtha/quests/${quest.id}`)}
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filterRow: { gap: spacing.sm, marginVertical: spacing.md },
  list: { gap: spacing.md, marginTop: spacing.sm },
});
