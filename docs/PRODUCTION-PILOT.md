# Sākṣī production pilot

**Current as of 11 September 2026.** This is the maintained implementation and
rollout guide. `POST-PIVOT-STATUS.md` is a verbatim historical snapshot dated 27
August; `15-POST-HACKATHON-STRATEGY (1).md` is the strategy input and remains
unchanged.

## Verified repository baseline

- 15 sites, 12 active fixed vantages, 13 quests, and 13 plate records.
- The five previously warned coordinates now cite UNESCO or OpenStreetMap
  provenance; `npm run validate` reports zero warnings.
- Root tests: 132 domain tests plus 16 native React/service integration tests
  passing. These cover provider composition and boot, English/Nepali capture
  and condition-report journeys, local-first submission, immutable evidence
  upload retries, and Supabase configuration/session failure. Dhamma
  evaluation: 68/68 with no fabricated citations. Root lint and both
  TypeScript gates are clean.
- Landing tests: 27 passing. Landing TypeScript, lint, and a production Next.js
  build are clean.
- Landing production dependencies audit clean after the Next 16.3.4 security
  update. Expo packages match the SDK 57 compatibility set (`expo install
  --check` passes). The root audit still reports 19 transitive Expo/Metro
  toolchain findings (15 moderate, 4 high) for which npm proposes incompatible
  or breaking downgrades; no forced audit rewrite was applied.
- Three Kathmandu Valley illustrations are bundled as `artistic_impression`,
  the weakest evidence tier. Their captions explicitly say that they are not
  photographs or measured reconstructions.
- The visitor localization gate covers 274 typed English/Nepali semantic keys
  and 601 registered legacy interface phrases. Its TypeScript parser scans TSX
  labels, headings, placeholders, hints, accessibility text, and shared copy,
  label, status, and option tables. Authored passages, citations, catalogue
  prose, identifiers, and visitor evidence explicitly bypass interface
  translation.

Run the complete gates from a clean checkout:

```sh
npm ci
npm run verify

cd landing
npm ci
npm run verify
```

CI repeats these as separate Expo and landing jobs and runs 24 pgTAP database
assertions in a local Supabase stack. Production configuration checks reject
mock, localhost, and Railway API endpoints.

## Production architecture

The Expo app is visitor-focused and remains offline-first: it writes a capture
to the phone before attempting Supabase synchronisation. The privileged surface
is the responsive Next.js portal in `landing/`.

Custodians sign in by email magic link. Accounts are invited manually and gain
access only through `custodian_memberships`. The browser receives server-managed
cookies; actor identity is always read from the authenticated session.

Migration `supabase/migrations/0009_production_pilot.sql` adds:

- `monitored_sites` and `monitored_vantages`;
- site-scoped, invite-only `custodian_memberships`;
- append-only `condition_report_actions` with server-owned actor and timestamp;
- append-only custodian urgency actions that feed visitor quest ranking;
- `vantage_commitments` for the optional 90-day adoption workflow;
- RLS for site-scoped evidence and private photographs;
- narrow public functions for coverage priorities and redacted condition pages.

Report state is derived from the newest action. Legal transitions are `open →
acknowledged → in_progress → resolved`; acknowledged reports may resolve
directly, and resolved reports can reopen only with an explanation. Evidence
rows reject changed upserts while allowing exact sync retries. Missing
measurements remain null. Evidence photographs are create-only: a retry can
reuse an existing object but cannot replace its bytes.

**Corroborations are mock-only.** `shared/types.ts`, `core/merit/rules.ts`,
`shared/merit.ts`, `services/custodian/index.ts`, and `mock-api/server.mjs`
implement a peer-corroboration count and a `corroborated` report status, and
the mock API's own CSV/GeoJSON exports include a `corroborations` column. No
Supabase migration backs this: `condition_reports` and
`condition_report_actions` in `0009_production_pilot.sql` have no
corroboration table, column, or status value, and `services/custodian/index.ts`
has no live-backend implementation to call. This is a deliberate scope
decision, not an oversight — corroboration needs its own abuse model (who may
corroborate, whether self-corroboration or a single custodian's repeat
corroboration should count, and how it interacts with the existing
merit-award ledger) that has not been designed for a real multi-user
deployment. `landing/lib/custodian-export.ts` does not export a
`corroborations` field for this reason; adding one before the schema exists
would export a column that can never populate. Treat this as a rollout gate:
before corroboration ships against Supabase, add a migration with its own RLS
policy (mirroring the append-only pattern of `condition_report_actions`) and
wire `services/custodian/index.ts` to it.

## Web routes and disclosure boundary

Privileged same-origin APIs:

- `GET /api/custodian/dashboard?site_id&from&to` (or `days=30|90|365`)
- `GET /api/custodian/reports?site_id&status&cursor`
- `POST /api/custodian/reports/{id}/actions`
- `GET /api/custodian/reports/{id}/photo` (five-minute signed URL)
- `GET /api/custodian/export?format=csv|geojson`
- `POST /api/custodian/vantages/{id}/priority`

Public APIs expose only vantage age/priority and the aggregate condition view.
The page `/sites/[siteId]/condition` contains rolling coverage, last-survey
dates, acknowledged taxonomic fields, and action dates/statuses. It excludes
identities, notes, exact locations, raw report IDs, photographs, and
unacknowledged reports.

The adoption page `/adopt` uses the same magic-link identity. Contact data stays
in Supabase Auth. An adopter stores only owner kind, optional public label,
vantage, due date, cadence, and active state, and can end a commitment without
deleting its record. No financial or transferable reward exists.

## Catalogue and deployment

Do not edit an applied migration. Confirm the remote migration history and
anonymous-sign-in setting before applying `0007`, then apply new migrations to
a staging project first.

After `0009` exists in staging, synchronise the bundled catalogue:

```sh
npm run catalog:plan
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run catalog:apply
```

`catalog:plan` is read-only. `catalog:apply` requires a server-only service-role
key, upserts the 15 sites and 12 vantages, and never deletes remote rows. Never
place that key in an `EXPO_PUBLIC_*` or `NEXT_PUBLIC_*` variable.

To make a fresh staging dashboard show real numbers instead of dashes before
any pilot custodian has visited, run `npm run seed:staging:apply` after the
catalogue exists. `tools/seed-history-supabase.mjs` reuses the same history
generator `tools/seed-history.mjs` uses for the mock API, so the two do not
drift, and inserts observations, condition reports and (through a provisioned
seed custodian session, since the append-only action trail requires a real
authenticated actor) condition report actions. It needs `SUPABASE_ANON_KEY` in
addition to the service-role key. Read the file's header comment before
running it against anything other than a disposable staging project: seeded
acknowledgement timestamps reflect when the script ran, not the simulated
historical time, because the audit-trail trigger stamps `created_at` itself
and cannot be backdated by any caller.

Configure `landing/.env.local` from `landing/.env.example`, and set
`SAKSHI_REQUIRE_PRODUCTION_CONFIG=1` in the deployment environment. Invite each
pilot custodian through Supabase Auth, then provision only the required site
memberships. Use separate accounts to verify that report, export, and photo
access cannot cross a site boundary.

## Acceptance and rollout

Code-complete does not mean field-ready. The remaining operational sequence is:

1. Run the Supabase migration and RLS tests in a local or staging stack.
2. Confirm `0006`/`0007` readiness and the deployed migration history.
3. Sync the catalogue and invite test custodians for Patan Durbar Square,
   Changu Narayan, and Manga Hiti.
4. Validate access isolation, signed-photo expiry, CSV escaping, GeoJSON in
   QGIS, and public redaction against staging evidence.
5. Run the fixed-point capture and dissolve checklist on at least three physical
   phones using [PILOT-CHECKLIST.md](PILOT-CHECKLIST.md).
6. Conduct a two-week internal pilot. Track sync success, acknowledgement time,
   coverage, API failures, and denied-access events.
7. Start with one custodian organisation only after security and export
   acceptance passes. Release public transparency only after it approves the
   disclosure taxonomy; release adoption only after consent and cadence are
   approved.
8. Corroboration stays mock-only until a migration and abuse model exist for
   it (see "Production architecture" above); do not enable it against a real
   custodian organisation before then.

The repository cannot itself verify hosted Supabase settings, invite real
accounts, approve a disclosure policy, contact institutions, open exports in
QGIS, or perform physical-phone tests. Those items require the deployment team
and are deliberately recorded as rollout gates rather than claimed complete.

Local database acceptance uses `supabase start && supabase test db`. Docker or
Podman is required; CI runs the same test file in `supabase/tests/`.
