import { useCallback, useEffect, useMemo, useState } from 'react';

import { location as locationService } from '@/services';
import type { DemoStep } from '@/services/location/demoWalk';

export type DemoWalkState = {
  /** True while fixes are coming from the scripted walk. */
  active: boolean;
  /** The walk's current fix, with what the pilgrim is doing at it. */
  step: DemoStep | null;
  /** The whole planned way, for the map to draw. Empty when not walking. */
  route: readonly (readonly [number, number])[];
  toggle: () => void;
  /** Back to the south gate without leaving demo mode. */
  restart: () => void;
};

const NO_ROUTE: readonly (readonly [number, number])[] = [];

/**
 * The demo walk, for the parts of the UI that narrate it.
 *
 * Position itself does *not* come from here — it comes from
 * `useCurrentPosition`, through the ordinary location service, because the
 * point of the walk is that nothing has to know it is synthetic. What this hook
 * adds is the commentary the walk can give and a real fix cannot: which site is
 * being walked to, how far around the circuit the pilgrim is, where the route
 * goes next.
 */
export function useDemoWalk(): DemoWalkState {
  const [active, setActive] = useState(() => locationService.isDemoMode());
  const [step, setStep] = useState<DemoStep | null>(() => locationService.demo.currentStep());

  useEffect(
    () => locationService.subscribeDemoMode(() => setActive(locationService.isDemoMode())),
    [],
  );

  useEffect(() => {
    if (!active) {
      setStep(null);
      return;
    }
    return locationService.demo.subscribe(setStep);
  }, [active]);

  // Built once and only while walking. It is a few hundred coordinates, and it
  // is passed to the map as injected JavaScript on every change of identity.
  const route = useMemo(
    () => (active ? locationService.demo.demoRoute() : NO_ROUTE),
    [active],
  );

  const toggle = useCallback(() => {
    locationService.setDemoMode(!locationService.isDemoMode());
  }, []);

  const restart = useCallback(() => {
    locationService.demo.restart();
  }, []);

  return { active, step, route, toggle, restart };
}
