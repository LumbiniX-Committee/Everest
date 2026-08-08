import { useLocalSearchParams } from 'expo-router';

import { ObservationScreen } from '@/features/sakshi';

export default function ObservationRoute() {
  const { observationId } = useLocalSearchParams<{ observationId: string }>();
  return <ObservationScreen observationId={observationId} />;
}
