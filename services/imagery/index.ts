import { StorageKeys } from '@/constants';

import { getJSON, setString } from '../storage';

/**
 * Satellite imagery for the map, from whichever provider is configured.
 *
 * Google Map Tiles is preferred: its tiles are made for renderers like ours,
 * and its hybrid tiles carry Google's own roads and labels, so Google imagery
 * is never mixed with another provider's map data. MapTiler is the fallback.
 *
 * Google needs a session token per map style, created once and reused until
 * it expires. A key without billing, or without the Map Tiles API enabled,
 * yields no session, and the app simply offers no imagery: it never shows a
 * mode that cannot draw.
 */
const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY?.trim() || undefined;
const MAPTILER_KEY = process.env.EXPO_PUBLIC_MAPTILER_KEY?.trim() || undefined;

/** A key is configured. Whether it works is only known once a session is made. */
export const IMAGERY_CONFIGURED = Boolean(GOOGLE_KEY || MAPTILER_KEY);

export type Imagery = {
  provider: 'google' | 'maptiler';
  satellite: string;
  /** Imagery with the provider's own roads and labels; null to overlay ours. */
  hybrid: string | null;
  tileSize: number;
  attribution: string;
  /** Google only: where to ask for the copyright text for the current view. */
  viewportUrl: string | null;
};

type Session = { session: string; expiry: number };
type Sessions = Partial<Record<'satellite' | 'hybrid', Session>>;

const SESSION_TIMEOUT_MS = 10_000;
/** Renew a day early, so a session never expires in the middle of a trek. */
const RENEW_MARGIN_S = 24 * 60 * 60;

async function createGoogleSession(kind: 'satellite' | 'hybrid'): Promise<Session | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS);
  try {
    const response = await fetch(`https://tile.googleapis.com/v1/createSession?key=${GOOGLE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mapType: 'satellite',
        language: 'en-US',
        region: 'NP',
        ...(kind === 'hybrid' ? { layerTypes: ['layerRoadmap'] } : {}),
      }),
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { session?: string; expiry?: string };
    const expiry = Number(body.expiry);
    return body.session && Number.isFinite(expiry) ? { session: body.session, expiry } : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function googleImagery(): Promise<Imagery | null> {
  const now = Date.now() / 1000;
  const stored = await getJSON<Sessions>(StorageKeys.googleTileSessions, {});
  const fresh = (session: Session | undefined) => (session && session.expiry - RENEW_MARGIN_S > now ? session : undefined);
  const satellite = fresh(stored.satellite) ?? (await createGoogleSession('satellite'));
  if (!satellite) return null;
  const hybrid = fresh(stored.hybrid) ?? (await createGoogleSession('hybrid'));
  await setString(StorageKeys.googleTileSessions, JSON.stringify({ satellite, hybrid: hybrid ?? undefined }));
  const tiles = (session: Session) =>
    `https://tile.googleapis.com/v1/2dtiles/{z}/{x}/{y}?session=${session.session}&key=${GOOGLE_KEY}`;
  return {
    provider: 'google',
    satellite: tiles(satellite),
    hybrid: hybrid ? tiles(hybrid) : null,
    tileSize: 256,
    attribution: 'Google',
    viewportUrl: `https://tile.googleapis.com/tile/v1/viewport?session=${satellite.session}&key=${GOOGLE_KEY}`,
  };
}

let pending: Promise<Imagery | null> | null = null;

/** The imagery to offer, or null when none is configured or working. Asked once per launch. */
export function getImagery(): Promise<Imagery | null> {
  const attempt = (pending ??= (async (): Promise<Imagery | null> => {
    if (GOOGLE_KEY) {
      const google = await googleImagery();
      if (google) return google;
    }
    if (MAPTILER_KEY) {
      return {
        provider: 'maptiler',
        satellite: `https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${MAPTILER_KEY}`,
        hybrid: null,
        tileSize: 512,
        attribution: '<a href="https://www.maptiler.com/copyright/">MapTiler</a>',
        viewportUrl: null,
      };
    }
    return null;
  })().then((imagery) => {
    // A failed attempt (offline, billing off) is retried on the next ask, not remembered.
    if (!imagery) pending = null;
    return imagery;
  }));
  return attempt;
}
