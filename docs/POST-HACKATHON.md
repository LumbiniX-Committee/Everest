# After the hackathon

*Fifteen strategies for turning a LumbiniX build into a project that outlives
it, ranked by what actually stops the work — not by what is most fun to build.*

*Written 2026-09-01, against `main` at the end of the hackathon push.*

---

## The situation, honestly

Eight people made 327 commits, 249 of them in three days in August. Since then
the repository has averaged under five commits a week. That is the normal shape
of a hackathon project, and it is also exactly the shape of one that quietly
stops.

What exists is not a prototype: roughly 55,000 lines of TypeScript, a working
offline-first record path, on-device computer vision, a citation-locked answer
engine that scores 68/68 on its own benchmark, a custodian dashboard, and four
heritage sites with sourced content. What does not exist is almost everything
that lets other people join, trust, fund, or adopt it.

Three findings shape the whole list below:

1. **The repository had no CI and no `.github/` directory at all.** Five checks
   that encode the project's promises existed and ran only when somebody
   remembered. A gate nobody runs is already open.
2. **There is no project licence.** `LICENCES.md` is third-party media
   attribution, not a licence. No institution can legally adopt, fund, or build
   on this until that changes. It is the single highest-leverage unblocked item
   and it is not an engineering task.
3. **Forty-two remote branches, thirty-five of them fully merged.** Work was already being lost to drift.

---

## The fifteen

### Band A — Survival: the repository outlives the push

| # | Strategy | Why it matters | Cost | State |
|---|---|---|---|---|
| 1 | **Run the honesty gate in CI** | The vocabulary linter, seed validation, and the Dhamma evaluation *are* the product's integrity claims. Unenforced, they rot within a month of the next contributor. | Low | **Done** |
| 2 | **Declare a licence** | Legally blocks every institutional path in Band B. Needs the agreement of eight contributors, so it is a decision, not a task. | Low effort, high consequence | **Blocked on the team** |
| 3 | **Contribution scaffolding** | `CONTRIBUTING.md`, a security policy, pull-request and issue templates — including one for data corrections, which are the most serious bug class here. | Low | **Done** |
| 4 | **Pin the toolchain** | `npm run verify` silently never starts on Node 20, because `--experimental-strip-types` is rejected before the suite runs. Nothing warned about this. | Trivial | **Done** |
| 5 | **Merge or close the stale branches** | Drift compounds. It was 42 branches, not seven — the earlier count came from a truncated listing. | Low | **Done** |

### Band B — Adoption: an institution can say yes

| # | Strategy | Why it matters | Cost | State |
|---|---|---|---|---|
| 6 | **Publish the register as open data** | The research concluded that Arches and its peers are systems of record that never acquire, and that Sākṣī should feed them rather than compete. That is a slogan until the data leaves in GeoJSON without anyone having to ask. | Low | **Done** |
| 7 | **Replace `mock-api` with a real backend** | The custodian dashboard — the half we would sell — depends on scaffolding whose own README says to delete it. | High | Open |
| 8 | **Survey-grade coordinates from the Lumbini Development Trust** | Five of fifteen sites still carry coordinates read off a document. Partnership converts the app from illustrative to authoritative, and it is the highest-value thing an institution can contribute. | Relationship, not code | Open |
| 9 | **One custodian pilot, named and real** | One institution acknowledging one real report is worth more than any amount of further building. It is also the only way to learn whether the loop closes in practice. | Medium | Open |
| 10 | **A data-protection posture** | The ethics policy governs money and says nothing about data law. The app records where individuals stood at places of worship. Retention, deletion, and lawful basis need answering before a government partner asks. | Medium | Open |

### Band C — Evidence: the claims get tested

| # | Strategy | Why it matters | Cost | State |
|---|---|---|---|---|
| 11 | **Ship the three stack replacements** | Sync to a real replication engine, media to content-addressed zero-egress storage, tiles to a self-hosted archive. Detailed in the engineering report; none is urgent until a second institution exists. | High | Open |
| 12 | **Span-level faithfulness evaluation** | The existing Dhamma benchmark scores answers. The 2024–2026 literature scores *spans*, and finds models introduce unsupported statements even with correct context in front of them. Retrieving is not the same as being grounded. | Medium | Open |
| 13 | **Close the damage-model loop** | Confirmed reports become the training set. Generalisation across brick, coursed stone, lime plaster and eroded sandstone is the open problem in the crack-detection literature, and our own corpus is the only fix. | Medium | Open |

### Band D — Growth

| # | Strategy | Why it matters | Cost | State |
|---|---|---|---|---|
| 14 | **Play Store, then iOS** | Sideloading an APK caps reach at people willing to override a scary Android warning. The funnel is domestic, regional, and Android-first — which is the good news. | Medium | Open |
| 15 | **Grant and programme funding** | Not a consumer subscription. The 2025 climate assessments moved real money toward World Heritage monitoring, and the ethics policy already forecloses the alternative: no funding from a commercial operator inside a monitored site. | Relationship | Open |

---

## What was implemented now, and why those three

**1 — the CI gate (#1, #4).** Everything in Band C is worthless if the invariants
decay first. The repository already contained five checks encoding its promises;
they now run on every push and every pull request, as separately named steps so a
failure says *which promise broke* rather than which script did. The workflow
also fails when the generated explorer dataset or the open data export drifts out
of step with `seed/`, which is the failure mode a committed generated file
invites. `.nvmrc` and an `engines` field make the Node 22 requirement explicit
rather than a cryptic `bad option`.

**2 — the open data export (#6).** This is the one strategic move that changes
what an outside institution can do, and it was cheap. `landing/scripts/build-open-data.mjs`
writes the register to GeoJSON and CSV from the same seed files the app ships,
with a manifest carrying the coordinate reference system, the counts, and the
caveats. The app's honesty rule carries into the export: a site whose coordinate
was read off a document is published as `surveyed: false`, not rounded into
looking like a survey. `/data` on the website makes it findable.

**3 — the contribution scaffolding (#3).** Eight people have committed here with
no stated process. `CONTRIBUTING.md` leads with the Node 22 trap because that one
silently disables every check, then states the promises a change has to keep. The
issue templates include a **site data correction** form that requires a source,
because a wrong coordinate is a more serious bug than a layout glitch and needs
to be reported like one.

## What is deliberately not done

**The licence (#2) was not chosen.** It is the highest-leverage item on this
list, and it belongs to eight contributors rather than to whoever edits the
repository next. The open data manifest therefore reports `"licence": null` and
says so on the page, which is the honest state and makes the decision visibly
blocking rather than quietly missing.

A recommendation, for whenever that conversation happens: the code and the
content want different answers. Something permissive for the code, so an
institution can build on it without a legal review; something like CC BY for the
content, so the sourced facts travel with their attribution intact. Coordinates
marked `osm` already carry ODbL obligations regardless of what is chosen.

## The branch cleanup (#5), and how to get anything back

The repository carried 42 branches besides `main`. Thirty-five had **zero**
commits that were not already in `main`, so closing them lost nothing. Seven
carried unique commits, and examining them showed that six were behind `main` in
substance rather than ahead of it:

| Branch | Finding |
| --- | --- |
| `quests-less-textual` | Already merged through pull request #37 and then rebased, so git had lost the ancestry. `QuestCompletedScreen.tsx` is byte-identical to `main`. |
| `map-zoom-responsive` | Superseded. `main` carries 18 zoom references in `mapHtml.ts` against this branch's 8, and a `useSiteArrival` grown from 88 lines to 129. |
| `tirtha-realtime-significance` | A strict subset of `map-zoom-responsive`. |
| `fullscreen-map-and-figure` | Superseded by the navy and white theme system; `theme/colors.ts` grew from 107 lines to 146 over six later commits. |
| `feature/dhamma-questions-banner-ui` | Targets a screen that no longer exists in that form. `DhammaScreen.tsx` has been rewritten six times since. |
| `feature/buddha` | Genuinely unmerged work — a reflection overlay and `expo-video`. The author's later `feature/sakshi-capture-review-submit` covered the capture-review ground and did merge. |

**Nothing was thrown away.** Each of those six is preserved as an annotated tag
that records why it was closed:

```bash
git fetch --tags
git tag -l 'archive/*'
git show archive/feature/buddha            # the reason it was closed
git checkout -b feature/buddha archive/feature/buddha   # bring it back
```

A seventh branch, `claude`, was deleted **without** an archive tag: it contained
one file and nothing else, and that file was an encoded credential. Preserving it
would have preserved the credential.

## The next three, in order

1. **Decide the licence.** Nothing in Band B can start without it.
2. **Rotate the credential that was committed to the `claude` branch.** Deleting
   the branch does not undo the exposure — it was pushed to a public repository.
3. **Find one custodian (#9).** Not more features. One institution, one real
   report, one acknowledgement — and then the honest answer about whether any of
   this works.
