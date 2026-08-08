import { useLocalSearchParams } from 'expo-router';

import { ThenNowScreen } from '@/features/tirtha';

export default function ThenNowRoute() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  return <ThenNowScreen siteId={siteId} />;
}
