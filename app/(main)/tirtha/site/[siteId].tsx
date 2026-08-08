import { useLocalSearchParams } from 'expo-router';

import { SiteDetailScreen } from '@/features/tirtha';

export default function SiteRoute() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  return <SiteDetailScreen siteId={siteId} />;
}
