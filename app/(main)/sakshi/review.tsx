import { useLocalSearchParams } from 'expo-router';

import { CaptureReviewScreen } from '@/features/sakshi';

export default function CaptureReviewRoute() {
  const { observationId } = useLocalSearchParams<{ observationId: string }>();
  return <CaptureReviewScreen observationId={observationId} />;
}
