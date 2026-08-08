/**
 * mock-api/server.mjs — a zero-dependency stand-in for the FastAPI backend.
 *
 * Node 22 ships everything this needs; there is no package.json and no
 * `npm install`, so it starts on venue wifi with nothing to break. It reads
 * seed/*.json at boot and serves the 04-ARCHITECTURE §3 contract verbatim, so
 * lanes A and B can build the whole offline-queue path before lane C's real
 * API exists. C deletes this the moment `c-phase1-schema` lands.
 *
 * Run:   node mock-api/server.mjs
 * Env:   PORT (default 8000). Binds 0.0.0.0 so a phone on the LAN can reach it.
 *
 * Every endpoint honours two debug query params so lane A can exercise its
 * loading and error states on purpose:
 *   ?delay=1500   → respond after 1500 ms
 *   ?fail=503     → respond with that HTTP status and an ApiError body
 */

import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { randomUUID } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED = join(__dirname, '..', 'seed');
const PORT = Number(process.env.PORT) || 8000;

// --- Dhamma Engine (lazy-loaded from core — TypeScript but Node strips types) -
let _dhammaReady = false;
let _askDhamma, _processReflection;
async function loadDhamma() {
  if (_dhammaReady) return;
  try {
    const mod = await import('../core/dhamma/index.ts');
    _askDhamma = mod.askDhamma;
    _processReflection = mod.processReflection;
    _dhammaReady = true;
    console.log('[dhamma] engine loaded ✓');
  } catch (e) {
    console.warn('[dhamma] engine unavailable — falling back to stub:', e.message);
  }
}
// Kick off background load
loadDhamma().catch(() => {});

// --- seed (read once at boot) ----------------------------------------------
const readSeed = (f) => JSON.parse(readFileSync(join(SEED, f), 'utf8'));
const sites = readSeed('sites.json');
const vantages = readSeed('vantages.json');
const quests = readSeed('quests.json');
const needs = readSeed('needs.json');
const timeline = readSeed('timeline.json');
let plates = [];
try { plates = readSeed('plates.json'); } catch { /* not produced until Block 6 */ }

const siteById = new Map(sites.map((s) => [s.id, s]));
const vantageById = new Map(vantages.map((v) => [v.id, v]));
const timelineById = new Map(timeline.map((t) => [t.id, t]));

// --- in-memory mutable state (resets on restart — that is the point) --------
const DAILY_CAP = 200; // mirrors shared/merit.ts; the mock is throwaway.
const MERIT_QUEST_FALLBACK = 30;
const state = {
  captures: [],
  reports: [],
  meritEvents: [],
  allocations: [],
  questCompletions: [],
  acknowledgements: [],
  dhammaLog: [],        // audit trail: question, refusal, citations, tier
};

// --- geo (inlined; the mock cannot import the TS shared/geo.ts directly) -----
const toRad = (d) => (d * Math.PI) / 180;
function haversine(aLat, aLon, bLat, bLon) {
  const R = 6371008.8;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}
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

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();

// --- merit helpers ----------------------------------------------------------
function meritSummary() {
  const balance = state.meritEvents.reduce((n, e) => n + e.amount, 0);
  const day = today();
  const todayTotal = state.meritEvents
    .filter((e) => e.day === day)
    .reduce((n, e) => n + e.amount, 0);
  const remaining = Math.max(0, DAILY_CAP - todayTotal);
  return {
    balance,
    today: todayTotal,
    cap: DAILY_CAP,
    remaining,
    complete: todayTotal >= DAILY_CAP,
    events: state.meritEvents,
  };
}

/** Award merit, respecting the daily cap. Returns the amount actually awarded. */
function award(kind, refId, requested) {
  const s = meritSummary();
  const granted = Math.min(requested, s.remaining);
  if (granted > 0) {
    state.meritEvents.push({
      id: randomUUID(),
      user_id: 'demo-user',
      kind,
      ref_id: refId,
      amount: granted,
      day: today(),
      created_at: now(),
    });
  }
  return granted;
}

// --- routing ----------------------------------------------------------------
const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
};
const err = (res, status, detail) =>
  json(res, status, { error: `http_${status}`, detail });

function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

const routes = [];
const on = (method, pattern, handler) => {
  // pattern like '/sites/:id' → regex with named groups
  const rx = new RegExp(
    '^' + pattern.replace(/:[a-zA-Z]+/g, (m) => `(?<${m.slice(1)}>[^/]+)`) + '$',
  );
  routes.push({ method, rx, handler });
};

// GET /health -- doubles as the deploy hello-world
on('GET', '/health', (_req, res) => json(res, 200, { ok: true, service: 'saksi-mock', sites: sites.length }));

// GET /sites
on('GET', '/sites', (_req, res) => json(res, 200, sites));

// GET /sites/:id
on('GET', '/sites/:id', (_req, res, p) => {
  const site = siteById.get(p.id);
  if (!site) return err(res, 404, `no site '${p.id}'`);
  json(res, 200, {
    site,
    vantages: vantages.filter((v) => v.site_id === site.id),
    plates: plates.filter((pl) => pl.site_id === site.id),
    timeline: (site.timeline || []).map((id) => timelineById.get(id)).filter(Boolean),
  });
});

// GET /vantages/next?lat&lon → nearest active, unsurveyed vantage
on('GET', '/vantages/next', (_req, res, _p, q) => {
  const lat = Number(q.lat), lon = Number(q.lon);
  const surveyed = new Set(state.captures.map((c) => c.vantage_id));
  const candidates = vantages
    .filter((v) => v.active && !surveyed.has(v.id))
    .map((v) => ({ v, d: haversine(lat, lon, v.coords.lat, v.coords.lon) }))
    .sort((a, b) => a.d - b.d);
  if (!candidates.length) return json(res, 200, null);
  const { v, d } = candidates[0];
  json(res, 200, { ...v, distance_m: Math.round(d) });
});

// GET /vantages/:id/series → captures ordered by time
on('GET', '/vantages/:id/series', (_req, res, p) => {
  const series = state.captures
    .filter((c) => c.vantage_id === p.id)
    .sort((a, b) => a.captured_at.localeCompare(b.captured_at));
  json(res, 200, series);
});

// POST /captures → {id, align_score, series_url}
on('POST', '/captures', (_req, res, _p, _q, body) => {
  if (!vantageById.has(body.vantage_id)) return err(res, 400, `unknown vantage '${body.vantage_id}'`);
  const capture = {
    id: body.client_id || randomUUID(),
    vantage_id: body.vantage_id,
    user_id: 'demo-user',
    image_url: `mock://captures/${body.client_id || 'x'}.jpg`,
    thumb_url: null,
    captured_at: body.captured_at || now(),
    lat: body.lat, lon: body.lon, gps_acc_m: body.gps_acc_m ?? 5,
    heading_deg: body.heading_deg,
    align_score: body.align_score ?? 0.85,
    device: 'mock',
    queued_offline: false,
  };
  state.captures.push(capture);
  json(res, 201, {
    id: capture.id,
    align_score: capture.align_score,
    series_url: `/vantages/${capture.vantage_id}/series`,
  });
});

// POST /reports → {id, status, cluster_id}
on('POST', '/reports', (_req, res, _p, _q, body) => {
  const site = siteById.get(body.site_id);
  if (!site) return err(res, 400, `unknown site '${body.site_id}'`);
  const gh = geohash(site.coords.lat, site.coords.lon, 7);
  const report = {
    id: body.client_id || randomUUID(),
    capture_id: body.capture_id ?? null,
    site_id: body.site_id,
    category: body.category,
    subtype: body.subtype ?? null,
    severity: body.severity,
    reporter_conf: body.reporter_conf,
    note: body.note ?? null,
    geohash7: gh,
    corroborations: 0,
    status: 'open',
    custodian_note: null,
    acknowledged_at: null,
    created_at: now(),
  };
  state.reports.push(report);
  // First report earns merit — NOT scaled by severity (05 §6 rule 5).
  award('first_report', report.id, 25);
  json(res, 201, { id: report.id, status: report.status, cluster_id: `${body.site_id}:${gh}` });
});

// GET /reports?site_id&status
on('GET', '/reports', (_req, res, _p, q) => {
  let out = state.reports;
  if (q.site_id) out = out.filter((r) => r.site_id === q.site_id);
  if (q.status) out = out.filter((r) => r.status === q.status);
  json(res, 200, out);
});

// POST /reports/:id/corroborate → {corroborations, status}
on('POST', '/reports/:id/corroborate', (_req, res, p) => {
  const report = state.reports.find((r) => r.id === p.id);
  if (!report) return err(res, 404, `no report '${p.id}'`);
  report.corroborations += 1;
  if (report.status === 'open' && report.corroborations >= 2) report.status = 'corroborated';
  award('corroboration', report.id, 25);
  json(res, 200, { corroborations: report.corroborations, status: report.status });
});

// GET /merit/me
on('GET', '/merit/me', (_req, res) => json(res, 200, meritSummary()));

// GET /needs
on('GET', '/needs', (_req, res) => json(res, 200, needs));

// POST /allocations → merit → need (no funds move)
on('POST', '/allocations', (_req, res, _p, _q, body) => {
  const need = needs.find((n) => n.id === body.need_id);
  if (!need) return err(res, 400, `unknown need '${body.need_id}'`);
  const alloc = {
    id: body.client_id || randomUUID(),
    user_id: 'demo-user',
    need_id: body.need_id,
    merit_spent: body.merit_spent,
    created_at: now(),
  };
  state.allocations.push(alloc);
  need.allocated_merit += body.merit_spent;
  json(res, 201, alloc);
});

// GET /quests?lat&lon → quests with availability + distance
on('GET', '/quests', (_req, res, _p, q) => {
  const lat = q.lat != null ? Number(q.lat) : null;
  const lon = q.lon != null ? Number(q.lon) : null;
  const done = new Set(state.questCompletions.map((c) => c.quest_id));
  const out = quests.map((quest) => {
    const site = quest.site_id ? siteById.get(quest.site_id) : null;
    let distance_m = null;
    let availability = 'available';
    if (site && lat != null && lon != null) {
      distance_m = Math.round(haversine(lat, lon, site.coords.lat, site.coords.lon));
      if (distance_m > (site.geofence_m ?? 40) * 4) availability = 'too_far';
    }
    if (done.has(quest.id)) availability = 'completed';
    return { quest, availability, distance_m, completed_at: null };
  });
  json(res, 200, out);
});

// POST /quests/:id/complete → {merit_awarded, evidence_id, merit_capped}
on('POST', '/quests/:id/complete', (_req, res, p, _q, body) => {
  const quest = quests.find((qq) => qq.id === p.id);
  if (!quest) return err(res, 404, `no quest '${p.id}'`);
  // Observation riddles: check the answer, hint on a miss (never a failure).
  if (quest.riddle) {
    const norm = (s) => String(s || '').trim().toLowerCase();
    const answer = norm(body.answer);
    const ok = quest.riddle.accept.some((a) => norm(a) === answer);
    if (!ok) return json(res, 200, { merit_awarded: 0, evidence_id: null, merit_capped: false, correct: false, hint: quest.riddle.hint });
  }
  const evidence_id = body.evidence_id ?? randomUUID();
  const kind = quest.family === 'path' ? 'path_quest'
    : quest.family === 'attention' || quest.family === 'observation' ? 'attention_quest'
    : 'resurvey';
  const before = meritSummary().remaining;
  const awarded = award(kind, quest.id, quest.merit ?? MERIT_QUEST_FALLBACK);
  state.questCompletions.push({
    id: randomUUID(), user_id: 'demo-user', quest_id: quest.id,
    completed_at: now(), evidence_id, merit_awarded: awarded,
  });
  json(res, 200, { merit_awarded: awarded, evidence_id, merit_capped: before === 0 });
});

// POST /dhamma/ask → real engine if loaded, passage-only stub otherwise
on('POST', '/dhamma/ask', async (_req, res, _p, _q, body) => {
  const question = String(body.question || '').trim();
  if (!question) return err(res, 400, 'question is required');

  if (_askDhamma) {
    try {
      const result = _askDhamma(question, body.site_id || null);
      // audit trail
      state.dhammaLog.push({
        id: randomUUID(), ts: now(), question,
        refused: result.refused, tier: result.tier,
        citation_count: result.citations?.length ?? 0,
      });
      return json(res, 200, result);
    } catch (e) {
      console.error('[dhamma] engine error:', e);
    }
  }

  // Stub fallback: surfaces passages but makes no claim
  json(res, 200, {
    answer: null,
    refused: false,
    citations: [{ segment_id: 'dn16:5.8.2', sutta_uid: 'dn16', display: 'DN 16:5.8' }],
    passages: [{
      segment_id: 'dn16:5.8.2',
      pali: 'Idha tathāgato jāto…',
      english: 'Here the Tathāgata was born — this is a place a devout person should visit.',
      translator: 'Sujato',
      collection: 'Dīgha Nikāya',
      licence: 'CC0-1.0',
    }],
    tier: 'passages_only',
    _note: `engine unavailable — stub response for: ${JSON.stringify(question)}`,
  });
});

// POST /dhamma/reflect → Socratic four-truths reflection companion
on('POST', '/dhamma/reflect', async (_req, res, _p, _q, body) => {
  if (_processReflection) {
    try {
      const result = _processReflection({
        site_id: body.site_id,
        stage: body.stage ?? 1,
        user_input: body.user_input,
        language: body.language ?? 'en',
      });
      return json(res, 200, result);
    } catch (e) {
      console.error('[dhamma/reflect] error:', e);
    }
  }
  // Stub fallback
  json(res, 200, {
    inquiry: 'What are you carrying today that feels heavy?',
    stage: body.stage ?? 1,
    completed: false,
    distress_override: false,
    disclaimer: 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.',
    _note: 'engine unavailable — stub response',
  });
});

// POST /custodian/acknowledgements → custodian acknowledges a report
on('POST', '/custodian/acknowledgements', (_req, res, _p, _q, body) => {
  const report = state.reports.find((r) => r.id === body.report_id);
  if (!report) return err(res, 404, `no report '${body.report_id}'`);
  report.acknowledged_at = now();
  report.custodian_note = body.note ?? null;
  report.status = body.status ?? 'acknowledged';
  const ack = {
    id: randomUUID(),
    report_id: body.report_id,
    custodian_id: body.custodian_id || 'lumbini-trust',
    note: report.custodian_note,
    status: report.status,
    acknowledged_at: report.acknowledged_at,
  };
  state.acknowledgements.push(ack);
  json(res, 201, ack);
});

// GET /dhamma/log → audit trail of questions asked (last 50)
on('GET', '/dhamma/log', (_req, res) => {
  json(res, 200, state.dhammaLog.slice(-50).reverse());
});

// GET /dashboard  (also aliased as /dashboard/summary)
function dashboardData() {
  const activeVantages = vantages.filter((v) => v.active);
  const surveyed = new Set(state.captures.map((c) => c.vantage_id));
  const surveyedCount = activeVantages.filter((v) => surveyed.has(v.id)).length;
  const scores = state.captures.map((c) => c.align_score).sort((a, b) => a - b);
  const median = scores.length ? scores[Math.floor(scores.length / 2)] : 0;
  const byStatus = { open: 0, corroborated: 0, acknowledged: 0, in_progress: 0, resolved: 0 };
  for (const r of state.reports) byStatus[r.status] = (byStatus[r.status] || 0) + 1;

  // Median acknowledgement hours (open → acknowledged)
  const ackHours = state.acknowledgements
    .map((a) => {
      const rep = state.reports.find((r) => r.id === a.report_id);
      if (!rep) return null;
      return (new Date(a.acknowledged_at) - new Date(rep.created_at)) / 3_600_000;
    })
    .filter(Boolean)
    .sort((a, b) => a - b);
  const medianAckHours = ackHours.length ? Number(ackHours[Math.floor(ackHours.length / 2)].toFixed(1)) : null;

  // Per-site capture heatmap
  const heatmap = {};
  for (const c of state.captures) {
    const v = vantageById.get(c.vantage_id);
    if (!v) continue;
    heatmap[v.site_id] = (heatmap[v.site_id] || 0) + 1;
  }

  // Dhamma stats
  const dhammaTotal = state.dhammaLog.length;
  const dhammaRefused = state.dhammaLog.filter((l) => l.refused).length;

  return {
    coverage_pct: activeVantages.length ? Math.round((surveyedCount / activeVantages.length) * 100) : 0,
    vantages_total: activeVantages.length,
    vantages_surveyed: surveyedCount,
    captures_total: state.captures.length,
    median_align_score: Number(median.toFixed(2)),
    reports_by_status: byStatus,
    median_ack_hours: medianAckHours,
    capture_heatmap: heatmap,
    dhamma_questions_total: dhammaTotal,
    dhamma_refusal_rate: dhammaTotal > 0 ? Number((dhammaRefused / dhammaTotal).toFixed(3)) : null,
    merit_balance: meritSummary().balance,
    active_pilgrims: 1, // demo single user
    generated_at: now(),
  };
}
on('GET', '/dashboard', (_req, res) => json(res, 200, dashboardData()));
on('GET', '/dashboard/summary', (_req, res) => json(res, 200, dashboardData()));

// GET /export?format=csv|geojson|crm
on('GET', '/export', (_req, res, _p, q) => {
  const format = q.format || 'csv';
  if (format === 'geojson') {
    return json(res, 200, {
      type: 'FeatureCollection',
      features: state.reports.map((r) => {
        const s = siteById.get(r.site_id);
        return {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [s?.coords.lon ?? 0, s?.coords.lat ?? 0] },
          properties: { id: r.id, site_id: r.site_id, category: r.category, severity: r.severity, status: r.status },
        };
      }),
    });
  }
  if (format === 'crm') {
    // CIDOC-CRM shape (04 §2): reports → E14 Condition Assessment / E3 Condition State
    return json(res, 200, state.reports.map((r) => ({
      '@type': 'E14_Condition_Assessment',
      identified_by: r.id,
      concerns: { '@type': 'E27_Site', id: r.site_id },
      has_created: { '@type': 'E3_Condition_State', category: r.category, subtype: r.subtype, severity: r.severity },
      timespan: r.created_at,
    })));
  }
  // csv
  const rows = ['id,site_id,category,subtype,severity,status,created_at'];
  for (const r of state.reports) rows.push([r.id, r.site_id, r.category, r.subtype, r.severity, r.status, r.created_at].join(','));
  const csv = rows.join('\n');
  res.writeHead(200, {
    'Content-Type': 'text/csv; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Content-Disposition': 'attachment; filename="saksi-export.csv"',
  });
  res.end(csv);
});

// --- server -----------------------------------------------------------------
const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const q = Object.fromEntries(url.searchParams);
  const method = req.method || 'GET';

  console.log(`${new Date().toISOString()} ${method} ${url.pathname}`);

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    return res.end();
  }

  // Debug hooks: ?delay= and ?fail=
  if (q.delay) await new Promise((r) => setTimeout(r, Math.min(10000, Number(q.delay) || 0)));
  if (q.fail) return err(res, Number(q.fail) || 500, 'forced failure via ?fail=');

  const route = routes.find((r) => r.method === method && r.rx.test(url.pathname));
  if (!route) return err(res, 404, `no route ${method} ${url.pathname}`);

  const params = url.pathname.match(route.rx).groups || {};
  const body = method === 'POST' ? await readBody(req) : undefined;
  try {
    route.handler(req, res, params, q, body);
  } catch (e) {
    err(res, 500, String(e && e.message ? e.message : e));
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`saksi mock API on http://0.0.0.0:${PORT}  (${sites.length} sites, ${vantages.length} vantages, ${quests.length} quests)`);
  console.log('debug: append ?delay=1500 or ?fail=503 to any request');
});
