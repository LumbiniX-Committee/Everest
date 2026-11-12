import { useLocalSearchParams } from 'expo-router';

import { ScanScreen } from '@/features/models';

export default function ScanRoute() {
  const { scanId } = useLocalSearchParams<{ scanId: string }>();
  return <ScanScreen scanId={scanId} />;
}
