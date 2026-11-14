import { decodePolyline, type Maneuver, type RoutePoint } from '@/core';
import type { Coordinate } from '@/types';

const DEFAULT_ROUTING_ENDPOINT = 'https://valhalla1.openstreetmap.de/route';

export type WalkingRoute = {
  coordinates: RoutePoint[];
  distanceM: number;
  durationSeconds: number;
  /** Turn-by-turn steps, in walking order. */
  maneuvers: Maneuver[];
};

/** A routing server that does not answer in this long is treated as down. */
const ROUTE_TIMEOUT_MS = 12_000;

type ValhallaResponse = {
  trip?: {
    summary?: { length?: number; time?: number };
    legs?: {
      shape?: string;
      maneuvers?: { instruction?: string; begin_shape_index?: number; length?: number }[];
    }[];
  };
};

/**
 * Ask a pedestrian routing graph for the mapped path, rather than drawing a
 * misleading straight line through buildings. The public endpoint keeps the
 * pilot usable without a key; deployments can point at their own Valhalla
 * instance with EXPO_PUBLIC_ROUTING_URL.
 */
export async function getWalkingRoute(
  origin: Coordinate,
  destination: Coordinate,
  signal?: AbortSignal,
): Promise<WalkingRoute> {
  const endpoint = process.env.EXPO_PUBLIC_ROUTING_URL?.trim() || DEFAULT_ROUTING_ENDPOINT;
  // Abort on whichever comes first: the caller giving up, or the server stalling.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lat: origin.latitude, lon: origin.longitude },
        { lat: destination.latitude, lon: destination.longitude },
      ],
      costing: 'pedestrian',
      directions_type: 'instructions',
      units: 'kilometers',
    }),
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  });
  if (!response.ok) throw new Error(`Walking route failed: ${response.status}`);

  const payload = await response.json() as ValhallaResponse;
  const shape = payload.trip?.legs?.[0]?.shape;
  if (!shape) throw new Error('Walking route has no geometry');
  const coordinates = decodePolyline(shape);
  if (coordinates.length < 2) throw new Error('Walking route is incomplete');

  // Preserve the person's and destination's exact locations around the
  // router's nearby snapped road/path points.
  coordinates[0] = [origin.longitude, origin.latitude];
  coordinates[coordinates.length - 1] = [destination.longitude, destination.latitude];
  const maneuvers: Maneuver[] = (payload.trip?.legs?.[0]?.maneuvers ?? [])
    .filter((m) => typeof m.instruction === 'string' && typeof m.begin_shape_index === 'number')
    .map((m) => ({
      instruction: m.instruction as string,
      beginIndex: m.begin_shape_index as number,
      lengthM: Math.round((m.length ?? 0) * 1_000),
    }));

  return {
    maneuvers,
    coordinates,
    distanceM: Math.round((payload.trip?.summary?.length ?? 0) * 1_000),
    durationSeconds: Math.round(payload.trip?.summary?.time ?? 0),
  };
}

export type FoundPlace = { id: string; name: string; detail: string; coordinate: Coordinate };

const SEARCH_ENDPOINT = 'https://nominatim.openstreetmap.org/search';

/** Why a place search returned nothing: no connection at all, or a server that did not answer well. */
export class PlaceSearchError extends Error {
  constructor(readonly reason: 'offline' | 'unavailable', message: string) {
    super(message);
    this.name = 'PlaceSearchError';
  }
}

/** A geocoder slower than this is treated as not answering. */
const SEARCH_TIMEOUT_MS = 8_000;

/**
 * Any named place in Nepal, from OpenStreetMap's geocoder: a tole, a bahal, a
 * hotel, a street. Only the words typed are sent. Nominatim asks apps to
 * identify themselves and to send no more than one search a second, which the
 * search box keeps to by waiting for typing to pause.
 */
export async function searchPlaces(query: string, signal?: AbortSignal): Promise<FoundPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  const url = `${SEARCH_ENDPOINT}?format=jsonv2&countrycodes=np&limit=8&accept-language=en&q=${encodeURIComponent(q)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort);
  let response: Response;
  try {
    response = await fetch(url, { headers: { 'User-Agent': 'Saksi/1.0 (heritage guide app)', Accept: 'application/json' }, signal: controller.signal });
  } catch (error) {
    // The caller cancelling (a newer keystroke) is not a failure to report.
    if (signal?.aborted) throw error;
    // fetch rejects without a response only when the request never got out, or timed out.
    throw new PlaceSearchError(controller.signal.aborted ? 'unavailable' : 'offline', String(error));
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }
  if (!response.ok) throw new PlaceSearchError('unavailable', `Place search failed: ${response.status}`);
  const rows = (await response.json()) as { place_id: number; name?: string; display_name: string; lat: string; lon: string }[];
  return rows
    .map((row) => {
      const parts = row.display_name.split(', ');
      return {
        id: `osm-${row.place_id}`,
        name: row.name || parts[0],
        detail: parts.slice(1, 4).join(', '),
        coordinate: { latitude: Number(row.lat), longitude: Number(row.lon) },
      };
    })
    .filter((place) => Number.isFinite(place.coordinate.latitude) && Number.isFinite(place.coordinate.longitude));
}
