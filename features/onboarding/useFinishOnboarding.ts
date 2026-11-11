import { useCallback } from 'react';
import { useRouter } from 'expo-router';

import { useAppState } from '@/store';

/** Ends the introduction and lands on Home, from any step. */
export function useFinishOnboarding(): () => Promise<void> {
  const router = useRouter();
  const { completeOnboarding } = useAppState();
  return useCallback(async () => {
    await completeOnboarding();
    router.replace('/(main)/tirtha');
  }, [completeOnboarding, router]);
}
