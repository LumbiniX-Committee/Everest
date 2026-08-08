import * as database from '../database';
import * as supabase from '../supabase';
import type { Observation } from '@/types';

/**
 * Background sync service.
 *
 * Uploads queued observations (synced=false) to the server when connectivity
 * is available. Called on app foreground, after a capture, or on a periodic
 * timer. Each observation is uploaded individually so a single failure does
 * not block the rest of the queue.
 *
 * The photograph is uploaded first, then the metadata row. If the photo
 * upload succeeds but the row insert fails, the next sync pass will retry
 * the row (the photo is idempotent by observation id).
 */

const UPLOAD_ENDPOINT = '/captures';

/** Attempt to sync all unsynced observations. Returns count of newly synced. */
export async function syncPendingObservations(): Promise<number> {
  const db = await database.getDatabase();

  const rows = await db.getAllAsync<{
    id: string;
    vantage_id: string;
    site_id: string;
    captured_at: string;
    photo_uri: string;
    latitude: number;
    longitude: number;
    bearing: number;
    pitch: number;
    position_error_m: number;
    bearing_error_deg: number;
    note: string | null;
  }>('SELECT * FROM observations WHERE synced = 0 ORDER BY captured_at ASC');

  if (rows.length === 0) return 0;

  let synced = 0;

  for (const row of rows) {
    try {
      if (!supabase.isConfigured()) {
        // No supabase configured — skip silently
        break;
      }
      const client = supabase.getSupabase();

      // Upload photo to storage bucket
      const photoResponse = await fetch(row.photo_uri);
      const photoBlob = await photoResponse.blob();

      const storagePath = `observations/${row.id}.jpg`;
      const { error: uploadError } = await client.storage
        .from('captures')
        .upload(storagePath, photoBlob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.warn(`[sync] photo upload failed for ${row.id}:`, uploadError.message);
        continue;
      }

      // Insert metadata row
      const { error: insertError } = await client
        .from('observations')
        .upsert({
          id: row.id,
          vantage_id: row.vantage_id,
          site_id: row.site_id,
          captured_at: row.captured_at,
          photo_path: storagePath,
          latitude: row.latitude,
          longitude: row.longitude,
          bearing: row.bearing,
          pitch: row.pitch,
          position_error_m: row.position_error_m,
          bearing_error_deg: row.bearing_error_deg,
          note: row.note,
        });

      if (insertError) {
        console.warn(`[sync] row insert failed for ${row.id}:`, insertError.message);
        continue;
      }

      // Mark local record as synced
      await db.runAsync('UPDATE observations SET synced = 1 WHERE id = ?', row.id);
      synced += 1;
    } catch (err) {
      console.warn(`[sync] failed for ${row.id}:`, err);
      // Continue with next observation
    }
  }

  return synced;
}

/** Count of observations waiting to sync. */
export async function pendingCount(): Promise<number> {
  const db = await database.getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM observations WHERE synced = 0',
  );
  return row?.n ?? 0;
}
