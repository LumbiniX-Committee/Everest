import * as FileSystem from 'expo-file-system';

import type {
  ConditionReport,
  MeritEvent,
  Observation,
  QuestSubmission,
} from '@/types';

import {
  countObservations,
  listConditionReports,
  listEveryQuestSubmission,
  listMeritEvents,
  listObservations,
  listQuestCompletions,
  listSiteVisits,
  wipeAllPersonalRecords,
  type QuestCompletionRecord,
  type SiteVisit,
} from '../database';
import { forgetDeviceId, peekDeviceId } from '../device';
import { forgetIdentity } from '../supabase/auth';

/**
 * Export and deletion for this device's own personal-activity records.
 *
 * See docs/DATA-ARCHITECTURE.md ("Deliberately not planned: Deleting
 * observations") and docs/PRIVACY.md for why "delete" here means what it
 * means: the app's evidentiary record is append-only by design — a mistaken
 * observation is corrected by a later one, not erased — so this cannot and
 * does not reach into Supabase and remove rows that already became part of
 * the shared conservation record.
 *
 * What it does instead, and what a privacy request actually needs: it wipes
 * every personal-activity table this device is holding (including a local
 * copy of anything already synced), deletes the local photograph files, and
 * severs the two things that could link this device's *next* actions back to
 * its *past* ones — the device id and the anonymous Supabase session. That
 * combination is exactly what a reinstall already does today (see
 * services/device and services/supabase/auth); this makes it reachable from
 * Settings, with no need to lose the app itself to get it.
 */

export type PersonalRecordsExport = {
  exportedAt: string;
  deviceId: string | null;
  observations: Observation[];
  conditionReports: ConditionReport[];
  questSubmissions: QuestSubmission[];
  meritEvents: MeritEvent[];
  siteVisits: SiteVisit[];
  questCompletions: QuestCompletionRecord[];
};

/** Counts shown before a delete, so the confirmation states what is at stake. */
export async function countMyRecords(): Promise<number> {
  return countObservations();
}

/** Everything this device currently holds, bundled as one JSON-serialisable object. */
export async function exportMyRecords(): Promise<PersonalRecordsExport> {
  const [deviceId, observations, conditionReports, questSubmissions, meritEvents, siteVisits, questCompletions] =
    await Promise.all([
      peekDeviceId(),
      listObservations(),
      listConditionReports(),
      listEveryQuestSubmission(),
      listMeritEvents(),
      listSiteVisits(),
      listQuestCompletions(),
    ]);

  return {
    exportedAt: new Date().toISOString(),
    deviceId,
    observations,
    conditionReports,
    questSubmissions,
    meritEvents,
    siteVisits,
    questCompletions,
  };
}

/**
 * Wipes local personal-activity records, deletes their photo files, and
 * starts this device fresh: a new device id and a new anonymous session, so
 * nothing captured from here on can be linked back to what came before.
 *
 * Order matters: the database rows are deleted first so a crash between steps
 * leaves no record referencing a photo this function is about to remove, and
 * the identifiers are forgotten last so a failure earlier never strands the
 * device mid-reset with no record but an old, still-linkable id.
 */
export async function deleteMyRecords(): Promise<void> {
  const { observationPhotoUris, questSubmissionPhotoUris } = await wipeAllPersonalRecords();

  await Promise.all(
    [...observationPhotoUris, ...questSubmissionPhotoUris].map((uri) =>
      FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {
        // Best-effort. The database rows are already gone; a photo file that
        // cannot be removed (already missing, permission denied) must not
        // block forgetting the device's identity, which is the part that
        // actually matters for privacy.
      }),
    ),
  );

  await forgetDeviceId();
  await forgetIdentity();
}
