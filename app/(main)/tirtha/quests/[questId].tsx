import { useLocalSearchParams } from 'expo-router';
import { QuestDetailScreen } from '@/features/quests';

export default function QuestDetailRoute() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  return <QuestDetailScreen questId={questId ?? ''} />;
}
