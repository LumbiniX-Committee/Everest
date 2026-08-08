import { getSupabase, isConfigured } from './index';
import {
  getUnsyncedObservations,
  markObservationSynced,
  getUnsyncedConditionReports,
  markConditionReportSynced,
} from '../database';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export type SyncState = 'offline' | 'syncing' | 'failed' | 'synced';

/**
 * Synchronizes unsynced observations and condition reports to Supabase.
 * Uploads local photos to the 'observations' storage bucket.
 */
export async function syncData(): Promise<void> {
  if (!isConfigured()) return;

  const supabase = getSupabase();

  // 1. Sync Observations
  const observations = await getUnsyncedObservations();
  for (const obs of observations) {
    try {
      // Read the image file as base64
      const base64File = await FileSystem.readAsStringAsync(obs.photoUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      const fileExt = obs.photoUri.split('.').pop() || 'jpg';
      const fileName = `${obs.id}.${fileExt}`;
      const filePath = `${obs.siteId}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('observations')
        .upload(filePath, decode(base64File), {
          contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`,
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Insert row into Supabase
      const { error: dbError } = await supabase.from('observations').upsert({
        id: obs.id,
        vantage_id: obs.vantageId,
        site_id: obs.siteId,
        captured_at: obs.capturedAt,
        photo_path: filePath,
        latitude: obs.coordinate.latitude,
        longitude: obs.coordinate.longitude,
        bearing: obs.bearing,
        pitch: obs.pitch,
        position_error_m: obs.positionErrorM,
        bearing_error_deg: obs.bearingErrorDeg,
        note: obs.note,
        assessment: obs.assessment,
        // Capture integrity. gate_mode is what tells a later reader whether the
        // two error columns above are measurements or a frame matched by eye —
        // sending those errors without it made the remote record misleading
        // rather than merely incomplete.
        gate_mode: obs.gateMode ?? null,
        align_score: obs.alignScore ?? null,
        gps_acc_m: obs.gpsAccuracyM ?? null,
      });

      if (dbError) throw dbError;

      // Mark as synced locally
      await markObservationSynced(obs.id);
    } catch (e) {
      console.warn(`Failed to sync observation ${obs.id}`, e);
      throw e;
    }
  }

  // 2. Sync Condition Reports
  const reports = await getUnsyncedConditionReports();
  for (const report of reports) {
    try {
      const { error } = await supabase.from('condition_reports').upsert({
        id: report.id,
        observation_id: report.observationId,
        site_id: report.siteId,
        category: report.category,
        subtype: report.subtype,
        severity: report.severity,
        note: report.note,
        recorded_at: report.recordedAt,
      });

      if (error) throw error;

      await markConditionReportSynced(report.id);
    } catch (e) {
      console.warn(`Failed to sync condition report ${report.id}`, e);
      throw e;
    }
  }
}
