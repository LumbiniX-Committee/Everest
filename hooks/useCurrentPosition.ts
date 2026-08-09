import { useCallback, useEffect, useState } from 'react';

import { location as locationService } from '@/services';
import { usePermission } from '@/store';
import type { Coordinate } from '@/types';

export type PositionState = {
  coordinate: Coordinate | null;
  accuracyM: number | null;
  /** True while we are waiting for a first fix with permission already granted. */
  acquiring: boolean;
  /** True when location is refused or unavailable — the UI should degrade, not error. */
  unavailable: boolean;
  /** True while fixes are coming from the scripted walk rather than the GPS. */
  demoMode: boolean;
  setDemoMode: (active: boolean) => void;
  toggleDemoMode: () => void;
};

/**
 * Current position, gated on the location permission.
 *
 * Never requests permission itself. If location is not granted the hook reports
 * `unavailable` and the screen shows its distance-free variant, which is a
 * fully usable state rather than a failure.
 *
 * Demo mode is not handled here beyond lifting the permission gate. The walk
 * arrives through `locationService.watchPosition` like any other fix, so this
 * hook — and everything reading it — behaves identically either way. An earlier
 * version returned a hardcoded coordinate from this function instead, which
 * meant demo mode tested the return statement below and nothing else.
 */
export function useCurrentPosition(
  options: { watch?: boolean; highAccuracy?: boolean } = {},
): PositionState {
  const { watch = false, highAccuracy = false } = options;
  const { state } = usePermission('location');
  const granted = state.status === 'granted';

  const [demoMode, setDemoModeState] = useState<boolean>(() => locationService.isDemoMode());

  useEffect(() => {
    return locationService.subscribeDemoMode(() => {
      setDemoModeState(locationService.isDemoMode());
    });
  }, []);

  const [position, setPosition] = useState<{
    coordinate: Coordinate | null;
    accuracyM: number | null;
    acquiring: boolean;
    unavailable: boolean;
  }>({
    coordinate: null,
    accuracyM: null,
    acquiring: false,
    unavailable: false,
  });

  useEffect(() => {
    // The walk needs no permission — that is most of its value on a desk in a
    // room with no sky. Refused location plus demo mode is a working app.
    if (!granted && !demoMode) {
      setPosition({ coordinate: null, accuracyM: null, acquiring: false, unavailable: true });
      return;
    }

    let cancelled = false;
    setPosition((prev) => ({ ...prev, acquiring: true, unavailable: false }));

    if (watch) {
      const stop = locationService.watchPosition(
        (fix) => {
          if (cancelled) return;
          setPosition({
            coordinate: fix.coordinate,
            accuracyM: fix.accuracyM,
            acquiring: false,
            unavailable: false,
          });
        },
        { highAccuracy },
      );
      return () => {
        cancelled = true;
        stop();
      };
    }

    locationService.getCurrentFix().then((fix) => {
      if (cancelled) return;
      setPosition({
        coordinate: fix?.coordinate ?? null,
        accuracyM: fix?.accuracyM ?? null,
        acquiring: false,
        unavailable: fix == null,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [granted, demoMode, watch, highAccuracy]);

  const setDemoMode = useCallback((active: boolean) => {
    locationService.setDemoMode(active);
  }, []);

  const toggleDemoMode = useCallback(() => {
    locationService.setDemoMode(!locationService.isDemoMode());
  }, []);

  return { ...position, demoMode, setDemoMode, toggleDemoMode };
}
