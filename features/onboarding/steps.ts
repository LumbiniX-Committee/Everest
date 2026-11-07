import type { Href } from 'expo-router';

/**
 * The first-run sequence.
 *
 * Declared as data rather than hardcoded `router.push` calls, so the flow can
 * be reordered or extended in one place and the progress indicator stays honest
 * without anyone remembering to update a count.
 *
 * It asks only what changes the next screens: language, then visitor type. The
 * rest can be skipped. Permissions wait until the moment each one is needed.
 */
export type OnboardingStep = {
  key: string;
  route: Href;
};

export const onboardingSteps: OnboardingStep[] = [
  { key: 'welcome', route: '/onboarding/welcome' },
  { key: 'visitor', route: '/onboarding/visitor' },
  { key: 'discover', route: '/onboarding/discover' },
  { key: 'start', route: '/onboarding/start' },
  { key: 'plan', route: '/onboarding/plan' },
];

export function stepIndex(key: string): number {
  return onboardingSteps.findIndex((step) => step.key === key);
}

/** The route after `key`, or null when this is the last step. */
export function nextRoute(key: string): Href | null {
  const index = stepIndex(key);
  if (index < 0 || index >= onboardingSteps.length - 1) return null;
  return onboardingSteps[index + 1].route;
}

export const TOTAL_STEPS = onboardingSteps.length;
/** Language and visitor type come first, because everything after depends on them. */
export const FIRST_SKIPPABLE_STEP = 2;
