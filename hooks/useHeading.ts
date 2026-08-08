import { useEffect, useState } from 'react';

import { sensors } from '@/services';

/**
 * Live compass heading in degrees, or null when there is no usable sensor.
 *
 * `enabled` exists so a screen can hold the subscription open only while it is
 * actually visible — the magnetometer is cheap but not free, and leaving it
 * running behind a navigation stack drains battery for nothing.
 */
export function useHeading(enabled = true): number | null {
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setHeading(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    sensors.isHeadingAvailable().then((available) => {
      if (cancelled || !available) return;
      unsubscribe = sensors.watchHeading(({ degrees }) => setHeading(degrees));
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);

  return heading;
}

/** Live pitch in degrees from level, or null when device motion is unavailable. */
export function usePitch(enabled = true): number | null {
  const [pitch, setPitch] = useState<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setPitch(null);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let cancelled = false;

    sensors.isAttitudeAvailable().then((available) => {
      if (cancelled || !available) return;
      unsubscribe = sensors.watchAttitude((attitude) => setPitch(attitude.pitch));
    });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [enabled]);

  return pitch;
}
