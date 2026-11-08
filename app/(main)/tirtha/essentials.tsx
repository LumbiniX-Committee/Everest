import { useLocalSearchParams } from 'expo-router';

import { EssentialsScreen } from '@/features/essentials';

export default function EssentialsRoute() {
  const { area, near, kind } = useLocalSearchParams<{ area?: string; near?: string; kind?: string }>();
  return <EssentialsScreen area={area} near={near} kind={kind} />;
}
