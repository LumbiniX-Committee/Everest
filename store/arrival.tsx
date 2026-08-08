import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { demoPrecincts } from '@/data';
import { arrival, geofencing, notifications } from '@/services';
import type { Precinct } from '@/types';

/**
 * Arrival monitoring.
 *
 * The provider owns the lifecycle — permissions, starting and stopping the
 * geofences — but not the decision about what an arrival means. That lives in
 * services/arrival, because the OS can wake the app straight into the
 * geofencing task with no React tree mounted, and the same logic has to run
 * there.
 */

export type ArrivalStatus =
  | 'idle'
  | 'unsupported'
  | 'needs-permission'
  | 'monitoring'
  | 'invalid';

type ArrivalContextValue = {
  hydrated: boolean;
  status: ArrivalStatus;
  /** Set when status is 'invalid' — a precinct the OS would have rejected. */
  problem?: string;
  precincts: Precinct[];
  /** The last arrival seen while the app was running, for the UI to react to. */
  lastArrival: { precinctId: string; at: string } | null;
  enable: () => Promise<void>;
  disable: () => Promise<void>;
  /** Fires an arrival by hand. The demo path — see simulateArrival. */
  simulateArrival: (precinctId: string) => Promise<boolean>;
  clearLastArrival: () => void;
};

const ArrivalContext = createContext<ArrivalContextValue | null>(null);

export function ArrivalProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<ArrivalStatus>('idle');
  const [problem, setProblem] = useState<string | undefined>();
  const [hydrated, setHydrated] = useState(false);
  const [lastArrival, setLastArrival] = useState<{ precinctId: string; at: string } | null>(null);

  useEffect(() => {
    let active = true;

    void (async () => {
      await notifications.configure();

      // Registered before anything else can fire. The handler is module-level
      // in the service precisely so a background wake finds it set.
      geofencing.setArrivalHandler(async ({ precinctId, at }) => {
        await arrival.handleArrival(precinctId, at);
        if (active) setLastArrival({ precinctId, at });
      });

      const problems = geofencing.validatePrecincts(demoPrecincts);
      if (problems.length > 0) {
        if (active) {
          setProblem(problems.join(' '));
          setStatus('invalid');
          setHydrated(true);
        }
        return;
      }

      // Resume monitoring across restarts. Geofences do not survive a reboot,
      // so this is what makes the feature durable rather than a one-session
      // toggle the user has to remember to flip again.
      const active_ = await geofencing.isGeofencingActive();
      if (active) {
        setStatus(active_ ? 'monitoring' : 'idle');
        setHydrated(true);
      }
    })();

    return () => {
      active = false;
      geofencing.setArrivalHandler(null);
    };
  }, []);

  const enable = useCallback(async () => {
    const granted = await notifications.requestPermission();
    if (!granted) {
      setStatus('needs-permission');
      return;
    }

    const result = await geofencing.startGeofencing(demoPrecincts);
    if (result.started) {
      setStatus('monitoring');
      setProblem(undefined);
      return;
    }
    setProblem(result.detail);
    setStatus(
      result.reason === 'permission'
        ? 'needs-permission'
        : result.reason === 'invalid'
          ? 'invalid'
          : 'unsupported',
    );
  }, []);

  const disable = useCallback(async () => {
    await geofencing.stopGeofencing();
    setStatus('idle');
  }, []);

  /**
   * Runs the real arrival path, cooldown included, without walking anywhere.
   *
   * Not only a convenience: OS geofence detection takes 30 s to 3 minutes and
   * Android batches events, so a live demo that waits for a real crossing will
   * stand in silence. This exercises the same handleArrival the geofence calls,
   * so what is demonstrated is the actual behaviour.
   */
  const simulateArrival = useCallback(async (precinctId: string) => {
    const at = new Date().toISOString();
    const announced = await arrival.handleArrival(precinctId, at);
    setLastArrival({ precinctId, at });
    return announced;
  }, []);

  const clearLastArrival = useCallback(() => setLastArrival(null), []);

  const value = useMemo(
    () => ({
      hydrated,
      status,
      problem,
      precincts: demoPrecincts,
      lastArrival,
      enable,
      disable,
      simulateArrival,
      clearLastArrival,
    }),
    [hydrated, status, problem, lastArrival, enable, disable, simulateArrival, clearLastArrival],
  );

  return <ArrivalContext.Provider value={value}>{children}</ArrivalContext.Provider>;
}

export function useArrival(): ArrivalContextValue {
  const ctx = useContext(ArrivalContext);
  if (!ctx) throw new Error('useArrival must be used within an ArrivalProvider');
  return ctx;
}
