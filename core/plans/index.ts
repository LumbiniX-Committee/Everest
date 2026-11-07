/**
 * Plans: what is free, what Pro unlocks, and how long Pro lasts.
 *
 * Pure so the rules can be tested without a server or a device. One list decides
 * what each plan includes, so changing the split means changing this file only.
 *
 * Nothing here can lock someone out of their own records, directions or safety
 * information. Those are not features in this list, and must never become one.
 */

export type ProFeature =
  | 'offline-packs'
  | '3d-views'
  | 'satellite-map'
  | 'close-up-guidance'
  | 'narration'
  | 'ai-companion';

export const PRO_FEATURES: readonly ProFeature[] = [
  'offline-packs',
  '3d-views',
  'satellite-map',
  'close-up-guidance',
  'narration',
  'ai-companion',
];

export type VisitorType = 'unset' | 'foreign' | 'nepali';

export type PlanPrice = { amount: number; currency: 'NPR' | 'USD'; period: 'month' };

/** Self-declared visitor type sets the price. No identity document is ever asked for. */
export function priceFor(visitor: VisitorType): PlanPrice {
  return visitor === 'nepali'
    ? { amount: 1000, currency: 'NPR', period: 'month' }
    : { amount: 20, currency: 'USD', period: 'month' };
}

/** A phone away from signal keeps Pro this long past the date it last confirmed. */
export const OFFLINE_GRACE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type Entitlement = {
  /** ISO instant, or null when no code has been redeemed. */
  expiresAt: string | null;
};

export function isProActive(entitlement: Entitlement, now: Date = new Date()): boolean {
  if (!entitlement.expiresAt) return false;
  const expires = Date.parse(entitlement.expiresAt);
  if (Number.isNaN(expires)) return false;
  return now.getTime() <= expires + OFFLINE_GRACE_DAYS * DAY_MS;
}

/** Whole days left, or null without Pro. Grace days are not promised to the visitor. */
export function daysRemaining(entitlement: Entitlement, now: Date = new Date()): number | null {
  if (!isProActive(entitlement, now) || !entitlement.expiresAt) return null;
  return Math.max(0, Math.ceil((Date.parse(entitlement.expiresAt) - now.getTime()) / DAY_MS));
}

/**
 * Whether a feature is open.
 *
 * With gating off everything is open. Gating stays off in store builds until the
 * store rules on selling digital features outside their billing have been checked.
 */
export function canUse(feature: ProFeature, entitlement: Entitlement, gatingOn: boolean, now: Date = new Date()): boolean {
  if (!PRO_FEATURES.includes(feature) || !gatingOn) return true;
  return isProActive(entitlement, now);
}

/** Tolerates lowercase and stray spaces, so a code typed from a message still works. */
export function normaliseCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
