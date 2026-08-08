import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';

import { demoPrecincts, findPrecinct } from '@/data';
import {
  MAX_MONITORED_REGIONS,
  MIN_GEOFENCE_RADIUS_M,
  type Precinct,
} from '@/types';

/**
 * Arrival detection.
 *
 * The OS watches the regions, not us. Polling GPS in the background to compare
 * distances would flatten a phone over a day of walking the site, and is the
 * single most common way this feature is built wrong. `startGeofencingAsync`
 * hands the work to the platform, which uses cell and wifi transitions and
 * wakes the app only on a crossing.
 *
 * What this cannot do is tell you which monument you are at — see
 * types/precinct.ts. It answers "have you arrived", and the foreground decides
 * the rest.
 */

export const GEOFENCE_TASK = 'sakshi-precinct-arrival';

export type ArrivalEvent = {
  precinctId: string;
  /** ISO 8601, UTC. */
  at: string;
};

type ArrivalHandler = (event: ArrivalEvent) => void | Promise<void>;

/**
 * Set by the app at startup.
 *
 * Module-level because the task runs in a context with no React tree — on a
 * cold background wake the whole JS bundle is re-evaluated and nothing is
 * mounted, so a handler stored in state would not exist to call.
 */
let onArrival: ArrivalHandler | null = null;

export function setArrivalHandler(handler: ArrivalHandler | null): void {
  onArrival = handler;
}

/**
 * Regions must be validated before they reach the OS.
 *
 * Both failure modes here are silent on a device: a radius under ~100 m
 * produces erratic enter/exit events rather than an error, and regions past the
 * platform cap are dropped without warning. Failing loudly at startup is worth
 * more than debugging why the fourth precinct never fires.
 */
export function validatePrecincts(precincts: Precinct[] = demoPrecincts): string[] {
  const problems: string[] = [];

  if (precincts.length > MAX_MONITORED_REGIONS) {
    problems.push(
      `${precincts.length} precincts exceeds the ${MAX_MONITORED_REGIONS}-region iOS cap; ` +
        'monitor only the nearest N instead.',
    );
  }

  for (const p of precincts) {
    if (p.radiusMetres < MIN_GEOFENCE_RADIUS_M) {
      problems.push(
        `${p.id}: radius ${p.radiusMetres} m is below the ${MIN_GEOFENCE_RADIUS_M} m floor; ` +
          'enter events will be unreliable.',
      );
    }
    if (p.siteIds.length === 0) {
      problems.push(`${p.id}: no sites, so an arrival would have nothing to show.`);
    }
  }

  return problems;
}

export type GeofencingStartResult =
  | { started: true }
  | { started: false; reason: 'permission' | 'unsupported' | 'invalid'; detail?: string };

/**
 * Begins monitoring. Foreground permission is required; background permission
 * is what lets arrivals fire with the app closed, and is requested separately
 * by the caller so the two prompts can be explained apart.
 */
export async function startGeofencing(
  precincts: Precinct[] = demoPrecincts,
): Promise<GeofencingStartResult> {
  const problems = validatePrecincts(precincts);
  if (problems.length > 0) {
    return { started: false, reason: 'invalid', detail: problems.join(' ') };
  }

  const { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') {
    return { started: false, reason: 'permission' };
  }

  if (!(await Location.hasServicesEnabledAsync())) {
    return { started: false, reason: 'unsupported', detail: 'Location services are off.' };
  }

  // Restarting is cheaper than reasoning about whether the region list changed.
  await stopGeofencing();

  await Location.startGeofencingAsync(
    GEOFENCE_TASK,
    precincts.map((p) => ({
      identifier: p.id,
      latitude: p.centre.latitude,
      longitude: p.centre.longitude,
      radius: p.radiusMetres,
      notifyOnEnter: true,
      // Exit is not interesting: leaving a precinct is not an event anyone
      // needs told about, and monitoring it doubles the wakeups.
      notifyOnExit: false,
    })),
  );

  return { started: true };
}

export async function stopGeofencing(): Promise<void> {
  if (await TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK)) {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
  }
}

export async function isGeofencingActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(GEOFENCE_TASK);
}

/**
 * Defined at module scope, not inside a component.
 *
 * TaskManager resolves the task by name when the OS wakes the app, which may
 * happen before — or entirely without — any UI mounting. Registering it inside
 * an effect would mean the task is undefined on exactly the cold-start path it
 * exists to serve.
 */
TaskManager.defineTask(GEOFENCE_TASK, async ({ data, error }) => {
  if (error) return;

  const { eventType, region } = (data ?? {}) as {
    eventType?: Location.GeofencingEventType;
    region?: Location.LocationRegion;
  };

  if (eventType !== Location.GeofencingEventType.Enter) return;
  if (!region?.identifier || !findPrecinct(region.identifier)) return;

  await onArrival?.({ precinctId: region.identifier, at: new Date().toISOString() });
});
