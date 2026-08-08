import * as SQLite from 'expo-sqlite';

import { DATABASE_NAME } from '@/constants';
import type { Observation } from '@/types';

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
    synced: row.synced === 1,
  };
}

export async function insertObservation(observation: Observation): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO observations
       (id, vantage_id, site_id, captured_at, photo_uri, latitude, longitude,
        bearing, pitch, position_error_m, bearing_error_deg, note, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
    observation.synced ? 1 : 0,
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

export async function countObservations(): Promise<number> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM observations');
  return row?.n ?? 0;
}
