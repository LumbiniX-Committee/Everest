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
- **Custodian actions.** The dashboard deliberately has no login. That is a
  documented product decision, not an oversight, and it means acknowledgements
  are attributable to a remembered name rather than an authenticated account.
  Report anything that goes further than that — for instance a way to read or
  alter reports across institutions.

## What is not a vulnerability

- The absence of authentication on the custodian dashboard. See above.
- `EXPO_PUBLIC_*` values appearing in the app bundle. They are publishable by
  design; row-level security is what protects the data.
- Approximate coordinates on sites marked `coords_source: doc`. Those are
  labelled as unsurveyed on purpose.
