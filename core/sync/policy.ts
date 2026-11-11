export type UploadMode = 'wifi' | 'any' | 'manual';
export type ConnectionKind = 'wifi' | 'cellular' | 'other' | 'none';

/**
 * Whether records may leave the phone now, given the visitor's own setting.
 *
 * A tap on "Sync now" is that visitor asking directly, so it overrides the
 * setting, though nothing can upload with no connection at all. An unknown
 * connection counts as cellular: mobile data can be expensive, so uncertainty
 * must not spend it.
 */
export function mayUpload(mode: UploadMode, connection: ConnectionKind, requestedByUser = false): boolean {
  if (connection === 'none') return false;
  if (requestedByUser) return true;
  if (mode === 'manual') return false;
  if (mode === 'wifi') return connection === 'wifi';
  return true;
}
