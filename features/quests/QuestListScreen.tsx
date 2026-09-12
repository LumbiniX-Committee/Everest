import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { LoadingState, ScreenHeader } from '@/components/common';
import { Screen } from '@/components/ui';
import { useCurrentPosition } from '@/hooks';
import { useQuests } from '@/store';
import { findSite, findVantage, vantagesForSite } from '@/data';
import { QuestAreaCollection } from './QuestAreaCollection';
import { coverage } from '@/services';
import { rankQuestsByCoverage } from '@/core/quests/priority';

export function QuestListScreen() {
  const router = useRouter();
  const { coordinate } = useCurrentPosition({ watch: true });
  const { hydrated, quests } = useQuests();
  const [coverageRows, setCoverageRows] = useState<coverage.VantageCoverage[]>([]);
  useEffect(() => { void coverage.getVantageCoverage().then(setCoverageRows); }, []);
  const rankedQuests = rankQuestsByCoverage(quests, coverageRows.map((row) => ({
    vantageId: row.vantage_id, siteId: row.site_id, priority: row.priority,
  })), (targetId) => findVantage(targetId)?.siteId ?? findSite(targetId)?.id);
  if (!hydrated) return <LoadingState label="Finding adventures" />;
  return <Screen scroll>
    <ScreenHeader title="Nearby adventures" subtitle="Choose a place. Make a memory." />
    <QuestAreaCollection coordinate={coordinate} quests={rankedQuests}
      onCapture={(questId, taskId) => router.push({ pathname: '/(main)/tirtha/quest-camera', params: { questId, taskId } })}
      onGuide={(area) => router.push({ pathname: '/(main)/tirtha/map', params: { guideArea: area.id } })}
      onMemories={() => router.push('/(main)/tirtha/memories')}
      onWitness={(targetId) => {
        const vantage = findVantage(targetId) ?? (findSite(targetId) ? vantagesForSite(targetId)[0] : undefined);
        if (vantage) router.push({ pathname: '/(main)/sakshi/vantage', params: { vantageId: vantage.id } });
      }}
    />
  </Screen>;
}
