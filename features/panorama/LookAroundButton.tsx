import { useRouter } from 'expo-router';

import { Button } from '@/components/ui';
import { panoramasFor } from '@/data';

/** Opens the 360° view from a site or place page; nothing where there is no panorama. */
export function LookAroundButton({ placeId }: { placeId: string }) {
  const router = useRouter();
  if (panoramasFor(placeId).length === 0) return null;
  return (
    <Button
      label="Look around in 360°"
      icon="panorama-variant-outline"
      variant="secondary"
      onPress={() => router.push(`/(main)/tirtha/look/${placeId}`)}
    />
  );
}
