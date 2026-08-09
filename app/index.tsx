import { Redirect } from 'expo-router';

import { useAppState } from '@/store';

/**
 * The launch decision, and nothing else.
 *
 *   first launch → onboarding
 *   otherwise    → Tīrtha
 *
 * `hydrated` is guaranteed true here: the root layout does not render this
 * route until the stored flag has been read, so there is no window in which we
 * could redirect on a default value.
 */
export default function Index() {
  const { onboardingComplete } = useAppState();

  return <Redirect href={onboardingComplete ? '/(main)/tirtha/map' : '/onboarding'} />;
}
