import { useEffect, useState } from 'react';

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
};

/**
 * Current position, gated on the location permission.
 *
 * Never requests permission itself. If location is not granted the hook reports
 * `unavailable` and the screen shows its distance-free variant, which is a
 * fully usable state rather than a failure.
 */
export function useCurrentPosition(options: { watch?: boolean; highAccuracy?: boolean } = {}) {
  const { watch = false, highAccuracy = false } = options;
  const { state } = usePermission('location');
  const granted = state.status === 'granted';

  const [position, setPosition] = useState<PositionState>({
    coordinate: null,
    accuracyM: null,
    acquiring: false,
    unavailable: false,
  });

  useEffect(() => {
    if (!granted) {
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
  }, [granted, watch, highAccuracy]);

  return position;
}
