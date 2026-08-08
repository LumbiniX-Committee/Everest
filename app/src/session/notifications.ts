/**
 * app/src/session/notifications.ts — notification suppression in the garden.
 *
 * Inside the Sacred Garden geofence, the app suppresses its own notifications
 * (A-MAP-AND-GAME 2.6). Small code, large pitch moment: an app about attention
 * that keeps interrupting you would be a lie. This governs only Sākṣī's own
 * notifications — it never touches other apps or system settings.
 */

import type { Zone } from '../../../shared/types.ts';

/** Zones treated as sacred ground where we stay silent. */
export const SILENT_ZONES: ReadonlySet<Zone> = new Set<Zone>(['sacred_garden']);

export interface NotificationContext {
  /** The zone the pilgrim is currently within, if any. */
  zone: Zone | null;
  /** True while inside any site geofence in that zone. */
  insideGeofence: boolean;
}

/**
 * Whether to suppress our own notifications right now. True inside a silent
 * zone's geofence.
 */
export function shouldSuppressNotifications(ctx: NotificationContext): boolean {
  return ctx.insideGeofence && ctx.zone != null && SILENT_ZONES.has(ctx.zone);
}
