import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { StorageKeys } from '@/constants';
import { storage } from '@/services';

/**
 * App-level state that must be known before the first route renders: has this
 * person been through onboarding?
 *
 * `hydrated` is the important field. Routing on `onboardingComplete` before the
 * value has been read back from disk would flash onboarding at every returning
 * user, so the root layout waits on `hydrated` instead of guessing.
 */

type AppState = {
  hydrated: boolean;
  onboardingComplete: boolean;
  completeOnboarding: () => Promise<void>;
  /** Development affordance: send yourself back through the first-run flow. */
  resetOnboarding: () => Promise<void>;
};

const AppStateContext = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    let active = true;
    storage.getBoolean(StorageKeys.onboardingComplete).then((value) => {
      if (!active) return;
      setOnboardingComplete(value);
      setHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const completeOnboarding = useCallback(async () => {
    // Update in memory first: navigation should not wait on a disk write.
    setOnboardingComplete(true);
    await storage.setBoolean(StorageKeys.onboardingComplete, true);
  }, []);

  const resetOnboarding = useCallback(async () => {
    setOnboardingComplete(false);
    await storage.setBoolean(StorageKeys.onboardingComplete, false);
  }, []);

  const value = useMemo(
    () => ({ hydrated, onboardingComplete, completeOnboarding, resetOnboarding }),
    [hydrated, onboardingComplete, completeOnboarding, resetOnboarding],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppState {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside <AppStateProvider>');
  return value;
}
