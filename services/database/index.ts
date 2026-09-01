import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from '@/constants';
import type {
  ConditionReport,
  QuestReviewVerdict,
  QuestSubmission,
  MeritEvent,
  Observation,
  ObservationAssessment,
  Quest,
  QuestCategory,
  QuestDifficulty,
  QuestProgress,
  QuestStatus,
  QuestTask,
  QuestWithProgress,
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

  // Site visits, for the Chaityāvalī register.
  //
  // A visit is recorded only when the device was actually near the site, so
  // "visited" means stood there — not "tapped on". Without this table the
  // register could only distinguish witnessed from unwitnessed, and marking a
  // site visited because someone read about it on a bus would be a small lie
  // in a product whose whole claim is first-hand evidence.
  `CREATE TABLE IF NOT EXISTS site_visits (
     site_id TEXT PRIMARY KEY NOT NULL,
     first_visited_at TEXT NOT NULL,
     last_visited_at TEXT NOT NULL,
     visit_count INTEGER NOT NULL DEFAULT 1
   );`,

  // Quests & Quest Progress tables.
  `CREATE TABLE IF NOT EXISTS quests (
     id TEXT PRIMARY KEY NOT NULL,
     title TEXT NOT NULL,
     subtitle TEXT NOT NULL,
     description TEXT NOT NULL,
     category TEXT NOT NULL,
     intention TEXT NOT NULL,
     difficulty TEXT NOT NULL,
     estimated_minutes INTEGER NOT NULL,
     icon TEXT NOT NULL,
     tasks TEXT NOT NULL,
     created_at INTEGER NOT NULL
   );
   CREATE INDEX IF NOT EXISTS idx_quests_category
     ON quests (category);

   CREATE TABLE IF NOT EXISTS quest_progress (
     quest_id TEXT PRIMARY KEY NOT NULL,
     status TEXT NOT NULL,
     completed_tasks TEXT NOT NULL,
     started_at INTEGER,
     completed_at INTEGER,
     FOREIGN KEY (quest_id) REFERENCES quests (id) ON DELETE CASCADE
   );
   CREATE INDEX IF NOT EXISTS idx_quest_progress_status
     ON quest_progress (status);`,

  // Capture integrity. The weighted alignment score, GPS accuracy and gate mode
  // recorded at capture. gate_mode is the source of truth for honesty: 'aligned'
  // means the tolerance gate passed and the error columns are real measurements;
  // 'manual' means framed by eye, and the reader treats the errors as unknown
  // rather than as a claim of perfect accuracy. Nullable throughout so rows
  // written before this migration keep a truthful "not recorded" state.
  `ALTER TABLE observations ADD COLUMN align_score REAL;
   ALTER TABLE observations ADD COLUMN gps_acc_m REAL;
   ALTER TABLE observations ADD COLUMN gate_mode TEXT;`,

  // Weighted puṇya (05-CONTENT-SPEC §6). amount is the merit awarded after the
  // daily cap; day_key (local YYYY-MM-DD) is what the cap sums over. DEFAULT 0 is
  // truthful for rows written before weights existed — those acts predate the
  // model, and backfilling invented amounts would fabricate history. Charter #9
  // holds: no spend, no transfer, no stored balance — balance is SUM(amount).
  `ALTER TABLE merit_events ADD COLUMN amount INTEGER NOT NULL DEFAULT 0;
   ALTER TABLE merit_events ADD COLUMN day_key TEXT NOT NULL DEFAULT '';
   CREATE INDEX IF NOT EXISTS idx_merit_day ON merit_events (day_key);`,

  // Quest completions table for seed and spec quests (05-CONTENT-SPEC §5).
  `CREATE TABLE IF NOT EXISTS quest_completions (
     id TEXT PRIMARY KEY NOT NULL,
     quest_id TEXT NOT NULL,
     completed_at TEXT NOT NULL,
     evidence_id TEXT,
     answer TEXT,
     merit_awarded INTEGER NOT NULL DEFAULT 0,
     synced INTEGER NOT NULL DEFAULT 0
   );
   CREATE INDEX IF NOT EXISTS idx_quest_completions_quest ON quest_completions (quest_id);`,

  // Quest evidence. A tick records that someone said they did something; this
  // records what they actually brought back, which is the only thing a
  // conservation series can be built from.
  //
  // The AI review columns store an *opinion*: model and verdict live beside
  // each other so a later reader can see who said it and weigh it accordingly.
  // review_verdict is nullable throughout — a submission made offline is
  // complete without one, and backfilling would invent a judgement nobody made.
  `CREATE TABLE IF NOT EXISTS quest_submissions (
     quest_id TEXT NOT NULL,
     task_id TEXT NOT NULL,
     photo_uri TEXT,
     count INTEGER,
     note TEXT,
     submitted_at TEXT NOT NULL,
     review_verdict TEXT,
     review_comment TEXT,
     review_model TEXT,
     reviewed_at TEXT,
     PRIMARY KEY (quest_id, task_id)
   );
   CREATE INDEX IF NOT EXISTS idx_submissions_quest
     ON quest_submissions (quest_id);`,

  // Quest evidence leaves the device.
  //
  // Submissions were record-class data with no way off the phone — a photograph
  // of what someone actually saw, ending with a reinstall or a dropped handset.
  // DEFAULT 0 is right for existing rows: they were never sent, so the next
  // sync pass picks them up rather than treating them as already delivered.
  `ALTER TABLE quest_submissions ADD COLUMN synced INTEGER NOT NULL DEFAULT 0;
   CREATE INDEX IF NOT EXISTS idx_submissions_unsynced
     ON quest_submissions (synced) WHERE synced = 0;`,

  // Provenance for condition reports. ai_assisted marks a report that was
  // pre-filled from an on-device damage-detection candidate and then confirmed by
  // the observer. DEFAULT 0 is truthful for rows written before the detector
  // existed — they were made entirely by hand — and backfilling them as assisted
  // would credit a machine with findings a person made unaided.
  `ALTER TABLE condition_reports ADD COLUMN ai_assisted INTEGER NOT NULL DEFAULT 0;`,
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
  align_score: number | null;
  gps_acc_m: number | null;
  gate_mode: string | null;
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
    // A by-eye capture makes no claim of measured accuracy: report the errors as
    // unknown rather than as the zeroes stored to satisfy the NOT NULL columns.
    positionErrorM: row.gate_mode === 'manual' ? null : row.position_error_m,
    bearingErrorDeg: row.gate_mode === 'manual' ? null : row.bearing_error_deg,
    alignScore: row.align_score,
    gpsAccuracyM: row.gps_acc_m,
    gateMode: row.gate_mode === 'aligned' || row.gate_mode === 'manual' ? row.gate_mode : undefined,
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
        bearing, pitch, position_error_m, bearing_error_deg, note, assessment,
        align_score, gps_acc_m, gate_mode, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    observation.id,
    observation.vantageId,
    observation.siteId,
    observation.capturedAt,
    observation.photoUri,
    observation.coordinate.latitude,
    observation.coordinate.longitude,
    observation.bearing,
    // The error columns are NOT NULL; a missing measurement is stored as 0 but
    // recovered as null on read via gate_mode — never surfaced as real accuracy.
    observation.pitch,
    observation.positionErrorM ?? 0,
    observation.bearingErrorDeg ?? 0,
    observation.note ?? null,
    observation.assessment,
    observation.alignScore ?? null,
    observation.gpsAccuracyM ?? null,
    observation.gateMode ?? null,
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

export async function getUnsyncedObservations(): Promise<Observation[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ObservationRow>(
    'SELECT * FROM observations WHERE synced = 0 ORDER BY captured_at ASC'
  );
  return rows.map(toObservation);
}

export async function markObservationSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE observations SET synced = 1 WHERE id = ?', id);
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
  ai_assisted: number;
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
    aiAssisted: row.ai_assisted === 1,
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
         (id, observation_id, site_id, category, subtype, severity, note, recorded_at, ai_assisted, synced)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      report.id,
      report.observationId,
      report.siteId,
      report.category,
      report.subtype,
      report.severity,
      report.note ?? null,
      report.recordedAt,
      report.aiAssisted ? 1 : 0,
      report.synced ? 1 : 0,
    );
    await db.runAsync(
      "UPDATE observations SET assessment = 'reported' WHERE id = ?",
      report.observationId,
    );
  });
}

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

export async function getUnsyncedConditionReports(): Promise<ConditionReport[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<ConditionReportRow>(
    'SELECT * FROM condition_reports WHERE synced = 0 ORDER BY recorded_at ASC'
  );
  return rows.map(toConditionReport);
}

export async function markConditionReportSynced(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE condition_reports SET synced = 1 WHERE id = ?', id);
}

type MeritEventRow = {
  id: string;
  kind: string;
  amount: number;
  occurred_at: string;
  day_key: string;
  site_id: string | null;
  observation_id: string | null;
  acknowledgement: string;
};

function toMeritEvent(row: MeritEventRow): MeritEvent {
  return {
    id: row.id,
    kind: row.kind as MeritEvent['kind'],
    amount: row.amount,
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
export async function insertMeritEvent(event: MeritEvent, dayKey: string): Promise<boolean> {
  const db = await getDatabase();
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO merit_events
       (id, kind, amount, occurred_at, day_key, site_id, observation_id, acknowledgement)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    event.id,
    event.kind,
    event.amount,
    event.occurredAt,
    dayKey,
    event.siteId ?? null,
    event.observationId ?? null,
    event.acknowledgement,
  );
  return result.changes > 0;
}

/** Puṇya awarded on a given local day (YYYY-MM-DD). The cap sums over this. */
export async function sumMeritForDay(dayKey: string): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number | null }>(
    'SELECT SUM(amount) AS n FROM merit_events WHERE day_key = ?',
    dayKey,
  );
  return row?.n ?? 0;
}

/** Lifetime puṇya balance. Derived, never stored — Charter #9. */
export async function totalMerit(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number | null }>('SELECT SUM(amount) AS n FROM merit_events');
  return row?.n ?? 0;
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

export type SiteVisit = {
  siteId: string;
  firstVisitedAt: string;
  lastVisitedAt: string;
  visitCount: number;
};

/**
 * Notes that the observer was physically at a site.
 *
 * Upsert rather than a row per visit: the register only needs first, last and
 * how many. Keeping one row per site also means a phone left sitting at a
 * vantage cannot inflate the record into a log of hundreds of arrivals.
 */
export async function recordSiteVisit(siteId: string, at = new Date().toISOString()): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO site_visits (site_id, first_visited_at, last_visited_at, visit_count)
     VALUES (?, ?, ?, 1)
     ON CONFLICT (site_id) DO UPDATE SET
       last_visited_at = excluded.last_visited_at,
       visit_count = visit_count + 1`,
    siteId,
    at,
    at,
  );
}

export async function listSiteVisits(): Promise<SiteVisit[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    site_id: string;
    first_visited_at: string;
    last_visited_at: string;
    visit_count: number;
  }>('SELECT * FROM site_visits ORDER BY last_visited_at DESC');
  return rows.map((row) => ({
    siteId: row.site_id,
    firstVisitedAt: row.first_visited_at,
    lastVisitedAt: row.last_visited_at,
    visitCount: row.visit_count,
  }));
}

export async function countObservations(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM observations');
  return row?.n ?? 0;
}

type QuestRow = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  intention: string;
  category: string;
  difficulty: string;
  estimated_minutes: number;
  icon: string;
  tasks: string;
  created_at: number;
};

type QuestWithProgressRow = QuestRow & {
  progress_status: string | null;
  completed_tasks: string | null;
  started_at: number | null;
  completed_at: number | null;
};

function toQuestWithProgress(row: QuestWithProgressRow): QuestWithProgress {
  let parsedTasks: QuestTask[] = [];
  try {
    parsedTasks = JSON.parse(row.tasks);
  } catch {
    parsedTasks = [];
  }

  let parsedCompletedTasks: string[] = [];
  if (row.completed_tasks) {
    try {
      parsedCompletedTasks = JSON.parse(row.completed_tasks);
    } catch {
      parsedCompletedTasks = [];
    }
  }

  const quest: Quest = {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    description: row.description,
    intention: row.intention,
    category: row.category as QuestCategory,
    difficulty: row.difficulty as QuestDifficulty,
    estimatedMinutes: row.estimated_minutes,
    icon: row.icon,
    tasks: parsedTasks,
    createdAt: row.created_at,
  };

  const progress: QuestProgress = {
    questId: row.id,
    status: (row.progress_status as QuestStatus) ?? 'not_started',
    completedTasks: parsedCompletedTasks,
    startedAt: row.started_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
  };

  return { ...quest, progress };
}

export async function listQuests(): Promise<QuestWithProgress[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestWithProgressRow>(
    `SELECT q.*, qp.status as progress_status, qp.completed_tasks, qp.started_at, qp.completed_at
     FROM quests q
     LEFT JOIN quest_progress qp ON q.id = qp.quest_id
     ORDER BY q.created_at ASC`
  );
  return rows.map(toQuestWithProgress);
}

export async function getQuest(id: string): Promise<QuestWithProgress | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<QuestWithProgressRow>(
    `SELECT q.*, qp.status as progress_status, qp.completed_tasks, qp.started_at, qp.completed_at
     FROM quests q
     LEFT JOIN quest_progress qp ON q.id = qp.quest_id
     WHERE q.id = ?`,
    id
  );
  return row ? toQuestWithProgress(row) : null;
}

export async function startQuest(questId: string): Promise<QuestProgress> {
  const db = await getDatabase();
  const existing = await db.getFirstAsync<{
    quest_id: string;
    status: string;
    completed_tasks: string;
    started_at: number | null;
    completed_at: number | null;
  }>('SELECT * FROM quest_progress WHERE quest_id = ?', questId);

  const now = Date.now();
  if (!existing) {
    await db.runAsync(
      `INSERT INTO quest_progress (quest_id, status, completed_tasks, started_at)
       VALUES (?, 'in_progress', '[]', ?)`,
      questId,
      now
    );
    return {
      questId,
      status: 'in_progress',
      completedTasks: [],
      startedAt: now,
    };
  }

  if (existing.status === 'not_started') {
    const startedAt = existing.started_at ?? now;
    await db.runAsync(
      `UPDATE quest_progress SET status = 'in_progress', started_at = ? WHERE quest_id = ?`,
      startedAt,
      questId
    );
    let completedTasks: string[] = [];
    try {
      completedTasks = JSON.parse(existing.completed_tasks);
    } catch {}
    return {
      questId,
      status: 'in_progress',
      completedTasks,
      startedAt,
      completedAt: existing.completed_at ?? undefined,
    };
  }

  let completedTasks: string[] = [];
  try {
    completedTasks = JSON.parse(existing.completed_tasks);
  } catch {}
  return {
    questId,
    status: existing.status as QuestStatus,
    completedTasks,
    startedAt: existing.started_at ?? undefined,
    completedAt: existing.completed_at ?? undefined,
  };
}

export async function completeQuestTask(questId: string, taskId: string): Promise<QuestProgress> {
  const db = await getDatabase();
  const questWithProgress = await getQuest(questId);
  if (!questWithProgress) {
    throw new Error(`Quest with id ${questId} not found`);
  }

  const currentCompleted = new Set(questWithProgress.progress.completedTasks);
  currentCompleted.add(taskId);
  const updatedCompletedArray = Array.from(currentCompleted);

  const allTasksCount = questWithProgress.tasks.length;
  const isAllCompleted = allTasksCount > 0 && updatedCompletedArray.length >= allTasksCount;

  const newStatus: QuestStatus = isAllCompleted ? 'completed' : 'in_progress';
  const startedAt = questWithProgress.progress.startedAt ?? Date.now();
  const completedAt = isAllCompleted ? (questWithProgress.progress.completedAt ?? Date.now()) : undefined;

  await db.runAsync(
    `INSERT INTO quest_progress (quest_id, status, completed_tasks, started_at, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(quest_id) DO UPDATE SET
       status = excluded.status,
       completed_tasks = excluded.completed_tasks,
       started_at = excluded.started_at,
       completed_at = excluded.completed_at`,
    questId,
    newStatus,
    JSON.stringify(updatedCompletedArray),
    startedAt,
    completedAt ?? null
  );

  return {
    questId,
    status: newStatus,
    completedTasks: updatedCompletedArray,
    startedAt,
    completedAt,
  };
}

/**
 * Un-tick a task.
 *
 * The completion interaction is a tick, and a tick with no way back is a trap:
 * one mis-tap marks an objective done and the only remedy shipped was resetting
 * the whole quest. Undo is the other half of a checkbox.
 *
 * A quest that had been finished drops back to `in_progress` and loses its
 * `completedAt`. What it does *not* do is take back the puṇya that completion
 * recognised — the ledger is append-only by design, and un-recording an act of
 * attention because someone corrected a checkbox is exactly the kind of edit it
 * exists to refuse. The quest can be finished again; the merit is not paid
 * twice, because `recognise` already declines a repeat.
 */
export async function uncompleteQuestTask(questId: string, taskId: string): Promise<QuestProgress> {
  const db = await getDatabase();
  const questWithProgress = await getQuest(questId);
  if (!questWithProgress) {
    throw new Error(`Quest with id ${questId} not found`);
  }

  const remaining = questWithProgress.progress.completedTasks.filter((id) => id !== taskId);
  const startedAt = questWithProgress.progress.startedAt ?? Date.now();
  const status: QuestStatus = remaining.length === 0 ? 'not_started' : 'in_progress';

  await db.runAsync(
    `INSERT INTO quest_progress (quest_id, status, completed_tasks, started_at, completed_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(quest_id) DO UPDATE SET
       status = excluded.status,
       completed_tasks = excluded.completed_tasks,
       started_at = excluded.started_at,
       completed_at = excluded.completed_at`,
    questId,
    status,
    JSON.stringify(remaining),
    startedAt,
    null,
  );

  return { questId, status, completedTasks: remaining, startedAt };
}

export async function resetQuestProgress(questId?: string): Promise<void> {
  const db = await getDatabase();
  if (questId) {
    await db.runAsync('DELETE FROM quest_progress WHERE quest_id = ?', questId);
  } else {
    await db.runAsync('DELETE FROM quest_progress');
  }
}

export async function seedDefaultQuests(quests: Quest[]): Promise<void> {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    for (const quest of quests) {
      await db.runAsync(
        `INSERT OR IGNORE INTO quests
           (id, title, subtitle, description, intention, category, difficulty, estimated_minutes, icon, tasks, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        quest.id,
        quest.title,
        quest.subtitle,
        quest.description,
        quest.intention,
        quest.category,
        quest.difficulty,
        quest.estimatedMinutes,
        quest.icon,
        JSON.stringify(quest.tasks),
        quest.createdAt
      );

      // UPDATE after INSERT OR IGNORE is intentionally more conservative than
      // `ON CONFLICT DO UPDATE`. Some Expo Go/device SQLite builds reject the
      // newer upsert grammar even though desktop SQLite accepts it. This pair
      // works on every supported SQLite version and, unlike OR REPLACE, never
      // deletes the quest row, so its quest_progress foreign-key row survives.
      await db.runAsync(
        `UPDATE quests SET
           title = ?,
           subtitle = ?,
           description = ?,
           intention = ?,
           category = ?,
           difficulty = ?,
           estimated_minutes = ?,
           icon = ?,
           tasks = ?,
           created_at = ?
         WHERE id = ?`,
        quest.title,
        quest.subtitle,
        quest.description,
        quest.intention,
        quest.category,
        quest.difficulty,
        quest.estimatedMinutes,
        quest.icon,
        JSON.stringify(quest.tasks),
        quest.createdAt,
        quest.id,
      );

      await db.runAsync(
        `INSERT OR IGNORE INTO quest_progress (quest_id, status, completed_tasks)
         VALUES (?, 'not_started', '[]')`,
        quest.id
      );
    }
  });
}

export type QuestCompletionRecord = {
  id: string;
  questId: string;
  completedAt: string;
  evidenceId?: string;
  answer?: string;
  meritAwarded: number;
};

export async function recordQuestCompletion(record: QuestCompletionRecord): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO quest_completions
       (id, quest_id, completed_at, evidence_id, answer, merit_awarded)
     VALUES (?, ?, ?, ?, ?, ?)`,
    record.id,
    record.questId,
    record.completedAt,
    record.evidenceId ?? null,
    record.answer ?? null,
    record.meritAwarded,
  );
}

export async function listQuestCompletions(): Promise<QuestCompletionRecord[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{
    id: string;
    quest_id: string;
    completed_at: string;
    evidence_id: string | null;
    answer: string | null;
    merit_awarded: number;
  }>('SELECT * FROM quest_completions ORDER BY completed_at DESC');

  return rows.map((row) => ({
    id: row.id,
    questId: row.quest_id,
    completedAt: row.completed_at,
    evidenceId: row.evidence_id ?? undefined,
    answer: row.answer ?? undefined,
    meritAwarded: row.merit_awarded,
  }));
}

export async function getCompletedQuestIds(): Promise<Set<string>> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ quest_id: string }>('SELECT DISTINCT quest_id FROM quest_completions');
  return new Set(rows.map((r) => r.quest_id));
}




type QuestSubmissionRow = {
  quest_id: string;
  task_id: string;
  photo_uri: string | null;
  count: number | null;
  note: string | null;
  submitted_at: string;
  review_verdict: string | null;
  review_comment: string | null;
  review_model: string | null;
  reviewed_at: string | null;
  synced: number;
};

function toQuestSubmission(row: QuestSubmissionRow): QuestSubmission {
  return {
    questId: row.quest_id,
    taskId: row.task_id,
    photoUri: row.photo_uri ?? undefined,
    count: row.count ?? undefined,
    note: row.note ?? undefined,
    submittedAt: row.submitted_at,
    review: row.review_verdict
      ? {
          verdict: row.review_verdict as QuestReviewVerdict,
          comment: row.review_comment ?? '',
          model: row.review_model ?? undefined,
          reviewedAt: row.reviewed_at ?? row.submitted_at,
        }
      : undefined,
  };
}

/**
 * Records what someone brought back for a task.
 *
 * REPLACE rather than IGNORE: re-photographing a task is a correction, and the
 * later answer is the one they mean. The primary key makes that a single row
 * per task rather than a history — a quest is a prompt to look, not a ledger.
 *
 * `synced` is absent from the column list on purpose, so REPLACE returns it to
 * its default of 0. A corrected submission has not been sent in its corrected
 * form, and carrying the old flag across would leave the server holding the
 * answer the person replaced.
 */
export async function saveQuestSubmission(submission: QuestSubmission): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO quest_submissions
       (quest_id, task_id, photo_uri, count, note, submitted_at,
        review_verdict, review_comment, review_model, reviewed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    submission.questId,
    submission.taskId,
    submission.photoUri ?? null,
    submission.count ?? null,
    submission.note ?? null,
    submission.submittedAt,
    submission.review?.verdict ?? null,
    submission.review?.comment ?? null,
    submission.review?.model ?? null,
    submission.review?.reviewedAt ?? null,
  );
}

export async function listQuestSubmissions(questId: string): Promise<QuestSubmission[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestSubmissionRow>(
    'SELECT * FROM quest_submissions WHERE quest_id = ?',
    questId,
  );
  return rows.map(toQuestSubmission);
}

/** Every photographed quest submission, newest first, for the Memories album. */
export async function listAllQuestSubmissions(): Promise<QuestSubmission[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestSubmissionRow>(
    'SELECT * FROM quest_submissions WHERE photo_uri IS NOT NULL ORDER BY submitted_at DESC',
  );
  return rows.map(toQuestSubmission);
}

export async function getUnsyncedQuestSubmissions(): Promise<QuestSubmission[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QuestSubmissionRow>(
    'SELECT * FROM quest_submissions WHERE synced = 0 ORDER BY submitted_at ASC',
  );
  return rows.map(toQuestSubmission);
}

export async function markQuestSubmissionSynced(
  questId: string,
  taskId: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE quest_submissions SET synced = 1 WHERE quest_id = ? AND task_id = ?',
    questId,
    taskId,
  );
}
