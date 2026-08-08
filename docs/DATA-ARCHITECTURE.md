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

**Done: an anonymous device identity.** `services/device` generates an id on
first launch, stores it on device, and every synced row now carries it
(migration `0004`). It answers "did the same device record this vantage before"
and nothing else.

It is worth being exact about what that did *not* buy, because a device id is
easy to over-read:

- **It is not a person.** A phone is handed to a friend; a person carries two.
  It groups captures, it does not attribute them.
- **It is not authentication.** It arrives as an ordinary column from a client
  holding the publishable key, so any value can be claimed. RLS still cannot be
  scoped to it, and a policy written as though it could would be theatre.
- **It is not stable across a reinstall.** Clearing storage yields a new id, so
  a break in a series may be a new device or the same one starting over. No
  query should imply otherwise.

So points 2 and 3 above stand unchanged. Real accounts (Supabase Auth) are what
let RLS say *"you may only update rows you wrote"*, which remains the actual fix
for the update policy — and the id is generated with `Math.random`, which is
adequate for a grouping key and would have to be replaced the moment it carried
any authority.

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

### The same mistake, from the other end

The remote schema declared `position_error_m` and `bearing_error_deg` **NOT
NULL**, because that is what `sync.ts` looked like it sent. It was not.
`toObservation()` reports both as null exactly when `gate_mode` is `manual` —
null being how the app says *unmeasured*, as against zero, which would say
*perfectly measured*.

So every by-eye capture was posted into two NOT NULL columns and rejected
`23502`, permanently. And the loop re-threw on the first failure, so that one
record aborted the pass before every observation and condition report behind
it. **One unsyncable row stranded the entire queue, on every attempt.**

Migration `0003` drops both constraints, and `sync.ts` now isolates a failing
record instead of re-throwing — a poisoned row costs one row. Dropping the
constraints is not a loosening: it restores the meaning the columns already had
on the device. The alternative was to keep rejecting the observation or write a
zero, and the second is worse than losing a record, because it is a false one.

In its place is a constraint that enforces the honesty invariant rather than
fighting it:

```sql
check (gate_mode is distinct from 'aligned'
       or (position_error_m is not null and bearing_error_deg is not null))
```

A row claiming the tolerance gate passed must carry the measurements that claim
rests on. `manual` and null gate modes assert nothing, so they constrain
nothing.

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

1. ~~**`0002` — the honesty columns.**~~ Done, with the matching `sync.ts`
   change. Cheapest fix for the most serious problem.
2. ~~**`0003` — by-eye captures can sync at all.**~~ Done. Was silently losing
   every manually framed observation, and everything queued behind it.
3. ~~**`0004` — `device_id` on both record tables.**~~ Done. Groups a series
   without pretending to identify a person.
4. ~~**`0005` — quest evidence syncs.**~~ Done. Closes the gap named in §7.
5. **Sites and vantages as reference tables.** Lets a coordinate be corrected
   without an app release, and gives observations a real foreign key instead of
   a free-text `site_id` that nothing validates. Needs the app to read
   remote-with-bundle-fallback, so it is a change to the offline guarantee and
   not only to the schema.
6. **Auth, then author-scoped RLS.** Replaces the blanket `anon` update policy,
   and is the only thing that makes personal data survive a reinstall. Wants a
   product decision first — anonymous sign-in gets an `auth.uid()` with no UI at
   all, real accounts need a sign-in people will meet before they have any
   reason to trust the app.
7. **Personal-data sync**, only once 6 exists.

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
| `quest_submissions` | record | yes, since `0005` |
| `merit_events` | personal | no, by design |
| `site_visits` | personal | no |
| `quest_progress` | personal | no |
| `quest_completions` | personal | no |
| `quests` | reference | seeded locally |

Quest submissions contain photographs and counts taken on site. They are
evidence and belong with the record rather than with personal state, which is
why they now sync: what someone actually saw cannot be retaken, and it used to
end its life on the phone.

Their remote key is `(device_id, quest_id, task_id)`, not the device's own
`(quest_id, task_id)`. That pair is unique on one phone and not on a shared
table — two devices working the same quest produce the same key, and an upsert
would have let the second silently overwrite the first. A quiet deletion, in a
database whose first principle is that nothing is deleted.
