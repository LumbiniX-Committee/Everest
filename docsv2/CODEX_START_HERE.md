# Codex — Start Here

**Sākṣī** (साक्षी, "witness") — a heritage and pilgrimage app for **Lumbini, Nepal**, the birthplace of the Buddha. Built for the LumbiniX 2026 hackathon.

> **What it does, in one line:** it turns a visitor's attention into evidence a conservator can trust.
>
> You stand at a catalogued fixed viewpoint, line your phone up with it, and photograph the site today. Return later, repeat from the same spot, and the images line up into a record of how the place is changing.

---

## Documentation

**Full knowledge base: [docs/ai-context/](docs/ai-context/README.md)** — 26 documents.

**Read in this order:**
1. [docs/ai-context/README.md](docs/ai-context/README.md) — index
2. [docs/ai-context/PROJECT_OVERVIEW.md](docs/ai-context/PROJECT_OVERVIEW.md) — what it is + **the five promises**
3. [docs/ai-context/ARCHITECTURE.md](docs/ai-context/ARCHITECTURE.md) — layers and constraints
4. **[docs/ai-context/CODEX_WORKING_GUIDE.md](docs/ai-context/CODEX_WORKING_GUIDE.md)** — conventions, commands, traps
5. **[docs/ai-context/CHANGE_IMPACT_PLAYBOOK.md](docs/ai-context/CHANGE_IMPACT_PLAYBOOK.md)** — before any change

---

## ⚠️ Check documentation freshness first

```bash
git rev-parse HEAD
```

**Audited commit: `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1`** (branch `main`)

If the hash differs, the docs are a **map, not a mirror**: conventions and architecture still hold, but file lists and counts may have drifted. **Always read a file before editing it.** Source wins over documentation.

---

## Architecture in brief

```
app/         Routes (expo-router, file-based). THIN wrappers — 3-6 lines.
features/    Screen implementations by domain. The real UI code.
components/  ui/ = design system · others = feature support.
hooks/       React glue.
store/       6 React Context providers. No Redux/Zustand/React Query.
services/    The ONLY layer touching device APIs or the network.
core/        Pure domain logic. NO React. 126 tests. Own tsconfig.
data/        Content barrel — always import from '@/data'.
```

**Dependency direction is strictly downward.** `core/` never imports upward.

**Entry point:** `expo-router/entry` → [app/_layout.tsx](app/_layout.tsx) (providers + splash gate) → [app/index.tsx](app/index.tsx) (redirect: onboarding vs main).

**Navigation:** exactly **three surfaces** — Tīrtha (explore), Sākṣī (capture), Dhamma (Q&A). Settings is a hidden stack, **deliberately not a fourth tab**.

**Stack:** Expo SDK 57 managed (no `android/`/`ios/` dirs) · RN 0.86.2 · React 19.2.3 · TS strict · Supabase · expo-sqlite · MapLibre · ONNX.

---

## Commands

```bash
npm install                 # includes patch-package postinstall — required
npx expo start --web        # fastest way to see it run (verified working)
npx expo start              # then press a / i, or scan for Expo Go

npm run verify              # typecheck + test + validate + vocab + eval:dhamma
npm run lint                # ⚠️ 16 KNOWN errors in components/monk/SpeechCloud.tsx
npx expo start -c           # REQUIRED after adding/renaming a route
```

**Minimum bar before finishing:** `npm run verify` passes, and `npm run lint` shows **no new** errors beyond the 16 known ones.

> `verify` does **not** include `lint`, and does **not** type-check `core/` or `shared/`.

---

## ⚠️ Major warnings

**The five promises** — a change that breaks one is a defect even if tests pass:
1. A measurement is never faked — unmeasured is `null`, **never `0`**
2. "By eye" is never dressed up as "measured" — `gateMode: 'manual'` vs `'aligned'`
3. The AI suggests, it never decides — candidates only, never gates a submission
4. Nothing is ever deleted — correct by adding a record
5. The phone is the source of truth — local write first, cloud is a copy

**Traps that fail silently:**
- **`data/demo/sites.ts` is dead code with *different* site ids.** Live ids come from `data/generated/sites.ts` via `@/data`. Using the wrong ones "silently skips every leg" — no error, nothing happens.
- **Two components named `PermissionsScreen`** (onboarding vs settings).
- **Folder ≠ route:** `features/quests` → `/tirtha/quests`; `features/leaderboard` → `/sakshi/guardians`; `features/chaityavali` → `/sakshi/register`. `ThenNowScreen` is mounted at **two** routes.
- **Missing `EXPO_PUBLIC_` prefix** on an env var = `undefined` on device, silently.
- **`hooks/useUserPreferences.ts` does not exist** despite `PROJECT.md` — it is `usePreferences()` in [store/preferences.tsx](store/preferences.tsx).

**Never:**
- Edit an applied migration (local `services/database/index.ts` or `supabase/migrations/`) — **append**
- Hand-edit `data/generated/*` — edit `seed/*.json`, then `npm run gen`
- Remove `patches/onnxruntime-*.patch` or [plugins/withOnnxAutolink.js](plugins/withOnnxAutolink.js) — they are not redundant; removing either breaks the detector **on EAS but not locally**
- Move the Supabase client out of lazy construction — it crashes every screen without `.env.local`
- Put a secret behind `EXPO_PUBLIC_` — it ships in the bundle
- Add a fourth tab

**Operational unknown:** `supabase/migrations/0007` drops all anonymous write policies. If it has been applied while anonymous sign-in is disabled in Supabase, **every write fails silently**. See [KNOWN_ISSUES](docs/ai-context/KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) C1.

---

## Quick links

- 🔧 **[CHANGE_IMPACT_PLAYBOOK.md](docs/ai-context/CHANGE_IMPACT_PLAYBOOK.md)** — what to edit, what breaks, how to validate
- 📋 **[CODEX_WORKING_GUIDE.md](docs/ai-context/CODEX_WORKING_GUIDE.md)** — conventions and rules
- 🐛 [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](docs/ai-context/KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) — 27 verified issues
- 🗺️ [REPOSITORY_MAP.md](docs/ai-context/REPOSITORY_MAP.md) — where things live
- 🔗 [TRACEABILITY_MATRIX.md](docs/ai-context/TRACEABILITY_MATRIX.md) — impact analysis
- 📖 [GLOSSARY.md](docs/ai-context/GLOSSARY.md) — Sanskrit/Pali terms used as identifiers

---

*Scope: the Expo app in this directory. The standalone Next.js app in [landing/](landing/) has its own `AGENTS.md`.*
