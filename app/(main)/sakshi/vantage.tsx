import { useLocalSearchParams } from 'expo-router';

import { VantageScreen } from '@/features/sakshi';

export default function VantageRoute() {
  const { vantageId } = useLocalSearchParams<{ vantageId: string }>();
  return <VantageScreen vantageId={vantageId} />;
}
