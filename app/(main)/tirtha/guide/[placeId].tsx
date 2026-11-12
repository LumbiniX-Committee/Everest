import { useLocalSearchParams } from 'expo-router';

import { PlaceGuideScreen } from '@/features/guides';

export default function PlaceGuideRoute() {
  const { placeId } = useLocalSearchParams<{ placeId: string }>();
  return <PlaceGuideScreen placeId={placeId} />;
}
