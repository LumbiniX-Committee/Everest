import { getDeviceId } from '../device';
import { getSupabase, isConfigured } from '../supabase';

/**
 * The global leaderboard.
 *
 * Points are computed on the server from records that already sync —
 * observations, condition reports, quest submissions — never sent from here.
 * That is deliberate: a client-reported score is a number the client chose, and
 * no policy can stop someone claiming fifty thousand of them in their own row.
 * Deriving them from uploaded evidence means inflating a score requires doing
 * the work. See supabase/migrations/0008_leaderboard.sql.
 *
 * It is also why this module has no `submitScore`. There is nothing to submit.
 *
 * **Puṇya is not this.** Merit stays on the device, unranked and unsynced, with
 * no score column and no total — as Charter #9 describes it. This board counts
 * contributions and is openly competitive; the two are separate on purpose, and
 * conflating them in the UI would undo the distinction the schema preserves.
 */

export type LeaderboardEntry = {
  deviceId: string;
  handle: string;
  points: number;
  /** Points earned in the last seven days. */
  pointsWeek: number;
  /** Days on which anything was contributed. Counts returning, not bursts. */
  activeDays: number;
  lastActive: string | null;
  /** True for the row belonging to this device. */
  isYou: boolean;
};

export type LeaderboardRange = 'week' | 'all';

type Row = {
  device_id: string;
  handle: string;
  points: number;
  points_7d: number;
  active_days: number;
  last_active: string | null;
};

/**
 * Reads the board.
 *
 * Returns an empty list rather than throwing when Supabase is unconfigured —
 * the app works offline and a missing board is not an error state worth a
 * screenful of apology.
 */
export async function fetchLeaderboard(
  range: LeaderboardRange = 'all',
  limit = 50,
): Promise<LeaderboardEntry[]> {
  if (!isConfigured()) return [];

  const supabase = getSupabase();
  const orderBy = range === 'week' ? 'points_7d' : 'points';

  const { data, error } = await supabase
    .from('leaderboard')
    .select('device_id,handle,points,points_7d,active_days,last_active')
    .order(orderBy, { ascending: false })
    .limit(limit);

  if (error) throw error;

  const deviceId = await getDeviceId();

  return (data as Row[] ?? []).map((row) => ({
    deviceId: row.device_id,
    handle: row.handle,
    points: row.points,
    pointsWeek: row.points_7d,
    activeDays: row.active_days,
    lastActive: row.last_active,
    isYou: row.device_id === deviceId,
  }));
}

/**
 * Sets the name shown beside this device's score.
 *
 * Chosen, never derived. A handle generated from the device id would be a
 * display name that is secretly an identifier, which is worse than having none.
 *
 * Trimmed and length-checked here as well as by the column constraint, so a bad
 * value fails as a message rather than a database error.
 */
export async function setHandle(handle: string): Promise<void> {
  const trimmed = handle.trim();
  if (trimmed.length === 0) throw new Error('A name cannot be blank.');
  if (trimmed.length > 32) throw new Error('A name can be at most 32 characters.');
  if (!isConfigured()) throw new Error('Not connected: this name will not be saved.');

  const deviceId = await getDeviceId();
  const supabase = getSupabase();

  const { error } = await supabase
    .from('profiles')
    .upsert({ device_id: deviceId, handle: trimmed, updated_at: new Date().toISOString() },
            { onConflict: 'device_id' });

  if (error) throw error;
}

/** The current handle, or null if this device has not chosen one. */
export async function getHandle(): Promise<string | null> {
  if (!isConfigured()) return null;

  const deviceId = await getDeviceId();
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('handle')
    .eq('device_id', deviceId)
    .maybeSingle();

  if (error) return null;
  return (data as { handle: string } | null)?.handle ?? null;
}
