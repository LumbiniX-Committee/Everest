import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EmptyState, LoadingState, ScreenHeader } from '@/components/common';
import { Button, Chip, Screen, Text } from '@/components/ui';
import { findSite, findVantage, primarySiteForQuest } from '@/data';
import { rankQuestsByCoverage } from '@/core/quests/priority';
import { coverage } from '@/services';
import { visitorCopy } from '@/i18n/visitor';
import { usePreferences } from '@/store';
import { useQuests } from '@/store/quests';
import { spacing } from '@/theme';
import type { QuestWithProgress } from '@/types';

import { QuestCard } from './components/QuestCard';

type FilterTab = 'all' | 'active' | 'available' | 'completed';

function getQuestRegionName(quest: QuestWithProgress): string {
  const primaryId = primarySiteForQuest(quest);
  const site = primaryId ? findSite(primaryId) : undefined;
  if (!site) return 'Heritage Quests';
  if (
    site.region === 'lumbini' ||
    site.zone === 'sacred_garden' ||
    site.zone?.startsWith('monastic')
  ) {
    return 'Lumbini Sacred Garden & Monastic Zone';
  }
  if (
    site.parentSiteId === 'kathmandu-durbar-square' ||
    site.id === 'kathmandu-durbar-square'
  ) {
    return 'Kathmandu Durbar Square';
  }
  if (
    site.parentSiteId === 'patan-durbar-square' ||
    site.id === 'patan-durbar-square' ||
    site.id === 'manga-hiti'
  ) {
    return 'Patan Durbar Square';
  }
  if (site.id === 'changu-narayan') {
    return 'Changu Narayan';
  }
  return site.name;
}

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

  const groups = Array.from(
    displayedQuests.reduce((map, quest) => {
      const region = getQuestRegionName(quest);
      const existing = map.get(region) ?? [];
      existing.push(quest);
      map.set(region, existing);
      return map;
    }, new Map<string, typeof displayedQuests>()),
  );

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow={t('quest.eyebrow')}
        title={t('quest.title')}
        subtitle={coverageRows.length
          ? t('quest.prioritySubtitle')
          : t('quest.subtitle')}
        rightAction={
          <Button
            label="Memories"
            variant="quiet"
            onPress={() => router.push('/(main)/tirtha/memories')}
          />
        }
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
          actionLabel="Explore the map"
          onAction={() => router.push('/(main)/tirtha/map')}
        />
      ) : (
        <View style={styles.list}>
          {groups.map(([regionName, groupQuests]) => {
            const completed = groupQuests.filter((quest) => quest.progress.status === 'completed').length;
            return (
              <View key={regionName} style={styles.placeGroup}>
                <View style={styles.placeHead}>
                  <Text variant="title">{regionName}</Text>
                  <Text variant="caption" tone="secondary">
                    {completed} / {groupQuests.length} {t('quest.complete')}
                  </Text>
                </View>
                {groupQuests.map((quest) => (
                  <QuestCard
                    key={quest.id}
                    quest={quest}
                    onPress={() => router.push(`/(main)/tirtha/quests/${quest.id}`)}
                  />
                ))}
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
  placeHead: { gap: spacing.xs, paddingTop: spacing.xs },
});
