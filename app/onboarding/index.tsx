import { Redirect } from 'expo-router';

import { onboardingSteps } from '@/features/onboarding';

/** Entry point for the flow. The order lives in `features/onboarding/steps`. */
export default function OnboardingIndex() {
  return <Redirect href={onboardingSteps[0].route} />;
}
