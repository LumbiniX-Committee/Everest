# Licensing

*Why Sākṣī is licensed the way it is, and what covers what. Decided
2026-09-01, closing strategy #2 in [POST-HACKATHON.md](POST-HACKATHON.md).*

---

## The short version

| What | Licence | File |
| --- | --- | --- |
| **Source code** | Apache License 2.0 | [`LICENSE`](../LICENSE) |
| **Content and data** | Creative Commons Attribution 4.0 | [`LICENSE-CONTENT`](../LICENSE-CONTENT) |
| **OSM-derived coordinates** | ODbL 1.0 applies in addition | [`LICENSE-CONTENT`](../LICENSE-CONTENT) |
| **Third-party media** | Unchanged, per rights holder | [`LICENCES.md`](../LICENCES.md) |
| **The name and marks** | Not licensed | Below |

Two licences rather than one, because code and content are different things
with different obligations, and pretending otherwise would have meant getting
one of them wrong.

---

## Why the code is Apache-2.0

The decision was made against one question: **what does a heritage institution
need in order to say yes?**

The whole Band B strategy — feed Arches, license the custodian platform to a
site trust, take grant money attached to World Heritage monitoring — depends on
a department of archaeology or a municipal heritage office being able to adopt
this without commissioning a legal review. A permissive licence removes that
barrier outright. A copyleft one does not.

**Why not MIT**, which is shorter and more familiar? Three things Apache-2.0
has that MIT lacks, all of which matter here:

- **An explicit patent grant.** This repository ships on-device computer vision
  and a retrieval pipeline. Contributors grant patent rights along with
  copyright, so an adopter is not exposed to a contributor later asserting a
  patent against them. MIT is silent on patents, and silence is not a grant.
- **An explicit trademark reservation** (Section 6). The project's name is one
  of the few things it actually owns. MIT does not address this.
- **A stated-changes requirement** (Section 4b). Anyone distributing a modified
  version has to say that they modified it. For a project whose entire claim is
  that provenance travels with the record, a licence that requires modification
  to be declared is the licence that agrees with the product.

**Why not AGPL-3.0**, which several people will argue for? It is the licence
[Arches](https://www.archesproject.org/faq/) itself uses, and its network
copyleft would force anyone running a modified custodian dashboard as a service
to publish their changes. That is genuinely attractive, and it is the wrong
trade here for two reasons:

1. **Public-sector procurement frequently forbids it.** An AGPL dependency is a
   known blocker in government and institutional purchasing. The strategy that
   pays for this project runs directly through those buyers.
2. **Compatibility runs the way we need it to anyway.** Apache-2.0 code can be
   incorporated into an AGPL-3.0 project; the reverse is not true. Choosing
   Apache keeps an Arches integration *possible*. Choosing AGPL would have
   protected us against a risk we do not have while blocking the adoption we are
   trying to earn.

The risk we accept: a commercial vendor can take this code, close it, and sell
it back to an institution. That is real. It is also survivable, because the code
is not the moat — the sourced register, the established viewpoints, and the
custodial relationships are, and none of those are a copy-and-paste away.

## Why the content is CC BY 4.0

Different obligations, so a different instrument.

- **Not CC0.** The project's own rule is *attribution before invention*. A public
  domain dedication would strip the chain of provenance off the one thing the
  record exists to preserve. The licence should agree with the product.
- **Not CC BY-SA.** Share-alike on a dataset makes it materially harder for an
  institution to fold this register into an existing inventory that is under
  other terms — which is precisely the outcome the strategy is aiming at. We
  want the data absorbed, not quarantined.
- **CC BY**, therefore: take it, use it, build on it, say where it came from.

Facts are not copyrightable and we claim no monopoly on any date or coordinate.
What the licence covers is the expression: the summaries, the selection, the
arrangement, and the compilation.

## The OpenStreetMap obligation

This is the one part that is not ours to decide.

Ten of the fifteen sites carry a coordinate recorded as `coords_source: "osm"`.
Those positions were checked against, and in places taken from, OpenStreetMap,
whose data is © OpenStreetMap contributors under the
[Open Database Licence](https://www.openstreetmap.org/copyright). Our CC BY
grant covers our compilation. **It cannot relicense OpenStreetMap's data**, and
anyone extracting those coordinates into a database of their own inherits ODbL's
attribution and share-alike terms regardless of what this repository says.

Stating that plainly is cheaper than being wrong about it later, and the
published manifest at `landing/public/data/manifest.json` carries the same note
so a data consumer meets it without reading this file.

## Trademark

The name **Sākṣī**, the wordmark, and the reticle mark are not licensed. Apache
Section 6 already reserves them; this is a restatement, not an addition.

You may say your product is *built on Sākṣī*. You may not call it Sākṣī, or
imply that the project or the LumbiniX-Committee endorses it. This matters more
than usual here: the product's value to an institution is that a record carrying
this name was made under stated rules. A fork that keeps the name and drops the
rules would damage exactly the thing the licence is trying to spread.

## Contributions

Inbound equals outbound. A contribution offered to this repository is offered
under the same terms as the part of the repository it touches — Apache-2.0 for
code, CC BY 4.0 for content — with no separate agreement to sign. This is stated
in [CONTRIBUTING.md](../CONTRIBUTING.md) and follows the Apache-2.0 Section 5
default.

**One open item.** Eight people have committed here. This decision was taken by
the project lead and is recorded in the repository, which is how most projects
of this size do it. It would be stronger with the other contributors' explicit
agreement on the record — an issue they each comment on is enough. Until then,
the position is that Apache-2.0 Section 5 governs their existing contributions,
which is the ordinary reading and is very unlikely to be tested.

## What this is not

It is not a promise about the hosted service, the API, or the data an
institution submits through the custodian dashboard. Those are governed by
whatever agreement covers a deployment, and by the
[ethics policy](../landing/app/\(site\)/ethics/page.tsx) — which forecloses
funding from any commercial entity operating inside a monitored site. A licence
says what others may do with our work. It does not say what we will do with
theirs.
