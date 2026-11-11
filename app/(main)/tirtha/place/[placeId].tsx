import { useLocalSearchParams } from 'expo-router';

import { PlaceDetailScreen } from '@/features/tirtha/PlaceDetailScreen';

export default function PlaceRoute() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  return <PlaceDetailScreen placeId={placeId} />;
}
