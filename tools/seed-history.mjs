#!/usr/bin/env node
/**
 * tools/seed-history.mjs
 *
 * Generates 30 days of realistic observation & condition-report history
 * and writes it to seed/history.json. The mock-api server can optionally
 * load this file to pre-populate the in-memory state so the dashboard
 * and coverage metrics look lived-in from first boot.
 *
 * Usage:
 *   node tools/seed-history.mjs [--days=30] [--out=seed/history.json]
 *
 * Output shape:
 *   { captures: [...], reports: [...], meritEvents: [...], acknowledgements: [...] }
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// --- Parse CLI args ---------------------------------------------------------
const args = Object.fromEntries(
  process.argv.slice(2)
    .filter((a) => a.startsWith('--'))
    .map((a) => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; })
);
const DAYS = Number(args.days ?? 30);
const OUT  = resolve(ROOT, args.out ?? 'seed/history.json');

// --- Load seed data ---------------------------------------------------------
const sites    = JSON.parse(readFileSync(join(ROOT, 'seed/sites.json'), 'utf8'));
const vantages = JSON.parse(readFileSync(join(ROOT, 'seed/vantages.json'), 'utf8'));
const needs    = JSON.parse(readFileSync(join(ROOT, 'seed/needs.json'), 'utf8'));

const activeVantages = vantages.filter((v) => v.active);

// --- Geohash (inlined, no deps) --------------------------------------------
const GEOHASH_B32 = '0123456789bcdefghjkmnpqrstuvwxyz';
function geohash(lat, lon, precision = 7) {
  let latMin = -90, latMax = 90, lonMin = -180, lonMax = 180;
  let hash = '', bit = 0, ch = 0, even = true;
  while (hash.length < precision) {
    if (even) {
      const mid = (lonMin + lonMax) / 2;
      if (lon >= mid) { ch = (ch << 1) | 1; lonMin = mid; } else { ch <<= 1; lonMax = mid; }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat >= mid) { ch = (ch << 1) | 1; latMin = mid; } else { ch <<= 1; latMax = mid; }
    }
    even = !even;
    if (++bit === 5) { hash += GEOHASH_B32[ch]; bit = 0; ch = 0; }
  }
  return hash;
}

// --- Helpers ----------------------------------------------------------------
const rng = (min, max) => min + Math.random() * (max - min);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const isoDay = (daysAgo) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(Math.floor(rng(6, 19)), Math.floor(rng(0, 59)), 0, 0);
  return d.toISOString();
};

const CATEGORIES = ['vegetation', 'water', 'structure', 'litter', 'erosion', 'encroachment'];
const SUBTYPES = {
  vegetation:    ['overgrowth', 'invasive_species', 'tree_damage'],
  water:         ['waterlogging', 'canal_obstruction', 'algae_bloom'],
  structure:     ['crack', 'spalling', 'paint_fade', 'vandalism'],
  litter:        ['plastic', 'organic', 'construction_debris'],
  erosion:       ['path_edge', 'bank', 'plinth'],
  encroachment:  ['informal_stall', 'vehicle', 'construction'],
};
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const SEVERITY_WEIGHTS = [0.45, 0.35, 0.15, 0.05]; // realistic distribution

function weightedSeverity() {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < SEVERITIES.length; i++) {
    cum += SEVERITY_WEIGHTS[i];
    if (r < cum) return SEVERITIES[i];
  }
  return 'low';
}

// Merit thresholds
const DAILY_CAP = 200;

// --- Build history ----------------------------------------------------------
const captures = [];
const reports  = [];
const meritEvents = [];
const acknowledgements = [];

// Simulate 3–8 visitors per day, each taking 2–6 captures
for (let daysAgo = DAYS; daysAgo >= 1; daysAgo--) {
  const visitors = Math.floor(rng(3, 9));

  for (let v = 0; v < visitors; v++) {
    const userId = `pilgrim-${String(v).padStart(3, '0')}-day${DAYS - daysAgo}`;
    const captureCount = Math.floor(rng(2, 7));
    let dayMerit = 0;

    // Pick a cluster of vantages nearby each other (a visitor walks around a site)
    const site = pick(sites);
    const siteVantages = activeVantages.filter((va) => va.site_id === site.id);
    if (!siteVantages.length) continue;

    for (let c = 0; c < captureCount; c++) {
      const vantage = pick(siteVantages);
      const capturedAt = isoDay(daysAgo);
      const alignScore = Number(rng(0.60, 0.98).toFixed(3));

      const capture = {
        id: randomUUID(),
        vantage_id: vantage.id,
        user_id: userId,
        image_url: `mock://captures/${randomUUID()}.jpg`,
        thumb_url: null,
        captured_at: capturedAt,
        lat: vantage.coords?.lat ?? site.coords.lat,
        lon: vantage.coords?.lon ?? site.coords.lon,
        gps_acc_m: Number(rng(2, 12).toFixed(1)),
        heading_deg: Number(rng(0, 360).toFixed(1)),
        align_score: alignScore,
        device: pick(['android', 'ios']),
        queued_offline: Math.random() < 0.12, // 12% submitted from offline queue
      };
      captures.push(capture);

      // Resurvey merit (25 pts, once per 24h per vantage per user — simplified)
      if (dayMerit < DAILY_CAP) {
        const awarded = Math.min(25, DAILY_CAP - dayMerit);
        dayMerit += awarded;
        meritEvents.push({
          id: randomUUID(),
          user_id: userId,
          kind: 'resurvey',
          ref_id: capture.id,
          amount: awarded,
          day: capturedAt.slice(0, 10),
          created_at: capturedAt,
        });
      }

      // 30% chance the visitor files a condition report after this capture
      if (Math.random() < 0.30) {
        const category = pick(CATEGORIES);
        const subtype  = pick(SUBTYPES[category]);
        const severity = weightedSeverity();
        const gh       = geohash(capture.lat, capture.lon);

        const report = {
          id: randomUUID(),
          capture_id: capture.id,
          site_id: site.id,
          category,
          subtype,
          severity,
          reporter_conf: Number(rng(0.5, 1.0).toFixed(2)),
          note: null,
          geohash7: gh,
          corroborations: Math.random() < 0.25 ? Math.floor(rng(1, 4)) : 0,
          status: 'open',
          custodian_note: null,
          acknowledged_at: null,
          created_at: capturedAt,
        };

        // Promote status with corroborations
        if (report.corroborations >= 2) report.status = 'corroborated';

        // 40% of corroborated reports get acknowledged (realistic custodian speed)
        if (report.status === 'corroborated' && Math.random() < 0.40) {
          const ackDelay = rng(2, 72); // 2–72 hours
          const ackDate  = new Date(new Date(capturedAt).getTime() + ackDelay * 3_600_000).toISOString();
          report.acknowledged_at = ackDate;
          report.status = Math.random() < 0.30 ? 'resolved' : 'acknowledged';

          acknowledgements.push({
            id: randomUUID(),
            report_id: report.id,
            custodian_id: 'lumbini-trust',
            note: `Acknowledged — ${report.severity} ${report.category} at ${site.id}`,
            status: report.status,
            acknowledged_at: ackDate,
          });
        }

        reports.push(report);

        // First-report merit
        if (dayMerit < DAILY_CAP) {
          const awarded = Math.min(25, DAILY_CAP - dayMerit);
          dayMerit += awarded;
          meritEvents.push({
            id: randomUUID(),
            user_id: userId,
            kind: 'first_report',
            ref_id: report.id,
            amount: awarded,
            day: capturedAt.slice(0, 10),
            created_at: capturedAt,
          });
        }
      }
    }
  }
}



// --- Summary ----------------------------------------------------------------
const history = { captures, reports, meritEvents, acknowledgements };

writeFileSync(OUT, JSON.stringify(history, null, 2), 'utf8');

const ack = acknowledgements.length;
const res = reports.filter((r) => r.status === 'resolved').length;
const corr = reports.filter((r) => ['corroborated', 'acknowledged', 'resolved'].includes(r.status)).length;

console.log(`\n✅  Seed history written to ${OUT}`);
console.log(`   Days: ${DAYS}`);
console.log(`   Captures: ${captures.length}`);
console.log(`   Reports: ${reports.length}  (corroborated: ${corr}, resolved: ${res})`);
console.log(`   Acknowledgements: ${ack}`);
console.log(`   Merit events: ${meritEvents.length}`);

const uniqueSitesCovered = new Set(captures.map((c) => {
  const v = vantages.find((va) => va.id === c.vantage_id);
  return v?.site_id;
}).filter(Boolean)).size;
console.log(`   Sites with coverage: ${uniqueSitesCovered} / ${sites.length}`);
