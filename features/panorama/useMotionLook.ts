import { useEffect, useRef, useState } from 'react';

import { angleDelta, compassUsableAt, easeAngle, wrapDegrees } from '@/core';
import { sensors } from '@/services';

export type MotionStatus = {
  /** Null until the phone has been asked whether it has a motion sensor. */
  available: boolean | null;
  /** True once the view's north has been matched to the compass. */
  aligned: boolean;
};

/**
 * Turns the phone's movement into a view direction for the 360° viewer.
 *
 * Device motion gives a smooth, quick direction but its zero is arbitrary on
 * iOS and magnetic on Android. Two cases:
 *
 * - On site, the compass (`watchHeading`, true north) slowly corrects that zero,
 *   so north in the photograph lies over north in the real square and the
 *   picture lines up with what the visitor sees around them.
 * - Elsewhere there is nothing real to line up with, so the view simply
 *   continues from where the visitor had dragged it, and turns as the phone
 *   turns.
 *
 * Readings go straight to `onLook`, not through React state: they arrive 20
 * times a second and only the viewer needs them.
 */
export function useMotionLook({
  enabled,
  onSite,
  startAzimuth,
  onLook,
}: {
  enabled: boolean;
  onSite: boolean;
  /** Where the view was facing when motion was switched on. */
  startAzimuth: () => number;
  onLook: (azimuth: number, elevation: number) => void;
}): MotionStatus {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [aligned, setAligned] = useState(false);
  const look = useRef(onLook);
  const start = useRef(startAzimuth);
  useEffect(() => {
    look.current = onLook;
    start.current = startAzimuth;
  });

  useEffect(() => {
    let active = true;
    sensors.isAttitudeAvailable().then(
      (yes) => active && setAvailable(yes),
      () => active && setAvailable(false),
    );
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    let manualOffset: number | null = null;
    let compassOffset: number | null = null;
    let lastElevation = 0;
    let lastAzimuth: number | null = null;

    const stopLook = sensors.watchLookDirection(({ azimuth, elevation }) => {
      lastAzimuth = azimuth;
      lastElevation = elevation;
      if (manualOffset == null) manualOffset = angleDelta(azimuth, start.current());
      const offset = compassOffset ?? manualOffset;
      look.current(wrapDegrees(azimuth + offset), elevation);
    });

    const stopHeading = onSite
      ? sensors.watchHeading(({ degrees }) => {
          if (lastAzimuth == null || !compassUsableAt(lastElevation)) return;
          const target = wrapDegrees(degrees - lastAzimuth);
          const first = compassOffset == null;
          // Gentle, so a compass that wobbles does not make the scene swim.
          compassOffset = easeAngle(compassOffset, target, 0.08);
          if (first) setAligned(true);
        })
      : () => {};

    return () => {
      stopLook();
      stopHeading();
      setAligned(false);
    };
  }, [enabled, onSite]);

  return { available, aligned: enabled && aligned };
}
