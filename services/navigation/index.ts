import { decodePolyline, type RoutePoint } from '@/core';
import type { Coordinate } from '@/types';

const DEFAULT_ROUTING_ENDPOINT = 'https://valhalla1.openstreetmap.de/route';

export type WalkingRoute = {
  coordinates: RoutePoint[];
  distanceM: number;
  durationSeconds: number;
};

type ValhallaResponse = {
  trip?: {
    summary?: { length?: number; time?: number };
    legs?: { shape?: string }[];
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
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lat: origin.latitude, lon: origin.longitude },
        { lat: destination.latitude, lon: destination.longitude },
      ],
      costing: 'pedestrian',
      directions_type: 'none',
    }),
    signal,
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
  return {
    coordinates,
    distanceM: Math.round((payload.trip?.summary?.length ?? 0) * 1_000),
    durationSeconds: Math.round(payload.trip?.summary?.time ?? 0),
  };
}
