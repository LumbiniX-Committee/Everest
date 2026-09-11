import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, LoadingState, ScreenHeader } from '@/components/common';
import { Chip, Screen, Text } from '@/components/ui';
import { findSite, findVantage, primarySiteForQuest } from '@/data';
import { rankQuestsByCoverage } from '@/core/quests/priority';
import { coverage } from '@/services';
import { visitorCopy } from '@/i18n/visitor';
import { usePreferences } from '@/store';
import { useQuests } from '@/store/quests';
import { spacing } from '@/theme';

import { QuestCard } from './components/QuestCard';

type FilterTab = 'all' | 'active' | 'available' | 'completed';

export function QuestListScreen() {
  const router = useRouter();
  const { hydrated, quests, inProgressQuests, availableQuests, completedQuests } = useQuests();
  const { preferences } = usePreferences();
  const t = (key: Parameters<typeof visitorCopy>[1]) => visitorCopy(preferences.interfaceLanguage, key);
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [coverageRows, setCoverageRows] = useState<coverage.VantageCoverage[]>([]);

  useEffect(() => {
    void coverage.getVantageCoverage().then(setCoverageRows);
  }, []);

  if (!hydrated) {
    return <LoadingState label="Reading the quest record" />;
  }

  const filteredQuests =
    activeTab === 'active'
      ? inProgressQuests
      : activeTab === 'available'
      ? availableQuests
      : activeTab === 'completed'
      ? completedQuests
      : quests;
  const displayedQuests = rankQuestsByCoverage(
    filteredQuests,
    coverageRows.map((row) => ({
      vantageId: row.vantage_id,
      siteId: row.site_id,
      priority: row.priority,
    })),
    (targetId) => findVantage(targetId)?.siteId ?? findSite(targetId)?.id,
  );

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
        eyebrow={t('quest.eyebrow')}
        title={t('quest.title')}
        subtitle={coverageRows.length
          ? t('quest.prioritySubtitle')
          : t('quest.subtitle')}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        <Chip label={`${t('quest.all')} (${quests.length})`} selected={activeTab === 'all'} onPress={() => setActiveTab('all')} />
        <Chip label={`${t('quest.active')} (${inProgressQuests.length})`} selected={activeTab === 'active'} onPress={() => setActiveTab('active')} />
        <Chip label={`${t('quest.available')} (${availableQuests.length})`} selected={activeTab === 'available'} onPress={() => setActiveTab('available')} />
        <Chip label={`${t('quest.completed')} (${completedQuests.length})`} selected={activeTab === 'completed'} onPress={() => setActiveTab('completed')} />
      </ScrollView>

      {displayedQuests.length === 0 ? (
        <EmptyState
          title={t('quest.emptyTitle')}
          body={t('quest.emptyBody')}
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
                  <Text variant="title">{root?.name ?? t('quest.group')}</Text>
                  <Text variant="body" tone={reached ? 'secondary' : 'muted'}>
                    {reached ? t('quest.reached') : t('quest.reachToBegin')}
                    {` · ${completed} / ${groupQuests.length} ${t('quest.complete')}`}
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
