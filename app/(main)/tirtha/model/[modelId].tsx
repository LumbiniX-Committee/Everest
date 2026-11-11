import { useLocalSearchParams } from 'expo-router';

import { ModelScreen } from '@/features/models';

export default function ModelRoute() {
  const { modelId } = useLocalSearchParams<{ modelId: string }>();
  return <ModelScreen modelId={modelId} />;
}
