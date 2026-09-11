# Documentation Maintenance

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

How to keep this knowledge base true. **Stale documentation is worse than none** — it sends agents confidently to files that no longer exist. [PROJECT.md](../../PROJECT.md) is the cautionary example: it still names `hooks/useUserPreferences.ts`, which does not exist.

---

## 1. The rule

> **If a change alters documented behaviour, update the documentation in the same change.**

Not "later," not a separate ticket. A commit that changes a route and leaves `SCREENS_AND_NAVIGATION.md` describing the old one has introduced a defect in the knowledge base.

---

## 2. Change → document

| You changed | Update |
|---|---|
| A route, navigator, or route param | [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md), [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) |
| A feature's behaviour or status | [FEATURES.md](FEATURES.md), [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) |
| A component's API | [COMPONENTS.md](COMPONENTS.md) |
| A store's shape or actions | [STATE_AND_DATA_FLOW.md](STATE_AND_DATA_FLOW.md) |
| A storage key | [STATE_AND_DATA_FLOW.md](STATE_AND_DATA_FLOW.md) §4 |
| A DB schema (local or remote) | [BACKEND_AND_API.md](BACKEND_AND_API.md), [DATA_MODELS.md](DATA_MODELS.md) |
| Sync / API behaviour | [BACKEND_AND_API.md](BACKEND_AND_API.md) |
| A TypeScript type | [DATA_MODELS.md](DATA_MODELS.md) |
| A dependency | [DEPENDENCIES.md](DEPENDENCIES.md) **+ [DEPENDENCY_INVENTORY.json](DEPENDENCY_INVENTORY.json)** |
| An asset | [ASSETS.md](ASSETS.md) **+ [ASSET_INVENTORY.json](ASSET_INVENTORY.json)** |
| A permission or native config | [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) |
| An env var | [CONFIGURATION_AND_ENVIRONMENT.md](CONFIGURATION_AND_ENVIRONMENT.md) |
| A script or build profile | [BUILD_RUN_AND_DEPLOYMENT.md](BUILD_RUN_AND_DEPLOYMENT.md) |
| Tests or a quality gate | [TESTING_AND_QUALITY.md](TESTING_AND_QUALITY.md) |
| Fixed a known issue | [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) — **move it to a Resolved section, don't silently delete** |
| Architecture or layering | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Directory structure | [REPOSITORY_MAP.md](REPOSITORY_MAP.md) |
| A domain term | [GLOSSARY.md](GLOSSARY.md) |
| Anything structural | [PROJECT_INVENTORY.json](PROJECT_INVENTORY.json) |

---

## 3. Updating the commit stamp

Every document carries the audited commit in its header and footer. After a substantive documentation refresh:

```bash
git rev-parse HEAD
```

Update **both** occurrences in each touched file, and the `audit.commit` field in all three JSON files. **Do not update the stamp on a file you did not actually re-verify** — a stamp implies verification.

---

## 4. Updating the JSON inventories

### `DEPENDENCY_INVENTORY.json`

After any dependency change:
1. `audit.generatedAt` and `audit.commit`
2. The package's entry under `dependencies` / `devDependencies` (`declared`, `resolved`, `importers`)
3. `counts.directProduction` / `directDevelopment`
4. `declaredButNoDirectSourceImport` if it has no direct import
5. `transitiveResolved` if the tree changed

Resolved versions: `npm ls <package>`.

### `ASSET_INVENTORY.json`

After adding/removing an asset:
1. `audit.generatedAt` / `audit.commit`
2. An entry with `path`, `fileType`, `extension`, `bytes`, `referencedBy`, `status`
3. `summary.total`, `totalBytes`, `referenced`, `unreferenced`

> Its own caution: status is "a static-reference heuristic. **Never delete an asset on the strength of this file alone.**"

### `PROJECT_INVENTORY.json`

Update whenever screens, routes, features, stores, services, models, dependencies, assets, permissions, tests or known issues change.

**Always validate after editing:**
```bash
node -e "JSON.parse(require('fs').readFileSync('docs/ai-context/PROJECT_INVENTORY.json','utf8')); console.log('valid')"
```

---

## 5. Documenting a new feature

1. Add a row to the [FEATURES.md](FEATURES.md) summary table
2. Add a detailed subsection: purpose, entry route, flow, dependencies, data source, permissions, **status with a one-line evidence citation**, known issues
3. Add a row to [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) §1
4. Add routes to [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md)
5. Add new terms to [GLOSSARY.md](GLOSSARY.md)
6. Add a change recipe to [CHANGE_IMPACT_PLAYBOOK.md](CHANGE_IMPACT_PLAYBOOK.md) if it introduces a new *kind* of change
7. Update [PROJECT_INVENTORY.json](PROJECT_INVENTORY.json)

**Be honest about status.** A screen that renders beautifully but persists nothing is **UI-only**, not "fully implemented." Cite the evidence.

---

## 6. Evidence standard

Every substantive claim needs evidence: **a file path and a symbol name.**

✅ Good — falsifiable, and survives line-number drift:
> `getQuestById` returns `undefined` for unknown ids ([store/quests.tsx](../../store/quests.tsx)).

❌ Bad:
> Quest lookup handles missing quests gracefully.

**Prefer paths and symbols over line numbers** — line numbers go stale within a commit or two.

**Quote the source when the reasoning matters.** This codebase explains *why* in its comments; quoting that is more durable than paraphrasing it.

**Mark uncertainty.** If you did not verify it, write **Needs verification** and add it to the file's bottom section. Never guess to fill a gap.

---

## 7. Review checklist

Before committing a documentation change:

- [ ] Every claim has a file path or symbol as evidence
- [ ] Every internal link resolves (see §8)
- [ ] Every referenced file path exists
- [ ] No secret values (only variable **names**)
- [ ] Uncertain claims marked **Needs verification**
- [ ] Status labels match the definitions in [GLOSSARY.md](GLOSSARY.md) §4
- [ ] Commit stamp updated **only** on files actually re-verified
- [ ] JSON files still parse
- [ ] No duplicated prose — cross-link instead
- [ ] Counts (routes, tests, dependencies) still accurate

---

## 8. Verifying links

Relative links from `docs/ai-context/` use `../../` to reach the repo root.

```bash
# Extract and test every relative link target
grep -rhoE "\]\(\.\./\.\./[^)]+\)" docs/ai-context/*.md \
  | sed 's/](\.\.\/\.\.\///; s/)$//' | sed 's/#.*//' | sort -u \
  | while read -r f; do [ -e "$f" ] || echo "BROKEN: $f"; done
```

Sibling links (`](FEATURES.md)`) resolve within `docs/ai-context/`.

---

## 9. Marking outdated information

If you find something wrong but cannot fix it now, **mark it inline** rather than leaving it to mislead:

```markdown
> ⚠️ **OUTDATED as of <commit>:** this described X; the code now does Y. Verify before relying on this section.
```

Also add it to [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) under documentation uncertainty.

---

## 10. Re-auditing

A full re-audit is warranted when:

- A major refactor lands
- The Expo SDK is upgraded
- Backend auth or schema changes materially
- Several **Needs verification** items are resolved at once
- The documented commit is far behind `HEAD`

**Preserve what is still correct.** Re-verify and update in place; do not regenerate from scratch and lose accumulated detail.

---

## 11. Open verification backlog

Carried forward from this audit — resolve and update the owning document:

| Item | Document |
|---|---|
| Is migration 0007 applied? Is anonymous sign-in enabled? | [BACKEND_AND_API.md](BACKEND_AND_API.md) |
| Exact local SQLite column definitions (8 tables) | [DATA_MODELS.md](DATA_MODELS.md) |
| `services/sync` vs `services/supabase/sync` relationship | [BACKEND_AND_API.md](BACKEND_AND_API.md) |
| Circuit-breaker call sites (possible dead code) | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Is `EXPO_PUBLIC_API_URL` used anywhere? | [CONFIGURATION_AND_ENVIRONMENT.md](CONFIGURATION_AND_ENVIRONMENT.md) |
| llama.rn model acquisition path | [FEATURES.md](FEATURES.md) |
| Do arrivals need background location? | [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) |
| Is `TirthaScreen` reachable? | [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md) |
| Is the Vitest harness live? | [TESTING_AND_QUALITY.md](TESTING_AND_QUALITY.md) |
| Per-screen loading/error state coverage | [FEATURES.md](FEATURES.md) |
| Accessibility coverage | [COMPONENTS.md](COMPONENTS.md) |
| Do `core/dana` and `core/progression` have UI surfaces? | [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) |
| The ~700 KB of root markdown — verify or deprecate | [REPOSITORY_MAP.md](REPOSITORY_MAP.md) |

---

*Part of the [docs/ai-context](README.md) knowledge base.*
