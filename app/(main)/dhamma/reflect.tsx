import { useLocalSearchParams } from 'expo-router';

import { ReflectionScreen } from '@/features/dhamma';

export default function ReflectionRoute() {
  const { siteId } = useLocalSearchParams<{ siteId?: string }>();
  return <ReflectionScreen siteId={siteId} />;
}
