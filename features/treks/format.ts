import type { DistanceUnit } from '@/types';

/** Altitude in the visitor's units. Null stays a dash: unmeasured is never 0. */
export function formatAltitude(metres: number | null | undefined, unit: DistanceUnit): string {
  if (metres == null || !Number.isFinite(metres)) return '—';
  if (unit === 'imperial') return `${Math.round(metres * 3.28084).toLocaleString('en-US')} ft`;
  return `${Math.round(metres).toLocaleString('en-US')} m`;
}

/** Walking hours as "4½ h". Null stays a dash. */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return '—';
  const whole = Math.floor(hours);
  return `${whole}${hours - whole >= 0.5 ? '½' : ''} h`;
}
