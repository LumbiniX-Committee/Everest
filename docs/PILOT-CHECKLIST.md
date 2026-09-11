# Production-pilot acceptance checklist

Record tester, date, build/runtime version, device model, OS, site, vantage, and
result for every row. A verbal “works” is not an acceptance record.

## Three-phone field matrix

Use at least one low/mid-range Android phone, one recent Android phone, and one
iPhone production build. Test one fixed vantage at each Kathmandu Valley pilot
site where access and custodian permission allow.

| Check | Phone A | Phone B | Phone C |
|---|---|---|---|
| Cold boot and permissions | Pending | Pending | Pending |
| Offline site/quest access | Pending | Pending | Pending |
| GPS/heading/pitch update | Pending | Pending | Pending |
| Alignment lock at fixed point | Pending | Pending | Pending |
| Manual/by-eye mode labelled honestly | Pending | Pending | Pending |
| Capture review and condition taxonomy | Pending | Pending | Pending |
| Local write succeeds with network off | Pending | Pending | Pending |
| Sync succeeds after network returns | Pending | Pending | Pending |
| Then/Now dissolve remains responsive | Pending | Pending | Pending |
| Artistic-impression tier/caption visible | Pending | Pending | Pending |
| English/Nepali preference survives restart | Pending | Pending | Pending |

For every capture, compare the local record with the remote row. Missing GPS or
orientation must remain null; manual framing must never appear as a measured
lock. Photograph upload must complete before its observation row is accepted.

## Custodian isolation

- Invite two separate test accounts and assign non-overlapping sites.
- Confirm each account sees only its membership sites in dashboard, reports,
  trends, exports, commitments, and photographs.
- Paste a cross-site report/photo URL into the other session; expect 403 or 404
  with no existence leak.
- Acknowledge, start, resolve, and reopen a report. Reopen without a reason must
  fail. Confirm every action remains in chronological history.
- Sign out, expire the magic-link session, and confirm privileged APIs return
  401. Confirm a photograph URL stops working after its five-minute lifetime.

## Public redaction and GIS

- Compare a public condition page with its underlying staging records. Reporter
  identity, notes, coordinates, raw report IDs, photographs, and unacknowledged
  reports must be absent.
- Export CSV and GeoJSON with quotes, commas, newlines, Unicode, and missing
  coordinates. Open both in QGIS.
- Missing coordinates must stay empty in CSV and be omitted from GeoJSON; no
  `(0,0)` point or site centroid may be substituted.

## Pilot go/no-go

Go only when all three device columns pass, RLS isolation and public redaction
are signed off, QGIS accepts both exports, the custodian agrees to the taxonomy
and disclosure fields, and the two-week internal pilot shows no unresolved data
loss or cross-site access incident.
