import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from '@/constants';
import type {
  ConditionReport,
  MeritEvent,
  Observation,
  ObservationAssessment,
} from '@/types';

/**
 * Local observation store.
 *
 * Observations are the app's only irreplaceable data — a photograph taken at a
 * vantage on a particular day cannot be retaken. They are written here first,
 * on device, and synced later. The database is the record; the network is an
 * optimisation.
 *
 * Schema changes go through `migrations` below. Never edit an existing entry.
 */

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Ordered, append-only. Index in this array is the schema version. */
const migrations: string[] = [
  `CREATE TABLE IF NOT EXISTS observations (
     id TEXT PRIMARY KEY NOT NULL,
     vantage_id TEXT NOT NULL,
     site_id TEXT NOT NULL,
     captured_at TEXT NOT NULL,
     photo_uri TEXT NOT NULL,
     latitude REAL NOT NULL,
     longitude REAL NOT NULL,
     bearing REAL NOT NULL,
     pitch REAL NOT NULL,
     position_error_m REAL NOT NULL,
     bearing_error_deg REAL NOT NULL,
     note TEXT,
     synced INTEGER NOT NULL DEFAULT 0
   );
   CREATE INDEX IF NOT EXISTS idx_observations_vantage
     ON observations (vantage_id, captured_at DESC);
   CREATE INDEX IF NOT EXISTS idx_observations_unsynced
     ON observations (synced) WHERE synced = 0;`,

  // Condition reporting. The assessment column defaults to 'unreviewed' so
  // observations recorded before this migration keep a truthful state — they
  // were never reviewed, and backfilling them as 'no-change' would invent a
  // finding nobody made.
  `ALTER TABLE observations
     ADD COLUMN assessment TEXT NOT NULL DEFAULT 'unreviewed';

   CREATE TABLE IF NOT EXISTS condition_reports (
     id TEXT PRIMARY KEY NOT NULL,
     observation_id TEXT NOT NULL,
     site_id TEXT NOT NULL,
     category TEXT NOT NULL,
     subtype TEXT NOT NULL,
     severity TEXT NOT NULL,
     note TEXT,
     recorded_at TEXT NOT NULL,
     synced INTEGER NOT NULL DEFAULT 0,
     FOREIGN KEY (observation_id) REFERENCES observations (id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_reports_observation
     ON condition_reports (observation_id);
   CREATE INDEX IF NOT EXISTS idx_reports_site
     ON condition_reports (site_id, recorded_at DESC);
   CREATE INDEX IF NOT EXISTS idx_reports_unsynced
     ON condition_reports (synced) WHERE synced = 0;`,

  // Puṇya. Note what is absent: no score, no weight, no running total column.
  // A merit event records that an act of attention happened, and the only
  // aggregate anyone computes from it is a count.
  `CREATE TABLE IF NOT EXISTS merit_events (
     id TEXT PRIMARY KEY NOT NULL,
     kind TEXT NOT NULL,
     occurred_at TEXT NOT NULL,
     site_id TEXT,
     observation_id TEXT,
     acknowledgement TEXT NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_merit_occurred
     ON merit_events (occurred_at DESC);
   -- One recognition per observation. The uniqueness is enforced here rather
   -- than in the caller so a retried write cannot double-count a single act.
   CREATE UNIQUE INDEX IF NOT EXISTS idx_merit_observation
     ON merit_events (observation_id) WHERE observation_id IS NOT NULL;`,
];

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;

  for (let version = current; version < migrations.length; version += 1) {
    await db.execAsync(migrations[version]);
    // PRAGMA does not accept bound parameters; the value is a loop index, not input.
    await db.execAsync(`PRAGMA user_version = ${version + 1}`);
  }
}

/** Opens (once) and migrates the database. Safe to call from anywhere. */
export function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await db.execAsync('PRAGMA journal_mode = WAL');
      // Off by default in sqlite, per connection. Without it the ON DELETE
      // CASCADE on condition_reports is decorative and deleting an observation
      // would strand its report pointing at a row that no longer exists.
      await db.execAsync('PRAGMA foreign_keys = ON');
      await migrate(db);
      return db;
    })().catch((error) => {
      // Let the next caller retry rather than caching a broken handle forever.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

type ObservationRow = {
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
  assessment: string;
  synced: number;
};

function toObservation(row: ObservationRow): Observation {
  return {
    id: row.id,
    vantageId: row.vantage_id,
    siteId: row.site_id,
    capturedAt: row.captured_at,
    photoUri: row.photo_uri,
    coordinate: { latitude: row.latitude, longitude: row.longitude },
    bearing: row.bearing,
    pitch: row.pitch,
    positionErrorM: row.position_error_m,
    bearingErrorDeg: row.bearing_error_deg,
    note: row.note ?? undefined,
    // Widened from TEXT. An unrecognised value means a newer build wrote a
    // state this one does not know; treating it as unreviewed is the reading
    // that cannot invent a finding.
    assessment: isAssessment(row.assessment) ? row.assessment : 'unreviewed',
    synced: row.synced === 1,
  };
}

function isAssessment(value: string): value is ObservationAssessment {
  return value === 'unreviewed' || value === 'no-change' || value === 'reported';
}

export async function insertObservation(observation: Observation): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO observations
       (id, vantage_id, site_id, captured_at, photo_uri, latitude, longitude,
        bearing, pitch, position_error_m, bearing_error_deg, note, assessment, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    observation.id,
    observation.vantageId,
    observation.siteId,
    observation.capturedAt,
    observation.photoUri,
    observation.coordinate.latitude,
    observation.coordinate.longitude,
    observation.bearing,
    observation.pitch,
    observation.positionErrorM,
    observation.bearingErrorDeg,
    observation.note ?? null,
    observation.assessment,
    observation.synced ? 1 : 0,
  );
}

/**
 * Records what the observer said they saw.
 *
 * Separate from the insert because the photograph and the judgement happen at
 * different moments — the shutter is pressed in the field, the assessment a few
 * seconds later while looking at the result. Writing the observation first
 * means a person who walks away mid-flow still keeps their photograph.
 */
export async function setObservationAssessment(
  observationId: string,
  assessment: ObservationAssessment,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE observations SET assessment = ? WHERE id = ?',
    assessment,
    observationId,
  );
}

/** Newest first — the time-series reads backwards from today. */
export async function listObservations(vantageId?: string): Promise<Observation[]> {
  const db = await getDatabase();
  const rows = vantageId
    ? await db.getAllAsync<ObservationRow>(
        'SELECT * FROM observations WHERE vantage_id = ? ORDER BY captured_at DESC',
        vantageId,
      )
    : await db.getAllAsync<ObservationRow>(
        'SELECT * FROM observations ORDER BY captured_at DESC',
      );
  return rows.map(toObservation);
}

export async function getObservation(id: string): Promise<Observation | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<ObservationRow>(
    'SELECT * FROM observations WHERE id = ?',
    id,
  );
  return row ? toObservation(row) : null;
}

type ConditionReportRow = {
  id: string;
  observation_id: string;
  site_id: string;
  category: string;
  subtype: string;
  severity: string;
  note: string | null;
  recorded_at: string;
  synced: number;
};

function toConditionReport(row: ConditionReportRow): ConditionReport {
  return {
    id: row.id,
    observationId: row.observation_id,
    siteId: row.site_id,
    // Cast rather than validate: unlike assessment there is no safe default —
    // an unrecognised category cannot be silently rewritten into another one
    // without misfiling somebody's report.
    category: row.category as ConditionReport['category'],
    subtype: row.subtype,
    severity: row.severity as ConditionReport['severity'],
    note: row.note ?? undefined,
    recordedAt: row.recorded_at,
    synced: row.synced === 1,
  };
}

/**
 * Writes the report and flips the observation to 'reported' in one transaction.
 *
 * Together or not at all: an observation marked 'reported' with no report is a
 * dead end in the UI, and a report attached to an observation that still reads
 * 'unreviewed' would prompt the person to report the same thing twice.
 */
export async function insertConditionReport(report: ConditionReport): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT OR REPLACE INTO condition_reports
         (id, observation_id, site_id, category, subtype, severity, note, recorded_at, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      report.id,
      report.observationId,
      report.siteId,
      report.category,
      report.subtype,
      report.severity,
      report.note ?? null,
      report.recordedAt,
      report.synced ? 1 : 0,
    );
    await db.runAsync(
      "UPDATE observations SET assessment = 'reported' WHERE id = ?",
      report.observationId,
    );
  });
}

/** Reports for one observation, or every report newest first. */
export async function listConditionReports(observationId?: string): Promise<ConditionReport[]> {
  const db = await getDatabase();
  const rows = observationId
    ? await db.getAllAsync<ConditionReportRow>(
        'SELECT * FROM condition_reports WHERE observation_id = ? ORDER BY recorded_at DESC',
        observationId,
      )
    : await db.getAllAsync<ConditionReportRow>(
        'SELECT * FROM condition_reports ORDER BY recorded_at DESC',
      );
  return rows.map(toConditionReport);
}

type MeritEventRow = {
  id: string;
  kind: string;
  occurred_at: string;
  site_id: string | null;
  observation_id: string | null;
  acknowledgement: string;
};

function toMeritEvent(row: MeritEventRow): MeritEvent {
  return {
    id: row.id,
    kind: row.kind as MeritEvent['kind'],
    occurredAt: row.occurred_at,
    siteId: row.site_id ?? undefined,
    observationId: row.observation_id ?? undefined,
    acknowledgement: row.acknowledgement,
  };
}

/**
 * Records one recognised act.
 *
 * `INSERT OR IGNORE` rather than `OR REPLACE`: the unique index on
 * observation_id means a second attempt for the same observation is a
 * duplicate, and the right response to a duplicate act of recognition is to
 * keep the first one, not overwrite it with a later timestamp.
 *
 * Returns false when the insert was ignored, so the caller can tell a fresh
 * recognition from a repeat and avoid acknowledging the same thing twice.
 */
export async function insertMeritEvent(event: MeritEvent): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO merit_events
       (id, kind, occurred_at, site_id, observation_id, acknowledgement)
     VALUES (?, ?, ?, ?, ?, ?)`,
    event.id,
    event.kind,
    event.occurredAt,
    event.siteId ?? null,
    event.observationId ?? null,
    event.acknowledgement,
  );
  return result.changes > 0;
}

/** Newest first. `since` is an ISO instant; omit for the whole record. */
export async function listMeritEvents(since?: string): Promise<MeritEvent[]> {
  const db = await getDatabase();
  const rows = since
    ? await db.getAllAsync<MeritEventRow>(
        'SELECT * FROM merit_events WHERE occurred_at >= ? ORDER BY occurred_at DESC',
        since,
      )
    : await db.getAllAsync<MeritEventRow>('SELECT * FROM merit_events ORDER BY occurred_at DESC');
  return rows.map(toMeritEvent);
}

export async function countMeritEvents(since?: string): Promise<number> {
  const db = await getDatabase();
  const row = since
    ? await db.getFirstAsync<{ n: number }>(
        'SELECT COUNT(*) AS n FROM merit_events WHERE occurred_at >= ?',
        since,
      )
    : await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM merit_events');
  return row?.n ?? 0;
}

/** Distinct sites with at least one observation. Used by the practice summary. */
export async function countSitesWitnessed(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(DISTINCT site_id) AS n FROM observations',
  );
  return row?.n ?? 0;
}

/** ISO instant of the earliest recognised act, or null if there is none. */
export async function firstMeritAt(): Promise<string | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ t: string | null }>(
    'SELECT MIN(occurred_at) AS t FROM merit_events',
  );
  return row?.t ?? null;
}

export async function countObservations(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM observations');
  return row?.n ?? 0;
}
