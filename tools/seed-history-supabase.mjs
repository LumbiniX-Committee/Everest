#!/usr/bin/env node
/**
 * Loads synthetic observation & condition-report history into a staging
 * Supabase project, reusing generateHistory() from tools/seed-history.mjs
 * rather than writing a second generator that could drift from the mock.
 *
 * Dry-run is the default, matching tools/sync-catalog.mjs. Pass --apply with
 * server-only credentials to write:
 *
 *   SUPABASE_URL=...
 *   SUPABASE_SERVICE_ROLE_KEY=...   (server-only; never EXPO_PUBLIC_SUPABASE_KEY)
 *   SUPABASE_ANON_KEY=...           (needed only to sign the seed custodian in)
 *
 * Run tools/sync-catalog.mjs --apply first: this script inserts observations
 * and condition_reports against site/vantage ids that must already exist in
 * monitored_sites/monitored_vantages, or the foreign-key checks in
 * supabase/migrations/0009_production_pilot.sql reject every row.
 *
 * Two things do not — and cannot — carry over faithfully from seed/history.json:
 *
 * 1. `corroborations` and `status: 'corroborated'` are mock-only (see
 *    docs/PRODUCTION-PILOT.md). A generated report at that status is seeded
 *    as 'open'; only 'acknowledged' and 'resolved' map to real actions.
 * 2. `condition_report_actions.created_at` is stamped by
 *    `validate_condition_report_action()` to the database's `now()` and
 *    cannot be backdated by any caller, including the service-role key —
 *    that is what makes the append-only audit trail trustworthy. So a
 *    seeded acknowledgement lands with today's timestamp, not the
 *    generator's simulated historical one. Response/resolution medians will
 *    therefore be real numbers rather than a dash, but not a realistic
 *    distribution; only genuine custodian activity over time produces that.
 *
 * Because of (2), `condition_report_actions` must be inserted through an
 * authenticated request, not the service-role key: the same trigger requires
 * auth.uid() to resolve to a real actor. This script provisions one seed
 * custodian account (email configurable via --custodian-email) with a
 * membership on every site being seeded, signs in as it, and inserts actions
 * through that session so the trigger and RLS policy both see a legitimate
 * authenticated custodian — exactly the path a real custodian's browser
 * would take.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

import { createClient } from '@supabase/supabase-js';

import { generateHistory } from './seed-history.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sites = JSON.parse(readFileSync(join(root, 'seed', 'sites.json'), 'utf8'));
const vantages = JSON.parse(readFileSync(join(root, 'seed', 'vantages.json'), 'utf8'));

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
);
const apply = args.apply === true;
const days = Number(args.days ?? 30);
const custodianEmail = args['custodian-email'] ?? 'seed-custodian@sakshi.internal';

const { captures, reports, acknowledgements } = generateHistory({ days, sites, vantages });

// Map the mock shapes onto the production schema (see supabase/migrations/
// 0001_observation_sync.sql and 0009_production_pilot.sql for the columns).
const observationRows = captures.map((capture) => ({
  id: capture.id,
  vantage_id: capture.vantage_id,
  site_id: capture.site_id,
  captured_at: capture.captured_at,
  // No real object exists in the `observations` storage bucket for seeded
  // rows; this key intentionally resolves to nothing so it cannot be
  // mistaken for real evidence.
  photo_path: `seed/${capture.id}.jpg`,
  latitude: capture.lat,
  longitude: capture.lon,
  position_error_m: capture.gps_acc_m,
  bearing: null,
  pitch: null,
  bearing_error_deg: null,
  note: null,
}));

const reportRows = reports.map((report) => ({
  id: report.id,
  observation_id: report.capture_id,
  site_id: report.site_id,
  category: report.category,
  subtype: report.subtype,
  severity: report.severity,
  note: report.note,
  recorded_at: report.created_at,
}));

// Legal transitions only: open -> acknowledged -> (in_progress ->) resolved.
// 'corroborated' has no production equivalent, so it is left as 'open' here.
const actionsByReport = new Map();
for (const ack of acknowledgements) {
  const steps = [{ target_status: 'acknowledged', note: ack.note }];
  if (ack.status === 'resolved') steps.push({ target_status: 'resolved', note: null });
  actionsByReport.set(ack.report_id, steps);
}

const seededSiteIds = [...new Set(reportRows.map((r) => r.site_id))];
const totalActions = [...actionsByReport.values()].reduce((sum, steps) => sum + steps.length, 0);

console.log('seed-history-supabase:');
console.log(`  observations: ${observationRows.length}`);
console.log(`  condition_reports: ${reportRows.length}`);
console.log(`  condition_report_actions: ${totalActions} (across ${actionsByReport.size} reports)`);
console.log(`  sites touched: ${seededSiteIds.length}`);

if (!apply) {
  console.log('\ndry run only; pass --apply with server-only Supabase credentials to write');
  process.exit(0);
}

const url = (process.env.SUPABASE_URL ?? '').trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
const anonKey = (process.env.SUPABASE_ANON_KEY ?? '').trim();
if (!url || !serviceRole || !anonKey) {
  console.error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY are required for --apply.');
  process.exit(1);
}
if (serviceRole === process.env.EXPO_PUBLIC_SUPABASE_KEY) {
  console.error('Refusing to use the public app key as a seed administration credential.');
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

const observationResult = await admin.from('observations').upsert(observationRows, { onConflict: 'id' });
if (observationResult.error) throw observationResult.error;

const reportResult = await admin.from('condition_reports').upsert(reportRows, { onConflict: 'id' });
if (reportResult.error) throw reportResult.error;

console.log(`\nobservations and condition_reports written (${observationRows.length} + ${reportRows.length} rows).`);

if (!actionsByReport.size) {
  console.log('no acknowledged/resolved reports generated; skipping condition_report_actions.');
  process.exit(0);
}

// condition_report_actions requires an authenticated actor: the
// validate_condition_report_action() trigger raises if auth.uid() is null,
// and the insert RLS policy checks actor_user_id = auth.uid() plus site
// membership. The service-role key satisfies neither, so a real custodian
// session is required — provision one, invite it to every seeded site, then
// sign in as it.
const seedPassword = randomUUID();
const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
if (listError) throw listError;
let seedUser = existingUsers.users.find((u) => u.email === custodianEmail);
if (!seedUser) {
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: custodianEmail,
    password: seedPassword,
    email_confirm: true,
  });
  if (createError) throw createError;
  seedUser = created.user;
} else {
  const { error: updateError } = await admin.auth.admin.updateUserById(seedUser.id, { password: seedPassword });
  if (updateError) throw updateError;
}

const membershipRows = seededSiteIds.map((siteId) => ({
  user_id: seedUser.id,
  site_id: siteId,
  role: 'custodian',
  active: true,
}));
const membershipResult = await admin.from('custodian_memberships').upsert(membershipRows, { onConflict: 'user_id,site_id' });
if (membershipResult.error) throw membershipResult.error;

const actor = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
const { error: signInError } = await actor.auth.signInWithPassword({ email: custodianEmail, password: seedPassword });
if (signInError) throw signInError;

let written = 0;
for (const [reportId, steps] of actionsByReport) {
  for (const step of steps) {
    const { error } = await actor.from('condition_report_actions').insert({
      report_id: reportId,
      target_status: step.target_status,
      note: step.note,
    });
    if (error) throw new Error(`action ${step.target_status} on report ${reportId}: ${error.message}`);
    written += 1;
  }
}

console.log(`condition_report_actions written (${written} rows) as ${custodianEmail}.`);
console.log('note: their created_at is the time this script ran, not the simulated historical time — see the file header.');
