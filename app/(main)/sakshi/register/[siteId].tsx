import { useLocalSearchParams } from 'expo-router';

import { SiteHistoryScreen } from '@/features/chaityavali';

export default function SiteHistoryRoute() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  return <SiteHistoryScreen siteId={siteId} />;
}
