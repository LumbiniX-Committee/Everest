# Change Impact Playbook

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

For each common change: what to edit, what else breaks, how to validate, and what goes wrong.

**Universal validation** (run after *any* change):
```bash
npm run typecheck && npm test && npm run validate && npm run vocab && npm run eval:dhamma
npm run lint     # expect exactly 16 pre-existing errors in SpeechCloud.tsx — no more
```

---

## 1. Adding a screen / route

**Primary**
1. Create `app/(main)/<surface>/<name>.tsx` — thin wrapper only
2. Create `features/<domain>/<Name>Screen.tsx`
3. Export it from `features/<domain>/index.ts`

**Secondary**
- Add a navigation entry point (nothing links to it automatically)
- **Run `npx expo start -c`** to regenerate typed routes, or the `Href` will not type-check

**Pattern to copy**
```tsx
import { useLocalSearchParams } from 'expo-router';
import { MyScreen } from '@/features/mydomain';

export default function MyRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <MyScreen id={id} />;
}
```

**Validate:** typecheck; navigate to it; confirm the tab bar stays visible; confirm back pops within the surface.

**Mistakes**
- ❌ Putting logic in the `app/` file — it belongs in `features/`
- ❌ Forgetting `npx expo start -c`
- ❌ **Adding a fourth tab.** The three-surface model is a stated constraint. Use a stack, as settings does (`href: null`)
- ❌ Assuming the folder name determines the route — `ThenNowScreen` (in `features/tirtha/`) is mounted under both `tirtha/` and `sakshi/`

---

## 2. Changing a route parameter

**Primary:** the `app/` route file (the `useLocalSearchParams<T>()` generic) and the screen's props.

**Secondary — find every caller:**
```bash
grep -rn "router.push\|router.replace\|<Link" app features components hooks store
```
Also check [app/_layout.tsx](../../app/_layout.tsx) — it pushes `/(main)/tirtha/site/${target.id}` from a notification tap.

**Mistakes**
- ❌ Forgetting URL params are **always `string`**
- ❌ Not handling not-found — `findSite`, `findVantage`, `getQuestById` all return `undefined`
- ❌ Missing the notification-tap call site in the root layout

---

## 3. Changing the database schema

### Remote (Supabase)

**Primary:** create a **new** file `supabase/migrations/00NN_description.sql`. **Never edit an applied migration.**

**Secondary:** [services/supabase/sync.ts](../../services/supabase/sync.ts) (field mapping), [types/](../../types/), RLS policies for any new table, and the `leaderboard` view if points/tables change.

**Checklist for a new table**
- [ ] `alter table … enable row level security`
- [ ] Owner policies: `user_id = auth.uid()` for insert/update/select
- [ ] `user_id uuid references auth.users(id) on delete set null default auth.uid()`
- [ ] Indexes for the query patterns
- [ ] **Column comments** — this project documents semantics in SQL, and it is genuinely useful

**Mistakes**
- ❌ Editing a shipped migration
- ❌ Letting the client send `user_id` — it must come from the `auth.uid()` default
- ❌ Forgetting RLS (the table would be wide open)
- ❌ Making a nullable measurement default to `0` — see the never-faked promise

### Local (SQLite)

**Primary:** append to the `migrations` array in [services/database/index.ts](../../services/database/index.ts).

The file's own rule: **"Schema changes go through `migrations` below. Never edit an existing entry."** Editing a shipped entry desynchronises devices that already ran it — `PRAGMA user_version` will not re-run it.

**Validate:** run on a device with existing data, not just a fresh install.

---

## 4. Changing an API response / sync payload

**Primary:** [services/supabase/sync.ts](../../services/supabase/sync.ts), the type in [types/](../../types/), the SQL column.

**Secondary:** local SQLite schema, any store holding it, screens displaying it.

**Remember the camelCase ↔ snake_case boundary** ([DATA_MODELS.md](DATA_MODELS.md) §6). `photoUri` → `photo_path` is a *transformation* (local URI → bucket path), not a rename.

**Mistakes**
- ❌ Breaking upload-before-insert ordering — "a failed upload throws here and no row is written"
- ❌ Changing `upsert` to `insert` — sync is retried and must stay idempotent

---

## 5. Adding or changing a preference

**Four edits, all required:**
1. Field + default → [types/preferences.ts](../../types/preferences.ts) (`UserPreferences`, `DEFAULT_USER_PREFERENCES`)
2. Key → [constants/storage.ts](../../constants/storage.ts) (`StorageKeys`)
3. Mapping → [constants/storage.ts](../../constants/storage.ts) (`PreferenceKeys`)
4. UI row → [features/settings/PreferencesScreen.tsx](../../features/settings/PreferencesScreen.tsx)

**Mistakes**
- ❌ Inlining a raw key string — all keys live in `constants/storage.ts`
- ❌ Serialising all preferences into one blob — one key each is deliberate
- ❌ Changing the `sakshi.v1` prefix without a migration
- ❌ **Adding a version prefix to `deviceId`** — its lack of one is deliberate; bumping it "would silently re-identify every install"

**Validate:** toggle it, force-quit, relaunch, confirm it persisted.

---

## 6. Adding a global provider / store

**Primary:** create `store/<name>.tsx`; add to **both** the `AppProviders` tree and the re-export block in [store/index.tsx](../../store/index.tsx).

**Copy the house pattern:** `createContext<T | null>(null)`, a `hydrated` flag, a `useX()` that throws if the provider is missing, and **state-first-then-persist** in setters.

**Mistakes**
- ❌ Adding it to `app/_layout.tsx` instead of `store/index.tsx`
- ❌ Wrong nesting order if it reads another store
- ❌ Omitting `hydrated` — screens will render defaults then flicker
- ❌ Awaiting the disk write before updating state — "reads as a broken control"

---

## 7. Changing shared UI (`components/ui/*`)

**Highest blast radius in the codebase.**

```bash
grep -rn "ComponentName" app features components
```

**Validate:** typecheck; lint (expect exactly the 16 known errors); then **manually** open at least one screen per surface. **There are no component tests.**

**Mistakes**
- ❌ Hardcoding a colour or size instead of a `theme/` token
- ❌ Changing a default (e.g. `MetaRow`'s `mono = true`, which keeps measurement digits aligned)
- ❌ Replacing the domain-typed `ConditionBadge`/`SourceBadge` with a stringly-typed badge

---

## 8. Changing site / quest content

**Primary:** edit `seed/*.json` — **never** `data/generated/*.ts`, which is marked "GENERATED … Do not edit by hand."

```bash
npm run gen        # seed/ → data/generated/
npm run validate   # integrity
npm run verify     # fails if generated files are stale
```

**Secondary:** if you add a site, check whether it needs a vantage, plate, narration `.opus`, or precinct entry.

**Mistakes**
- ❌ Editing `data/generated/*` (overwritten on next `gen`)
- ❌ **Using ids from `data/demo/sites.ts`** — that file is dead and has *different* ids; code written against them "silently skips every leg"
- ❌ Leaving `coords: 'doc'` — `validate` warns, and 5 sites already carry this debt

---

## 9. Adding an asset

| Type | Add to | Then |
|---|---|---|
| Image | `assets/` | `require()` or reference from a data file |
| Narration audio | `assets/audio/` | Register in [data/audio.ts](../../data/audio.ts) |
| Historical plate | `assets/plates/` | Register in [data/plates.ts](../../data/plates.ts) + `seed/plates.json`; **declare its evidence tier** |
| Model | `assets/models/` | Ensure the extension is in `metro.config.js` `assetExts` |
| App icon / splash | `assets/` | Update [app.json](../../app.json) |

**A new binary extension must be added to `config.resolver.assetExts`** in [metro.config.js](../../metro.config.js) (currently `wasm`, `opus`, `onnx`, `pte`) or Metro tries to parse it as JavaScript.

Everything under `assets/` ships (`assetBundlePatterns: ["assets/**/*"]`) — **it all adds to binary size.**

**Licensing:** historical imagery must be recorded in [LICENCES.md](../../LICENCES.md).

---

## 10. Changing branding

| Item | Location |
|---|---|
| App name / slug / scheme | [app.json](../../app.json) |
| Display strings | [constants/app.ts](../../constants/app.ts) — `APP_NAME`, `APP_SUBTITLE`, `APP_EPIGRAPH` |
| Icon | `assets/icon.png` |
| Adaptive icon (3 files + `#F3E4CB`) | `assets/android-icon-*.png`, `app.json` |
| Splash (`#F5F3EE`) | `assets/splash-icon.png`, `app.json` |
| Notification icon + `#8E7657` | `assets/android-icon-monochrome.png`, `app.json` |
| Favicon | `assets/favicon.png` |
| In-app palette | [theme/colors.ts](../../theme/colors.ts) |
| Fonts | [theme/fonts.ts](../../theme/fonts.ts) |

> ⚠️ **`android-icon-monochrome.png` is used twice** — themed launcher icon *and* notification icon.
> ⚠️ **Colours live in two places** — `app.json` (native) and `theme/colors.ts` (in-app). Change both.
> ⚠️ Changing the bundle id / package name **breaks OTA updates and store continuity**.

---

## 11. Adding a dependency

**Primary:** prefer `npx expo install <pkg>` over `npm install` — it picks the SDK-compatible version.

**Then ask:**
- Native module? → requires a **new development build**; Expo Go will not work
- Config plugin needed? → add to `app.json` `plugins`
- New permission? → add to `app.json` and to [services/permissions/index.ts](../../services/permissions/index.ts)
- New binary asset type? → `metro.config.js` `assetExts`
- Needs a patch? → `patches/` + `patch-package` (already wired via `postinstall`)

**Do not remove `patches/onnxruntime-react-native+1.24.3.patch` or [plugins/withOnnxAutolink.js](../../plugins/withOnnxAutolink.js).** They are not redundant — the patch covers clean installs, the plugin covers EAS cached `node_modules`. Removing either can produce a build that compiles then fails at runtime with a null native module, **on EAS but not locally**.

**Validate:** `npm install`, typecheck, lint, and a real build if native.

---

## 12. Changing camera / capture behaviour

**Primary:** [features/sakshi/CaptureScreen.tsx](../../features/sakshi/CaptureScreen.tsx), [services/camera/](../../services/camera/), [components/reticle/](../../components/reticle/).

**Secondary:** [hooks/useAlignment.ts](../../hooks/useAlignment.ts), [core/alignment/score.ts](../../core/alignment/score.ts) (**tested**), `Observation` type, both DB schemas.

**Non-negotiable invariants**
- Unmeasured error → `null`, **never `0`**
- `gateMode: 'manual'` for by-eye captures — never label them `aligned`
- The SQL `CHECK` constraint will reject a violating row anyway

**Validate:** capture in both modes; confirm `manual` rows have `null` errors; confirm the row inserts and later syncs.

---

## 13. Changing sync

**Primary:** [services/supabase/sync.ts](../../services/supabase/sync.ts).
**Secondary:** [services/sync/index.ts](../../services/sync/index.ts), [hooks/useSync.ts](../../hooks/useSync.ts), [features/settings/SyncScreen.tsx](../../features/settings/SyncScreen.tsx), the `AppState` listener in [app/_layout.tsx](../../app/_layout.tsx).

**Preserve:** upload-before-insert; `upsert` idempotency; graceful degradation when `isConfigured()` is false or the session is `null`.

**Validate:** airplane mode → capture → restore network → background/foreground → confirm exactly one row (no duplicate).

---

## 14. Changing Dhamma / retrieval / citations

**Primary:** [core/dhamma/](../../core/dhamma/) — `retrieval.ts`, `engine.ts`, `llm.ts`.
**Secondary:** `features/dhamma/*`, `components/chat/*`, `components/source/*`.

**Mandatory gate:**
```bash
npm run eval:dhamma     # must stay 50/50
```
**and `Citations naming an unretrieved passage` must remain `0`.**

Also verify the **no-key path** still answers via deterministic retrieval — "a missing key degrades an answer, it never fabricates one."

---

## 15. Changing merit / points / the leaderboard

**Client:** [core/merit/rules.ts](../../core/merit/rules.ts), [cap.ts](../../core/merit/cap.ts), [shared/merit.ts](../../shared/merit.ts), [store/practice.tsx](../../store/practice.tsx).
**Server:** the `leaderboard` view in [0008](../../supabase/migrations/0008_leaderboard.sql) — hardcodes 50 / 25 / 30 and `least(sum(points), 200)`.

> ⚠️ **These are duplicated with no sync mechanism.** Change both together or client and server totals diverge. A new migration is required to change the view.

Keep the privacy contract: the view exposes handle, points and a day count only — "never observations, coordinates, photographs or which sites anyone visited."

---

## 16. Changing permissions

**Primary:** [app.json](../../app.json) (declaration + usage string in the plugin config array), [services/permissions/index.ts](../../services/permissions/index.ts), [store/permissions.tsx](../../store/permissions.tsx).
**Secondary:** both `PermissionsScreen` components (onboarding and settings — **two different files, same name**).

**Preserve:** nothing is requested at launch; permissions are asked for at point of use. Handle `canAskAgain: false` by routing to `openSettings()`.

**Requires a rebuild** — permission changes are native.

---

## 17. Changing environment variables

**Primary:** [.env.example](../../.env.example) (documentation), your `.env.local`, the reading code.
**Secondary:** EAS dashboard env vars per profile.

**The `EXPO_PUBLIC_` prefix is mandatory for anything app code reads.** Without it Expo does not inline the value and it is `undefined` on device — a bug this project has already had once, with `OLLAMA_API_KEY`.

**Never put a secret behind `EXPO_PUBLIC_`** — it ships in the bundle.

---

## 18. Quick reference

| Change | Then always |
|---|---|
| Route | `npx expo start -c` |
| Seed content | `npm run gen && npm run validate` |
| Dhamma logic | `npm run eval:dhamma` (50/50, 0 ungrounded) |
| `core/` logic | `npm test` |
| Native config / dependency | Full rebuild |
| Preference | Add 4 places; verify persistence |
| Merit points | Update client **and** SQL view |
| Shared UI | Manual smoke test — no tests exist |
| User-facing copy | `npm run vocab` |

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*
