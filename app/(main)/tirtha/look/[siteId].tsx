import { useLocalSearchParams } from 'expo-router';

import { LookAroundScreen } from '@/features/panorama';

export default function LookAroundRoute() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  return <LookAroundScreen siteId={siteId} />;
}
