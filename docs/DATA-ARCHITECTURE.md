# Data architecture

What is stored, where it lives, and why.

---

## 1. What this database is for

Sākṣī produces one irreplaceable thing: **a photograph taken from a fixed
vantage on a particular day**, with enough metadata that a later photograph from
the same vantage can be compared to it. Everything else in the app exists to
produce, describe, or motivate that.

That single sentence settles most of the design questions below. A record meant
to be read in ten years by someone who never met the person who made it needs
different guarantees than a feature that makes an app pleasant this week.

Two consequences run through everything here:

- **The device is the source of truth; the server is the copy.** A phone in the
  Sacred Garden has no signal for hours. Writes land in SQLite first and sync
  later, always. The network is an optimisation.
- **Nothing is deleted.** An observation is evidence. Corrections are additional
  rows, never edits over the top of history.

---

## 2. Three classes of data

Almost every question — *should this sync, who owns it, what happens on
reinstall* — is answered by which class a table belongs to.

| Class | Authored by | Lives | Survives reinstall | Example |
|---|---|---|---|---|
| **Reference** | us, ahead of time | bundle → (later) server | n/a, reshipped | sites, vantages, quests, plates, narration |
| **Record** | the person, on site | device → server | **must** | observations, condition reports |
| **Personal** | the person, incidentally | device | only if identity exists | quest progress, merit, visits, preferences |

### Reference

Currently generated from `seed/` into `data/generated/` and shipped inside the
app. That is right for now: it works offline with no first-run fetch, and the
content changes on the order of months.

The cost is that **a factual correction needs an app release**. A wrong
coordinate or a mistranslated inscription cannot be fixed without a build — and
builds are rate-limited. When correcting content matters more than the
simplicity, reference data moves to Postgres with the bundle as the offline
fallback, not before.

### Record

The product. Two tables today, both syncing. See §4 for what is missing from
that sync.

### Personal

Quest progress, merit events, site visits. These are device-local and currently
**cannot** survive a reinstall, because there is no identity to restore them
against. That is a real limitation, not an oversight — see §3.

---

## 3. The identity gap

**There is no authentication.** Every observation reaching the server is
anonymous, and the app writes with the publishable key that ships inside the
APK.

Three things follow, and they should be decided deliberately rather than
inherited:

1. **Provenance is unrecorded.** A conservation record whose entries have no
   author is much weaker evidence. "Who took this, and had they done it before?"
   is a question a reviewer will ask, and the schema currently cannot answer it.
2. **Personal data cannot survive a reinstall.** Quest progress and merit are
   tied to a device, not a person.
3. **RLS is unaided.** With no user, policies cannot be scoped to an author —
   only to a role. The current tables therefore grant `anon` insert *and update*,
   which means a leaked key can overwrite an existing row. See
   `supabase/migrations/0001_observation_sync.sql` for why update is needed at
   all.

The smallest honest step is an **anonymous device identity**: a UUID generated
on first launch, stored on device, and written onto every row. It does not
authenticate anyone — a device id is not a person and must never be presented as
one — but it groups a series, survives across observations, and makes
"same contributor" answerable. Real accounts (Supabase Auth) are what let RLS
say *"you may only update rows you wrote"*, which is the actual fix for the
update policy above.

---

## 4. Capture integrity, and what the sync used to lose

`services/supabase/sync.ts` sent twelve columns of an observation where the
device records fifteen. **Three never left the phone:**

| Column | What it means | Consequence of losing it |
|---|---|---|
| `gate_mode` | `aligned` = the tolerance gate passed; `manual` = framed by eye | **The server could not tell a measured observation from an eyeballed one** |
| `align_score` | weighted alignment score at capture | No way to rank how well a frame matches its vantage |
| `gps_acc_m` | GPS accuracy reported at capture | `position_error_m` cannot be interpreted |

The first is the serious one. The comment in `services/database/index.ts` is
explicit that `gate_mode` is *"the source of truth for honesty"* — that when it
reads `manual`, the error columns are **not** claims of accuracy. Sync sent
those error columns and dropped the flag, so a reader of the remote data saw
numbers that looked like measurements with no way to know some of them were not.

That was a data-integrity defect rather than a missing feature: the remote
record was not merely less complete than the local one, it was **misleading in a
specific direction**.

**Fixed together:** migration `0002` adds the three columns, and `sync.ts` now
sends them. Either alone would have been half a fix — the columns without the
sender is a wider table that stays empty.

All three are nullable with no default, and stay that way. Rows synced before
this genuinely lack the values; defaulting `gate_mode` would assert a capture
mode nobody recorded, which is the same fabrication the flag exists to prevent.
**A null `gate_mode` means unknown, and its error columns should be read with
the same caution as `manual`** — not as measurements.

---

## 5. Target schema

### Now

```
observations ──1:N──> condition_reports
     │
     └──> storage: observations/<site_id>/<id>.<ext>   (private bucket)
```

`observations.id` is generated on device, so the device can write and reference
rows before it has ever seen the network. Sync is an upsert keyed on that id,
which makes retry idempotent.

### Next, in order of value

1. ~~**`0002` — the honesty columns.**~~ Done: migration `0002` plus the matching
   change to `sync.ts`. Cheapest fix for the most serious problem.
2. **`device_id` on both record tables.** Groups a series without pretending to
   identify a person.
3. **Sites and vantages as reference tables.** Lets a coordinate be corrected
   without an app release, and gives observations a real foreign key instead of
   a free-text `site_id` that nothing validates.
4. **Auth, then author-scoped RLS.** Replaces the blanket `anon` update policy.
5. **Personal-data sync**, only once 4 exists.

### Deliberately not planned

- **Merit events on the server.** Puṇya has no score, no total, and no
  leaderboard by design (`05-CONTENT-SPEC` §6, and the merit table carries no
  weight column for that reason). Syncing it invites exactly the comparison the
  model refuses. It stays on the device unless there is a reason that is not
  "we could".
- **Deleting observations.** There is no delete path and should not be one. A
  mistaken observation is corrected by a condition report or a later
  observation, not by erasing evidence.

---

## 6. Storage

Photographs are the bulk of the data by orders of magnitude and live in a
**private** bucket, keyed `observations/<site_id>/<id>.<ext>`.

The upload happens *before* the row insert, deliberately: a failed upload throws
and no row is written, so the table never points at a file that does not exist.
The reverse order would leave rows referring to nothing, which is worse than a
missing observation because it looks like data.

Two things to decide before the archive grows:

- **Retention.** Nothing is deleted, so storage grows without bound. That is
  correct for the record and needs a budget rather than a policy change.
- **Reading them back.** The bucket is private and there is no read policy, so
  today photographs are retrievable only through the dashboard or a service
  role. A conservator-facing view will need signed URLs, not a public bucket.

---

## 7. Local schema, for reference

Eight tables in SQLite (`services/database/index.ts`), migrations append-only —
index in the array is the schema version, and an existing entry is never edited.

| Table | Class | Syncs |
|---|---|---|
| `observations` | record | yes (all fifteen columns, since `0002` — §4) |
| `condition_reports` | record | yes |
| `quest_submissions` | record¹ | **no** |
| `merit_events` | personal | no, by design |
| `site_visits` | personal | no |
| `quest_progress` | personal | no |
| `quest_completions` | personal | no |
| `quests` | reference | seeded locally |

¹ Quest submissions contain photographs and counts taken on site. They are
evidence, and belong with the record rather than with personal state — they are
listed here as record and *not syncing* because that is a gap, not a decision.
