import { useLocalSearchParams } from 'expo-router';

import { ThenNowScreen } from '@/features/tirtha';

/**
 * Then / Now, opened from Sākṣī.
 *
 * The same screen Tīrtha routes to, not a copy of it — there is one comparison
 * in this app and it should stay one, or the two drift until the divider
 * behaves differently depending on which surface you came in from.
 *
 * It needs its own route here rather than pushing the Tīrtha path because these
 * are separate stacks: navigating across would swap the surface out from under
 * the person and leave "back" returning them somewhere they had never been.
 */
export default function SakshiThenNowRoute() {
  const { siteId } = useLocalSearchParams<{ siteId: string }>();
  return <ThenNowScreen siteId={siteId} />;
}
