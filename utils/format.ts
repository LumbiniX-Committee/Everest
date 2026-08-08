import type { Coordinate, DistanceUnit } from '@/types';

/** Distance for display. Metres/km or feet/mi depending on user preference. */
export function formatDistance(
  meters: number | null | undefined,
  unit: DistanceUnit = 'metric',
): string {
  if (meters == null || !Number.isFinite(meters)) return '—';
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    if (feet < 2640) return `${Math.round(feet)} ft`;
    const miles = meters / 1609.344;
    return `${miles.toFixed(1)} mi`;
  }
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

/** Bearing for display, always three digits, as on an instrument. */
export function formatBearing(deg: number | null | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '—';
  return `${Math.round(((deg % 360) + 360) % 360).toString().padStart(3, '0')}°`;
}

/** Signed correction, e.g. "+12°" / "−4°". Uses a true minus sign. */
export function formatDelta(deg: number | null | undefined): string {
  if (deg == null || !Number.isFinite(deg)) return '—';
  const rounded = Math.round(deg);
  if (rounded === 0) return '0°';
  return rounded > 0 ? `+${rounded}°` : `−${Math.abs(rounded)}°`;
}

/** Six decimal places is roughly 0.1 m — the right precision for a vantage. */
export function formatCoordinate({ latitude, longitude }: Coordinate): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/** Archival timestamp: unambiguous, sortable, no locale surprises. */
export function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(
    d.getUTCHours(),
  )}:${pad(d.getUTCMinutes())}Z`;
}

/** Human date for prose contexts, e.g. list subtitles. */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
