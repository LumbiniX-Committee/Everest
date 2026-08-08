import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { storage } from '@/services';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/types';

/**
 * Preferences, shared app-wide.
 *
 * A provider rather than a hook holding its own state: `alignmentTolerance` is
 * read by the reticle, `distanceUnit` by every site list, `scriptPreference` by
 * anything that prints a name. Per-consumer state would give each of those its
 * own copy, and changing a setting would update the settings screen and nothing
 * else.
 */

type PreferencesContextValue = {
  /** False until the first read comes back. */
  hydrated: boolean;
  preferences: UserPreferences;
  update: <K extends keyof UserPreferences>(field: K, value: UserPreferences[K]) => Promise<void>;
  reset: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await storage.getUserPreferences();
      if (!active) return;
      setPreferences(stored);
      setHydrated(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  /**
   * State moves first, then the write.
   *
   * A switch that waits on AsyncStorage before moving reads as a broken
   * control. The write cannot meaningfully fail either — the storage layer
   * swallows errors by design — so there is no failure state to roll back to;
   * the worst case is a preference that does not survive a restart.
   */
  const update = useCallback(
    async <K extends keyof UserPreferences>(field: K, value: UserPreferences[K]) => {
      setPreferences((prev) => ({ ...prev, [field]: value }));
      await storage.setUserPreference(field, value);
    },
    [],
  );

  const reset = useCallback(async () => {
    setPreferences(DEFAULT_USER_PREFERENCES);
    await storage.resetUserPreferences();
  }, []);

  const value = useMemo(
    () => ({ hydrated, preferences, update, reset }),
    [hydrated, preferences, update, reset],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within a PreferencesProvider');
  return ctx;
}
