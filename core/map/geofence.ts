/**
 * app/src/map/geofence.ts — proximity detection with hysteresis.
 *
 * A darśana fires when a pilgrim enters a site's geofence. The hard part is the
 * boundary: a pilgrim standing exactly on the edge, with GPS jitter of a few
 * metres, would otherwise fire enter/exit twenty times a minute. So entry is at
 * radius `r` and exit only at `r × 1.15` — a Schmitt trigger for geography.
 *
 * Pure TypeScript over the shared geo primitives. No react-native, no location
 * subscription here — the caller feeds positions in via update(). That keeps it
 * testable with synthetic tracks and independent of how B wires expo-location.
 *
 * Source: 04-ARCHITECTURE §6, A-MAP-AND-GAME §2.
 */

import type { Coords } from '../../shared/types.ts';
import { haversine, formatDistance, bearing, compassLabel } from '../../shared/geo.ts';

/** Exit at 1.15× the entry radius — the hysteresis band that kills flapping. */
export const EXIT_HYSTERESIS = 1.15;

export interface GeofenceSite {
  id: string;
  coords: Coords;
  geofence_m: number;
}

export type GeofenceEventType = 'enter' | 'exit' | 'dwell';

export interface GeofenceEvent {
  type: GeofenceEventType;
  site_id: string;
  distance_m: number;
  at: number;
}

export interface GeofenceOptions {
  /** Fire a `dwell` event after this many ms continuously inside. Default 0 = off. */
  dwellMs?: number;
}

interface SiteState {
  inside: boolean;
  enteredAt: number;
  dwelled: boolean;
}

export class GeofenceWatcher {
  private readonly sites: GeofenceSite[];
  private readonly dwellMs: number;
  private readonly states = new Map<string, SiteState>();

  constructor(sites: GeofenceSite[], opts: GeofenceOptions = {}) {
    this.sites = sites;
    this.dwellMs = opts.dwellMs ?? 0;
    for (const s of sites) this.states.set(s.id, { inside: false, enteredAt: 0, dwelled: false });
  }

  /** Feed one position sample. Returns the events that fired on this tick. */
  update(pos: Coords, nowMs: number): GeofenceEvent[] {
    const events: GeofenceEvent[] = [];
    for (const site of this.sites) {
      const st = this.states.get(site.id)!;
      const d = haversine(pos, site.coords);
      const enterAt = site.geofence_m;
      const exitAt = site.geofence_m * EXIT_HYSTERESIS;

      if (!st.inside && d <= enterAt) {
        st.inside = true;
        st.enteredAt = nowMs;
        st.dwelled = false;
        events.push({ type: 'enter', site_id: site.id, distance_m: Math.round(d), at: nowMs });
      } else if (st.inside && d > exitAt) {
        st.inside = false;
        events.push({ type: 'exit', site_id: site.id, distance_m: Math.round(d), at: nowMs });
      } else if (
        st.inside &&
        !st.dwelled &&
        this.dwellMs > 0 &&
        nowMs - st.enteredAt >= this.dwellMs
      ) {
        st.dwelled = true;
        events.push({ type: 'dwell', site_id: site.id, distance_m: Math.round(d), at: nowMs });
      }
    }
    return events;
  }

  /** Sites the watcher currently considers the pilgrim inside. */
  insideNow(): string[] {
    return [...this.states.entries()].filter(([, s]) => s.inside).map(([id]) => id);
  }
}

export interface NearestSite {
  site: GeofenceSite;
  distance_m: number;
  /** e.g. "180 m" — the voice rule is plain and specific (07 §6). */
  label: string;
  /** e.g. "north-east" — an arrow hint toward the site. */
  compass: string;
}

/** Nearest site to a position, with a ready-to-render distance label and bearing. */
export function nearestSite(pos: Coords, sites: GeofenceSite[]): NearestSite | null {
  let best: NearestSite | null = null;
  for (const site of sites) {
    const d = haversine(pos, site.coords);
    if (!best || d < best.distance_m) {
      best = {
        site,
        distance_m: d,
        label: formatDistance(d),
        compass: compassLabel(bearing(pos, site.coords)),
      };
    }
  }
  return best;
}
