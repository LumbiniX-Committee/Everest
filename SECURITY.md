# Security

## Reporting a vulnerability

Please do not open a public issue. Report it privately through GitHub's
[security advisory form](https://github.com/LumbiniX-Committee/Everest/security/advisories/new),
or by contacting a maintainer directly.

Tell us what you found, how to reproduce it, and what you think it exposes. We
will confirm receipt and tell you what we intend to do about it.

## What is sensitive here

This project is worth attacking for reasons that are not obvious, so it is worth
naming them.

- **Location traces of individuals at religious sites.** Where someone stood, and
  when, at a place of worship is sensitive in ways ordinary app telemetry is not.
  The app carries no third-party analytics in the capture path, and it should
  stay that way.
- **The integrity of the record.** A monitoring record is only worth having if it
  cannot be forged. Anything that lets a report claim a sensor-verified alignment
  it did not have, or that lets an existing observation be altered rather than
  superseded, is a serious defect even though nothing is "leaked".
- **Custodian actions.** The dashboard uses invite-only Supabase magic-link
  authentication. Memberships are scoped by site, actor identity comes from the
  server-managed session, and report actions are append-only. Report any way to
  read or act on another institution's reports, replace evidence, bypass the
  action history, or obtain a private photograph without membership.

## What is not a vulnerability

- `EXPO_PUBLIC_*` values appearing in the app bundle. They are publishable by
  design; row-level security is what protects the data.
- A public condition page omitting reporter identity, exact capture coordinates,
  private notes, unpublished photographs, and unacknowledged free-text claims.
  That redaction is intentional; public routes may expose only approved
  aggregates returned by the narrow database functions.
