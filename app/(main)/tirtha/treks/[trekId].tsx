import { useLocalSearchParams } from 'expo-router';

import { TrekDetailScreen } from '@/features/treks';

export default function TrekRoute() {
  const { trekId } = useLocalSearchParams<{ trekId: string }>();
  return <TrekDetailScreen trekId={trekId} />;
}
