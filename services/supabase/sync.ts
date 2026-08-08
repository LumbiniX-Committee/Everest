import { getSupabase, isConfigured } from './index';
import {
  getUnsyncedObservations,
  markObservationSynced,
  getUnsyncedConditionReports,
  markConditionReportSynced,
  getUnsyncedQuestSubmissions,
  markQuestSubmissionSynced,
} from '../database';
import { getDeviceId } from '../device';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export type SyncState = 'offline' | 'syncing' | 'failed' | 'synced';

/**
 * Uploads a local photograph and returns the key it was stored under.
 *
 * Always before the row insert, never after: a failed upload throws here and no
 * row is written, so the table cannot end up pointing at a file that does not
 * exist. The reverse order leaves rows referring to nothing, which is worse
 * than a missing record because it reads as data.
 */
async function uploadPhoto(bucket: string, path: string, uri: string): Promise<void> {
  const base64File = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const ext = uri.split('.').pop() || 'jpg';
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(bucket).upload(path, decode(base64File), {
    contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    upsert: true,
  });

  if (error) throw error;
}

/**
 * Sends everything the device is holding that the server has not got.
 *
 * Three record types, in dependency order — condition reports carry a foreign
 * key to an observation, so observations go first or the report is refused for
 * pointing at a row that has not arrived yet.
 *
 * **One bad record must not strand the rest.** This loop used to re-throw on
 * the first failure, which meant a single unsyncable observation blocked every
 * observation and report behind it, on every pass, forever — and there was such
 * a record: a by-eye capture sends null errors, and those columns were declared
 * NOT NULL (see supabase/migrations/0003_by_eye_captures.sql). The rejection
 * was permanent, so the queue never drained again. Failures are now isolated
 * per record and reported together at the end, so one poisoned row costs one
 * row.
 */
export async function syncData(): Promise<void> {
  if (!isConfigured()) return;

  const supabase = getSupabase();
  // Groups this device's records on the server. Not a person and not
  // authentication — see services/device.
  const deviceId = await getDeviceId();

  const failures: string[] = [];

  // 1. Observations. First, because condition reports reference them.
  const observations = await getUnsyncedObservations();
  for (const obs of observations) {
    try {
      const ext = obs.photoUri.split('.').pop() || 'jpg';
      const filePath = `${obs.siteId}/${obs.id}.${ext}`;
      await uploadPhoto('observations', filePath, obs.photoUri);

      const { error: dbError } = await supabase.from('observations').upsert({
        id: obs.id,
        device_id: deviceId,
        vantage_id: obs.vantageId,
        site_id: obs.siteId,
        captured_at: obs.capturedAt,
        photo_path: filePath,
        latitude: obs.coordinate.latitude,
        longitude: obs.coordinate.longitude,
        bearing: obs.bearing,
        pitch: obs.pitch,
        // Null on a by-eye capture, and sent as null. A zero here would read as
        // a perfect measurement, which is a false record rather than a thin one.
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

      await markObservationSynced(obs.id);
    } catch (e) {
      console.warn(`Failed to sync observation ${obs.id}`, e);
      failures.push(`observation ${obs.id}`);
    }
  }

  // 2. Condition reports.
  const reports = await getUnsyncedConditionReports();
  for (const report of reports) {
    try {
      const { error } = await supabase.from('condition_reports').upsert({
        id: report.id,
        device_id: deviceId,
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
      failures.push(`condition report ${report.id}`);
    }
  }

  // 3. Quest evidence. A photograph of what someone saw at a named place on a
  // dated day is the same kind of thing an observation is, and it used to end
  // its life on the phone.
  const submissions = await getUnsyncedQuestSubmissions();
  for (const submission of submissions) {
    try {
      let photoPath: string | null = null;
      if (submission.photoUri) {
        const ext = submission.photoUri.split('.').pop() || 'jpg';
        // Keyed by device as well as task: the local (quest, task) pair is
        // unique on one phone but not across a shared bucket.
        photoPath = `${submission.questId}/${deviceId}-${submission.taskId}.${ext}`;
        await uploadPhoto('quest-evidence', photoPath, submission.photoUri);
      }

      const { error } = await supabase.from('quest_submissions').upsert(
        {
          device_id: deviceId,
          quest_id: submission.questId,
          task_id: submission.taskId,
          photo_path: photoPath,
          count: submission.count ?? null,
          note: submission.note ?? null,
          submitted_at: submission.submittedAt,
          // Advisory, and stored with its author so a later reader can weigh it
          // as an opinion rather than mistake it for a finding.
          review_verdict: submission.review?.verdict ?? null,
          review_comment: submission.review?.comment ?? null,
          review_model: submission.review?.model ?? null,
          reviewed_at: submission.review?.reviewedAt ?? null,
        },
        { onConflict: 'device_id,quest_id,task_id' },
      );

      if (error) throw error;

      await markQuestSubmissionSynced(submission.questId, submission.taskId);
    } catch (e) {
      console.warn(
        `Failed to sync quest submission ${submission.questId}/${submission.taskId}`,
        e,
      );
      failures.push(`quest submission ${submission.questId}/${submission.taskId}`);
    }
  }

  // Reported after everything that could be delivered has been. The caller
  // shows a failed state, and the records that did get through stay through.
  if (failures.length > 0) {
    throw new Error(
      `${failures.length} record(s) failed to sync: ${failures.join(', ')}`,
    );
  }
}
