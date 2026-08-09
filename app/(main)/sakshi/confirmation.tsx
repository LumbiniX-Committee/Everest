import { useLocalSearchParams } from 'expo-router';

import { ConfirmationScreen } from '@/features/sakshi';

export default function ConfirmationRoute() {
  const { observationId } = useLocalSearchParams<{ observationId: string }>();
  return <ConfirmationScreen observationId={observationId} />;
}
