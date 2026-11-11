import { useLocalSearchParams } from 'expo-router';

import { TrekMapScreen } from '@/features/treks';

export default function TrekMapRoute() {
  const { trekId, day } = useLocalSearchParams<{ trekId: string; day?: string }>();
  return <TrekMapScreen trekId={trekId} day={day} />;
}
