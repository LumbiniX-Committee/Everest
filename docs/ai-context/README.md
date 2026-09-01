# Sākṣī — AI Context Knowledge Base

**Documentation index and reading guide.**

| | |
|---|---|
| **Project** | Sākṣī (साक्षī) — heritage and pilgrimage app for Lumbini, Nepal |
| **Generated** | 2026-08-25 |
| **Audited commit** | `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` |
| **Branch** | `main` (commit dated 2026-08-10) |
| **Package manager** | npm · `package-lock.json` · lockfileVersion 3 |
| **Stack** | Expo SDK 57 (managed) · React Native 0.86.2 · React 19.2.3 · TypeScript ~6.0.3 |

---

## ⚠️ This is a snapshot

Everything here describes the repository **at the commit above**. Before relying on any detail:

```bash
git rev-parse HEAD
```

- **Same hash?** These documents describe the code as it is.
- **Different?** Treat this as a **map, not a mirror**. Architecture, conventions and constraints will almost certainly still hold. File lists, counts and line-level claims may not. **Read the actual file before changing it.**

**The source always wins over the documentation.** If they disagree, fix the documentation — see [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md).

---

## Purpose

A permanent, evidence-based knowledge base so an AI agent (or a new developer) can understand this project, plan a change, locate the right files, and implement most requests **without re-scanning the whole repository**.

Every substantive claim cites a file path and symbol name. Uncertain findings are labelled **Needs verification** rather than guessed at.

---

## Reading order

### Start here (~5 minutes)
1. **[PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md)** — what the app is, and **the five promises** that constrain every change
2. **[ARCHITECTURE.md](ARCHITECTURE.md)** — layers, dependency direction, initialisation
3. **[CODEX_WORKING_GUIDE.md](CODEX_WORKING_GUIDE.md)** — conventions, commands, traps

### Before any change
4. **[CHANGE_IMPACT_PLAYBOOK.md](CHANGE_IMPACT_PLAYBOOK.md)** — for 18 common change types: what to edit, what breaks, how to validate
5. **[KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md)** — 27 verified issues; check before touching anything fragile

### As needed
| Document | Answers |
|---|---|
| [REPOSITORY_MAP.md](REPOSITORY_MAP.md) | Where does X live? What is this directory for? |
| [FEATURES.md](FEATURES.md) | What actually works? 21 features with honest status |
| [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md) | All 33 routes, navigation model, provider order |
| [COMPONENTS.md](COMPONENTS.md) | The 12 design-system primitives + feature components |
| [STATE_AND_DATA_FLOW.md](STATE_AND_DATA_FLOW.md) | The 6 stores, persistence, storage keys |
| [BACKEND_AND_API.md](BACKEND_AND_API.md) | Supabase schema, RLS, auth, sync |
| [DATA_MODELS.md](DATA_MODELS.md) | TypeScript types and their invariants |
| [DEPENDENCIES.md](DEPENDENCIES.md) | All 51 direct dependencies and why each exists |
| [ASSETS.md](ASSETS.md) | All 44 assets and their consumers |
| [CONFIGURATION_AND_ENVIRONMENT.md](CONFIGURATION_AND_ENVIRONMENT.md) | Config files, env vars, external services |
| [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) | Permissions, config plugins, the ONNX workaround |
| [BUILD_RUN_AND_DEPLOYMENT.md](BUILD_RUN_AND_DEPLOYMENT.md) | Verified commands, EAS profiles, deployment |
| [TESTING_AND_QUALITY.md](TESTING_AND_QUALITY.md) | Test setup, coverage gaps, manual checklist |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | Feature ↔ route ↔ store ↔ service ↔ table ↔ test |
| [GLOSSARY.md](GLOSSARY.md) | Sanskrit/Pali terms used as identifiers, domain vocabulary |
| [CURRENT_IMPLEMENTATION_PLAN.md](CURRENT_IMPLEMENTATION_PLAN.md) | Verified status + `Suggested` next steps |
| [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md) | How to keep this true |

### Machine-readable
| File | Contents |
|---|---|
| [PROJECT_INVENTORY.json](PROJECT_INVENTORY.json) | Structured inventory: routes, screens, stores, features, issues |
| [DEPENDENCY_INVENTORY.json](DEPENDENCY_INVENTORY.json) | All dependencies + importer lists + 815 transitive packages |
| [ASSET_INVENTORY.json](ASSET_INVENTORY.json) | All 44 assets with sizes and reference status |

All three are valid JSON (verified).

---

## Status labels

| Label | Meaning |
|---|---|
| **Fully implemented** | Complete, reachable path through to persistence or display |
| **Partially implemented** | Core works; a sub-capability is missing or optional by design |
| **UI-only** | Renders, but actions do not persist or fetch |
| **Mock-data only** | Works, but reads hardcoded content with no live source |
| **Placeholder** | Stub |
| **Disabled** | Present but switched off |
| **Unused / dead code** | Not reachable |
| **Planned / mentioned only** | Referenced but not built |
| **Needs verification** | Not confirmed during this audit |

> **Bundled seed content is not "mock data."** Sites, quests, plates and narration are the real intended content, bundled deliberately so the app works offline.

---

## When targeted source verification is still required

Read the actual source — do not rely on these documents alone — when:

- `git rev-parse HEAD` differs from the audited commit
- You are editing a file (**always read before editing**)
- The document says **Needs verification**
- You need exact field lists, prop types, or line-level detail
- You are touching a **high-risk area**: [app/_layout.tsx](../../app/_layout.tsx), [services/supabase/index.ts](../../services/supabase/index.ts), [services/supabase/sync.ts](../../services/supabase/sync.ts), [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx), `patches/`, [plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js), [metro.config.js](../../metro.config.js), `components/ui/*`, or any migration
- Observed behaviour contradicts what you read here

---

## Verified state at this commit

| Check | Result |
|---|---|
| `npm install` | ✅ 934 packages |
| `npm run typecheck` | ✅ Clean |
| `npm test` | ✅ **126/126** |
| `npm run validate` | ✅ Pass (5 warnings) |
| `npm run vocab` | ✅ Clean |
| `npm run eval:dhamma` | ✅ **50/50**, 0 ungrounded citations |
| `npm run verify` | ✅ Pass |
| `npm run lint` | ❌ **16 errors** — all in `components/monk/SpeechCloud.tsx` |
| `npx expo start --web` | ✅ Bundles and serves |

> **`npm run verify` does not include `lint`**, and does not type-check `core/` or `shared/`. A green `verify` is not "everything is clean."

---

## The five promises

From [README.md](../../README.md). **A change that violates one is a defect even if every test passes.**

1. **A measurement is never faked** — no GPS fix saves `null`, never `0`
2. **"By eye" is never dressed up as "measured"** — `gateMode` distinguishes them
3. **The AI suggests, it never decides** — candidates and advisory verdicts only
4. **Nothing is ever deleted** — correct by adding a record
5. **The phone is the source of truth** — local write first; the cloud is a copy

---

## Documents not in this knowledge base

The repository root holds ~700 KB of earlier prose documentation ([SAKSHI-COMPLETE.md](../../SAKSHI-COMPLETE.md), [handbook.md](../../handbook.md), [documentation.md](../../documentation.md), [explanation.md](../../explanation.md), [SAKSHI-PROJECT-STATUS.md](../../SAKSHI-PROJECT-STATUS.md), [HANDOFF-PHASE-8-9.md](../../HANDOFF-PHASE-8-9.md)). **These were not verified during this audit.**

[README.md](../../README.md) **is** verified accurate. [PROJECT.md](../../PROJECT.md) is **stale in its file references** — it names symbols that no longer exist.

Where root documentation disagrees with this knowledge base, prefer this one (it is commit-stamped and evidence-cited) — but verify against source before acting on either.

---

*Scope: this knowledge base documents the Expo app in `Everest/`. It does not cover the standalone Next.js app in [landing/](../../landing/), which has its own `AGENTS.md` and `CLAUDE.md`.*
