# Codex Working Guide

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

Direct instructions for AI coding agents working in this repository.

---

## 0. First: check whether this documentation is still current

```bash
git rev-parse HEAD
```

- **Matches `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1`?** These docs describe the code as it is.
- **Different?** Treat this as a *map, not a mirror*. Structure and conventions will still hold; specific file lists, counts and line-level claims may not. **Verify anything you are about to change by reading the actual file.**

**Never trust documentation over source.** Where they disagree, the source wins — and you should fix the documentation ([DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md)).

---

## 1. Reading order

**Always (~5 min):**
1. [README.md](README.md) — index
2. [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) — **especially "the five promises"**
3. [ARCHITECTURE.md](ARCHITECTURE.md) — layering and constraints

**Then, by task:**

| Task | Read |
|---|---|
| Any change | [CHANGE_IMPACT_PLAYBOOK.md](CHANGE_IMPACT_PLAYBOOK.md) |
| Finding a file | [REPOSITORY_MAP.md](REPOSITORY_MAP.md) |
| Screens / routing | [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md) |
| UI work | [COMPONENTS.md](COMPONENTS.md) |
| State | [STATE_AND_DATA_FLOW.md](STATE_AND_DATA_FLOW.md) |
| Backend / sync | [BACKEND_AND_API.md](BACKEND_AND_API.md) |
| Types | [DATA_MODELS.md](DATA_MODELS.md) |
| Native / permissions | [NATIVE_AND_PERMISSIONS.md](NATIVE_AND_PERMISSIONS.md) |
| Building | [BUILD_RUN_AND_DEPLOYMENT.md](BUILD_RUN_AND_DEPLOYMENT.md) |
| Before touching anything fragile | [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) |

---

## 2. The five promises — do not break these

From [README.md](../../README.md). **A change that violates one is a defect even if every test passes.**

1. **A measurement is never faked.** No GPS fix → save `null`, never `0`.
2. **"By eye" is never dressed up as "measured."** `gateMode: 'manual'` vs `'aligned'`.
3. **The AI suggests, it never decides.** Detector output is candidates; Dhamma answers only from real sources.
4. **Nothing is ever deleted.** Correct by adding a record.
5. **The phone is the source of truth.** Local write first; cloud is a copy.

---

## 3. Sources of truth

| Question | Authority |
|---|---|
| Remote schema | `supabase/migrations/*.sql` |
| Local schema | `migrations` array in [services/database/index.ts](../../services/database/index.ts) |
| Routes | files under `app/` |
| Storage keys | [constants/storage.ts](../../constants/storage.ts) |
| Domain types | [types/](../../types/) |
| Site/quest content | `seed/*.json` (**not** `data/generated/`) |
| Design tokens | [theme/](../../theme/) |
| Env vars | [.env.example](../../.env.example) |
| Native config | [app.json](../../app.json) |
| Dependencies | [package.json](../../package.json) + `package-lock.json` |

**Not sources of truth:** `data/generated/*` (regenerated), `.expo/` (generated), [PROJECT.md](../../PROJECT.md) (**stale**), the ~700 KB of root markdown (unverified).

---

## 4. Conventions

### Imports
```ts
import { colors, spacing } from '@/theme';        // alias, from the barrel
import { Button, Card } from '@/components/ui';
import { storage, database } from '@/services';   // namespace imports
import { useAppState } from '@/store';
```
- Always `@/` — never deep relative paths like `../../../`
- Always the **barrel** (`@/components/ui`), not the file
- Services are **namespaces**: `storage.getBoolean(...)`

### Naming
| Thing | Convention |
|---|---|
| Screens | `<Name>Screen.tsx`, named export |
| Route files | lowercase-kebab, `export default function <Name>Route()` |
| Components | `PascalCase.tsx`, named export |
| Hooks | `use<Name>.ts` |
| Props types | `<Component>Props`, exported |
| Stores | `store/<name>.tsx` + `use<Name>()` |
| Storage keys | `StorageKeys.<camelCase>` → `sakshi.v1.<domain>.<field>` |
| Migrations | `00NN_snake_case.sql` |

### Where a file goes
| Kind | Location |
|---|---|
| Route | `app/**` (thin only) |
| Screen | `features/<domain>/` |
| Reusable UI | `components/<group>/` |
| One-feature component | `features/<domain>/components/` |
| React glue | `hooks/` |
| Global state | `store/` |
| Device/network | `services/` |
| Pure business logic | `core/` (+ a `.test.ts`) |
| Pure helper | `utils/` |
| Type | `types/` |
| Constant | `constants/` |

### Styling
```ts
const styles = StyleSheet.create({
  card: { padding: spacing.md, borderRadius: radii.md, backgroundColor: colors.surface },
});
```
Tokens only — **no hex literals, no magic numbers**. Use `<Text>` from `@/components/ui`, not RN's.

### State
- Context + `useState`, `hydrated` flag, `useX()` that throws when the provider is missing
- **State first, persistence second** — never await a disk write before updating the UI
- Register new providers in [store/index.tsx](../../store/index.tsx)

### Errors
- `null` is a legitimate return value — **do not "fix" it into a throw** (`ensureSession()`, `recognise()`, `getQuestById()`)
- Directed errors: say what to set, not just what failed
- Background work swallows errors; user-initiated work surfaces them

---

## 5. Commands to run after changes

```bash
npm run typecheck        # after any TS change
npm test                 # after any core/ change
npm run validate         # after seed/ changes (run npm run gen first)
npm run vocab            # after any user-facing copy
npm run eval:dhamma      # after any core/dhamma change — must stay 50/50, 0 ungrounded
npm run verify           # all of the above
npm run lint             # expect EXACTLY 16 errors in SpeechCloud.tsx
```

**Minimum bar:** `npm run verify` passes, and `npm run lint` shows **no new** errors beyond the 16 known ones.

**`verify` does not include `lint`, and does not type-check `core/` or `shared/`.** Do not read a green `verify` as "everything is clean."

---

## 6. Files you must not hand-edit

| Path | Why |
|---|---|
| `data/generated/*.ts` | Generated — edit `seed/*.json`, run `npm run gen` |
| `.expo/**` | Generated typed routes |
| `node_modules/**` | Use `patches/` + patch-package |
| `package-lock.json` | Let npm write it |
| **Any applied migration** (local or remote) | Append a new one instead |
| `core/dhamma/corpus.generated.ts` | Generated by `npm run corpus:fetch` |

---

## 7. High-risk areas — verify before touching

| Area | Risk |
|---|---|
| [app/_layout.tsx](../../app/_layout.tsx) | Boot gate. A mistake = white screen at launch. **Untested** |
| [services/supabase/index.ts](../../services/supabase/index.ts) | Client **must** stay lazy — module scope crashes every screen without `.env.local` |
| [services/supabase/sync.ts](../../services/supabase/sync.ts) | Upload-before-insert; `upsert` idempotency |
| [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx) | The core loop; uses deprecated `expo-file-system/legacy` |
| `patches/` + [plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js) | Both needed. Removing either breaks ONNX **on EAS but not locally** |
| [metro.config.js](../../metro.config.js) | Asset extensions + COEP/COOP headers |
| [components/ui/*](../../components/ui/) | Every screen depends on these. **No tests** |
| `supabase/migrations/0007*` | Can lock out all writes — see [KNOWN_ISSUES](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) C1 |
| Merit points / cap | Duplicated in TS **and** SQL |

---

## 8. Traps that fail silently

1. **`data/demo/sites.ts` is dead and has different site ids** (`ashoka-pillar`, `puskarini-pond`, `bodhi-tree`). Live ids come from `data/generated/sites.ts`. Code using the wrong ones "silently skips every leg."
2. **Two `PermissionsScreen` components** — onboarding vs settings.
3. **`ThenNowScreen` is mounted at two routes** — editing it affects both surfaces.
4. **Folder ≠ route**: `features/quests` → `/tirtha/quests`; `features/leaderboard` → `/sakshi/guardians`; `features/chaityavali` → `/sakshi/register`.
5. **`hooks/useUserPreferences.ts` does not exist** despite `PROJECT.md` — it is `usePreferences()` in `store/preferences.tsx`.
6. **Missing `EXPO_PUBLIC_` prefix** = `undefined` on device, silently.
7. **`features/practice/` has no screen** — merit UI is elsewhere.
8. **Forgetting `npx expo start -c`** after a route change.

---

## 9. When to verify against source

**Always read the file before editing it.** Beyond that, verify when:

- The commit hash differs from the one above
- You are touching anything in §7
- A doc says "Needs verification"
- You need exact field lists, prop types, or line-level detail
- Behaviour contradicts what you read here

**Do not** re-derive the whole repository for a small change — that is what this knowledge base is for.

---

## 10. Update the documentation

**If your change alters documented behaviour, update the matching doc in the same change.**

| You changed | Update |
|---|---|
| A route | [SCREENS_AND_NAVIGATION.md](SCREENS_AND_NAVIGATION.md), [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) |
| A feature's status | [FEATURES.md](FEATURES.md) |
| A component's API | [COMPONENTS.md](COMPONENTS.md) |
| A store | [STATE_AND_DATA_FLOW.md](STATE_AND_DATA_FLOW.md) |
| Schema / sync | [BACKEND_AND_API.md](BACKEND_AND_API.md), [DATA_MODELS.md](DATA_MODELS.md) |
| A dependency | [DEPENDENCIES.md](DEPENDENCIES.md), `DEPENDENCY_INVENTORY.json` |
| An asset | [ASSETS.md](ASSETS.md), `ASSET_INVENTORY.json` |
| Fixed a known issue | [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md) |

See [DOCUMENTATION_MAINTENANCE.md](DOCUMENTATION_MAINTENANCE.md).

---

## 11. House style

This codebase has an unusually strong comment culture: comments explain **why**, often citing a regression the code prevents. Examples worth reading before writing your own:

- [services/supabase/index.ts](../../services/supabase/index.ts) — why the client is lazy
- [services/supabase/auth.ts](../../services/supabase/auth.ts) — why anonymous auth, and its limits
- [constants/storage.ts](../../constants/storage.ts) — why `deviceId` has no version prefix
- [plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js) — why both a patch and a plugin
- [types/heritage.ts](../../types/heritage.ts) — why `no-change` is a finding

**Match this.** Explain the reasoning behind a non-obvious decision, not what the code literally does.

Also note: `npm run vocab` enforces project terminology **and typography** — including that no em dash reaches a reader. Run it after writing user-facing copy.

---

## 12. Before you finish

- [ ] `npm run verify` passes
- [ ] `npm run lint` shows no new errors (16 known)
- [ ] No generated file hand-edited
- [ ] No applied migration edited
- [ ] No secret added to `EXPO_PUBLIC_*`
- [ ] None of the five promises weakened
- [ ] Storage keys in `constants/storage.ts`
- [ ] Theme tokens, not literals
- [ ] Affected documentation updated
- [ ] If native config changed: noted that a rebuild is required

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*
