import { useLocalSearchParams } from 'expo-router';

import { CaptureScreen } from '@/features/sakshi';

export default function CaptureRoute() {
  const { vantageId } = useLocalSearchParams<{ vantageId: string }>();
  return <CaptureScreen vantageId={vantageId} />;
}
