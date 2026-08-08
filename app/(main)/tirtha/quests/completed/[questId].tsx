import { useLocalSearchParams } from 'expo-router';
import { QuestCompletedScreen } from '@/features/quests';

export default function QuestCompletedRoute() {
  const { questId } = useLocalSearchParams<{ questId: string }>();
  return <QuestCompletedScreen questId={questId ?? ''} />;
}
