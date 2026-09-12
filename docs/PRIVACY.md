# Privacy: what is collected, why, and for how long

This is the source document for `landing/app/(site)/privacy/page.tsx`, the
public-facing statement. It exists because `docs/POST-HACKATHON.md` flagged a
real gap: `/ethics` governs money and says nothing about data, while the app
records where individual visitors stood at places of worship. This is a
product team's considered position, not legal advice, and it is written down
so it can be checked rather than assumed. It must be reviewed by counsel
before any institutional partner treats it as a compliance document — see the
rollout gate in `docs/PRODUCTION-PILOT.md`.

## What is collected

A capture ("observation") records: the photograph, the device's GPS position
and heading at the moment of the shutter, a computed alignment score against
the target vantage, and an optional note. A condition report adds a category,
subtype, severity and optional note. See `docs/DATA-ARCHITECTURE.md` for the
exact schema.

**The coordinates are always the observer's own position at the moment of
capture** — where they were standing, not a location they typed in. There is
no manual-coordinate entry path anywhere in the app (`services/location`).
That is the sensitive part worth stating plainly: a repeat visitor's capture
history is a record of their own movements through a set of religious and
historical sites.

No name, email, or phone number is collected. Every write from an ordinary
visitor is attributed to two identifiers, neither of which identifies a
person:

- a random **device id**, generated on first launch and stored only on that
  device (`services/device`);
- an **anonymous Supabase Auth account**, created transparently on first sync
  with no credential a person enters (`services/supabase/auth`).

Both exist to group a device's own contributions together and to let Row
Level Security scope writes to their author, not to identify who made them. A
reinstall already produces a new, unlinked pair of both; Settings → Privacy
makes that same reset reachable without losing the app.

Custodian accounts (site staff) are a separate system: real email addresses,
via Supabase Auth magic link, provisioned by invitation only. This document
covers visitor data; custodian account handling is unchanged by it.

## Why it is collected

The app's whole claim is a long-term photographic monitoring record: whether
a site is deteriorating is answered by comparing a photograph taken today
against one taken from the same vantage years ago. The coordinate and heading
exist to verify the comparison is valid — that the two photographs really are
of the same thing — not to track the person who took either one.

## Lawful basis

Capture is an explicit, in-the-moment action: a person aims the phone at a
marked vantage and presses the shutter. That action is the consent the
capture rests on, and nothing is recorded before it. Because what is
retained is not tied to an identified natural person — no name, no email, a
rotating anonymous identifier that the person can sever at will — the
stricter obligations that attach to identifiable personal data are reduced
under most readings of applicable law, but this has not been confirmed by
counsel and should not be treated as settled. Institutions with their own
data-protection obligations should review this position before relying on
it.

## Retention

Two different things are retained differently, and conflating them is the
mistake this section exists to avoid:

- **Conservation evidence already shared into a site's record** — a synced
  observation or condition report — is retained indefinitely, the same way a
  museum or archive retains a catalogued record rather than expiring it. This
  is the product working as designed: `docs/DATA-ARCHITECTURE.md` states
  "nothing shared into the record is deleted" and explains why an append-only
  monitoring record cannot honestly offer erasure of the evidence itself.
- **The link between a device and its contributions** is retained only as
  long as the person keeps using the app under that device id and session.
  Settings → Privacy lets anyone sever it at any time: the device's local
  copy of every personal-activity record is wiped, its photographs deleted,
  and the device given a fresh, unlinked identity. Nothing recorded after
  that point can be tied back to what came before it.
- **Locally held, not-yet-synced data** lives on the device only, under the
  device owner's own control, until it syncs or is cleared via the same
  Settings → Privacy path.

There is currently no separate storage-cost retention budget for the
Supabase-side photograph archive; `docs/DATA-ARCHITECTURE.md` §6 records this
as an open operational question distinct from the privacy question this
document answers.

## Who can see it

- A site's custodian accounts (invite-only, site-scoped via
  `custodian_memberships`) can see full reports, coordinates and photographs
  for their own site only, enforced by Row Level Security — see
  `supabase/migrations/0009_production_pilot.sql`.
- The public condition page (`/sites/[siteId]/condition`) shows only
  aggregate, acknowledged information: category, severity, rolling coverage,
  and action dates. It excludes identities, exact coordinates, raw report
  ids, photographs, notes, and any report no custodian has acted on.
- Nothing is sold, licensed to advertisers, or repackaged as marketing
  imagery — see `/ethics`.

## How to get a copy, or have your device forgotten

In-app: Settings → Privacy.

- **Export my records** bundles everything this device is holding — synced
  or not — into a JSON file, offered through the device's own share sheet.
- **Delete my records** wipes this device's local copy, deletes its
  photographs, and gives the device a new, unlinked identity. It states
  plainly what it does not do: it cannot remove a record already shared into
  a site's conservation record, for the reason given under Retention above.

Outside the app: open an issue against the repository
(<https://github.com/LumbiniX-Committee/Everest>) naming the device or
capture you are asking about as specifically as you can. There is no other
contact channel today; adding one is future work, not a claim made here.
