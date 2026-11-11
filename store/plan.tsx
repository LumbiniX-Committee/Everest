import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { canUse, daysRemaining, isProActive, type Entitlement, type ProFeature } from '@/core';
import { plans } from '@/services';
import type { RedeemResult } from '@/services/plans';

/**
 * Whether Pro is enforced. Off in store builds (see eas.json) until the stores'
 * rules on selling digital features outside their billing have been checked.
 */
export const PRO_GATING_ON = process.env.EXPO_PUBLIC_PRO_GATING === 'on';

type PlanState = {
  hydrated: boolean;
  gatingOn: boolean;
  isPro: boolean;
  daysLeft: number | null;
  canUse: (feature: ProFeature) => boolean;
  redeem: (code: string) => Promise<RedeemResult>;
};

const PlanContext = createContext<PlanState | null>(null);

export function PlanProvider({ children }: { children: ReactNode }) {
  const [entitlement, setEntitlement] = useState<Entitlement>({ expiresAt: null });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    void plans.cachedEntitlement().then((cached) => {
      if (!active) return;
      setEntitlement(cached);
      setHydrated(true);
      // A slow or absent network must not hold the plan the phone already knows.
      void plans.refreshEntitlement().then((fresh) => {
        if (active) setEntitlement(fresh);
      });
    });
    return () => {
      active = false;
    };
  }, []);

  const redeem = useCallback(async (code: string) => {
    const result = await plans.redeemCode(code);
    if (result.status === 'ok') setEntitlement(result.entitlement);
    return result;
  }, []);

  const value = useMemo<PlanState>(
    () => ({
      hydrated,
      gatingOn: PRO_GATING_ON,
      isPro: isProActive(entitlement),
      daysLeft: daysRemaining(entitlement),
      canUse: (feature) => canUse(feature, entitlement, PRO_GATING_ON),
      redeem,
    }),
    [entitlement, hydrated, redeem],
  );

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanState {
  const context = useContext(PlanContext);
  if (!context) throw new Error('usePlan must be used inside PlanProvider');
  return context;
}
