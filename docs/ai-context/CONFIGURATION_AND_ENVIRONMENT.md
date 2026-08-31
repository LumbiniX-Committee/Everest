# Configuration and Environment

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)

> **No secret values appear in this document.** Only variable names, purposes, and safe placeholder formats.

---

## 1. Configuration files

| File | Purpose | Edit when |
|---|---|---|
| [app.json](../../app.json) | Expo config: identity, icons, permissions, plugins | Changing branding, permissions, native modules |
| [package.json](../../package.json) | Dependencies + scripts | Adding a dependency or script |
| [tsconfig.json](../../tsconfig.json) | TypeScript for the app layer | Changing aliases or strictness |
| [metro.config.js](../../metro.config.js) | Bundler: asset extensions, web headers | Adding a binary asset type |
| [eslint.config.js](../../eslint.config.js) | Lint + import resolver | Changing lint rules |
| [eas.json](../../eas.json) | EAS build/submit profiles | Changing build config |
| [.easignore](../../.easignore) | Excluded from build upload | Adding a large or secret directory |
| [.env.example](../../.env.example) | **Template — the documentation of every env var** | Adding a new variable |
| `.env.local` | Your real values — **gitignored, never committed** | Local setup |
| [Procfile](../../Procfile) | Mock-API process definition | Changing mock-API deployment |
| [mock-api/railway.json](../../mock-api/railway.json) | Railway deployment config | Changing mock-API hosting |
| [.mcp.json](../../.mcp.json) | MCP server config (developer tooling, not app runtime) | — |
| [tools/test/*](../../tools/test/) | Vitest harness + `core/` typecheck config | Changing the secondary test setup |

**No `babel.config.js` exists** — the project uses Expo's default preset. Adding one overrides that default; do so only with reason.

---

## 2. Environment variables

All are read from `.env.local` (gitignored). Copy the template:

```bash
cp .env.example .env.local
```

### ⚠️ The `EXPO_PUBLIC_` prefix rule

[.env.example](../../.env.example) states it plainly:

> "`EXPO_PUBLIC_` variables are **inlined into the JavaScript bundle at build time**, so they are readable by anyone with the app. Only ever put publishable values here."

**Two consequences:**

1. **A variable without the prefix is not available to app code.** The file records a real bug caused by this: `core/dhamma` previously read `OLLAMA_API_KEY` with no prefix, "which Expo does not inline — so it was undefined on every device and the provider was never called at all." **The prefix is load-bearing.**
2. **A prefixed variable is public.** "A service-role key must never appear in this file." A key that must stay secret "belongs behind a server the app calls, not in the client."

### Variable reference

#### Backend — required for sync

| Variable | Required | Purpose | Read in |
|---|---|---|---|
| `EXPO_PUBLIC_SUPABASE_URL` | For sync | Supabase project URL | [services/supabase/index.ts](../../services/supabase/index.ts) |
| `EXPO_PUBLIC_SUPABASE_KEY` | For sync | **Publishable (anon) key** — designed to ship in client code | [services/supabase/index.ts](../../services/supabase/index.ts) |

> The app **runs without these**. `isConfigured()` returns false and sync is skipped; nothing crashes. Verified during this audit — the app started and bundled with placeholder values.
>
> `isConfigured()` also rejects the literal placeholders `your-project.supabase.co` and `your-publishable-key`, so an uncustomised `.env.local` is correctly treated as unconfigured.

**Row Level Security is what actually protects the data** — the `.env.example` notes it "has to be enabled on every table before observations sync." See [BACKEND_AND_API.md](BACKEND_AND_API.md).

#### Mock API — optional, local dev

| Variable | Required | Purpose |
|---|---|---|
| `EXPO_PUBLIC_API_URL` | Optional | Mock API base URL. Example: `http://192.168.1.10:8000` |
| `PORT` | Optional | Mock API port. Default `8000`. **Read only by the mock API server** |

> **Device gotcha:** point the phone at this machine's **LAN IP**, "NOT localhost, which on the phone means the phone."
>
> **Needs verification:** no confirmed importer of `EXPO_PUBLIC_API_URL` was found in app source during this audit.

#### LLM — optional everywhere

| Variable | Required | Purpose | Default in template |
|---|---|---|---|
| `EXPO_PUBLIC_LLM_API_KEY` | Optional | Provider auth | *(empty)* |
| `EXPO_PUBLIC_LLM_ENDPOINT` | Optional | Chat-completions URL | `https://ollama.com/v1/chat/completions` |
| `EXPO_PUBLIC_VISION_MODEL` | Optional | Quest photo review model | `gemma4:31b` |
| `EXPO_PUBLIC_DHAMMA_MODEL` | Optional | Dhamma answers/reflections model | `gpt-oss:120b-cloud` |

The degradation contract, quoted from the template:

> "Absent is a supported state everywhere. Quest review reports 'unavailable'; Dhamma falls back to deterministic retrieval, which is still grounded and still cited. **A missing key degrades an answer, it never fabricates one.**"

Use "a scoped, rotatable demo key only."

#### Harvest pipeline — optional, offline tooling

| Variable | Required | Purpose |
|---|---|---|
| `MAPILLARY_TOKEN` | Optional | Mapillary imagery — free token from their developer dashboard |
| `FLICKR_API_KEY` | Optional | Flickr imagery |

Used only by the Python scripts in [harvest/](../../harvest/), never by the app. Wikimedia geosearch needs no key, so `01_fetch_wikimedia.py` runs without either.

---

## 3. Configuration by environment

There is **no `.env.development` / `.env.production` split**. Environment differentiation happens through **EAS build profiles** ([eas.json](../../eas.json)), each declaring an `environment` and `channel`:

| Profile | environment | channel | Output |
|---|---|---|---|
| `development` | development | development | Dev client |
| `preview` | preview | preview | APK |
| `production` | production | production | AAB |

EAS environment variables are configured in the EAS dashboard, not in the repo. **Needs verification** as to which variables are set there.

---

## 4. TypeScript path aliases

```json
"paths": { "@/*": ["./*"] }
```

`@/` maps to the project root. Canonical usage:

```ts
import { colors } from '@/theme';
import { storage } from '@/services';
import { useAppState } from '@/store';
import { SiteDetailScreen } from '@/features/tirtha';
```

Enabled at runtime by `"tsconfigPaths": true` in `app.json` → `experiments`.

**Excluded from the app's typecheck:** `node_modules`, `core`, `shared`, `tools`, `mock-api`, `landing`, `scratch`. `core/` and `shared/` have their own config — see [BUILD_RUN_AND_DEPLOYMENT.md](BUILD_RUN_AND_DEPLOYMENT.md) §8.

`allowImportingTsExtensions: true` exists so app code can still follow `import ... from '@/core'` even though `core/` uses `.ts`-extension imports.

---

## 5. Expo experiments

```json
"experiments": { "typedRoutes": true, "tsconfigPaths": true }
```

**`typedRoutes` generates route types into `.expo/types/`.** Consequences:

- Route strings are type-checked — a typo is a compile error
- **After adding or renaming a route, run `npx expo start -c`** to regenerate. [features/onboarding/steps.ts](../../features/onboarding/steps.ts) carries an `as Href` cast with exactly this note
- `.expo/` is generated; never commit or hand-edit it

---

## 6. Feature flags

**No feature-flag system exists.** No LaunchDarkly, no remote config, no `flags.ts`. Behaviour varies only by:

- Env var presence (`isConfigured()`, LLM key present/absent)
- User preferences ([store/preferences.tsx](../../store/preferences.tsx))
- Platform (`.web.tsx` splits, `Platform.OS` checks)
- Permission state

---

## 7. Theme configuration

[theme/](../../theme/) is the design-token source: `colors.ts`, `fonts.ts`, `layers.ts`, `mapStyle.ts`, `radii.ts`, `spacing.ts`, `typography.ts`.

Fonts are Google Fonts packages loaded via `useAppFonts()` ([theme/fonts.ts](../../theme/fonts.ts)):
- `@expo-google-fonts/anek-devanagari` — Devanagari script
- `@expo-google-fonts/ibm-plex-sans` — UI text
- `@expo-google-fonts/ibm-plex-mono` — monospace

Native colour values also appear in `app.json` (adaptive icon `#F3E4CB`, splash `#F5F3EE`, notification `#8E7657`). **These are separate from `theme/colors.ts` and must be changed together when rebranding.**

---

## 8. Recommended `.env.local` template

Safe to copy — **contains no real values**. The canonical version with full commentary is [.env.example](../../.env.example); do not overwrite it.

```bash
# --- App backend: Supabase (required to run sync) ---
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=your-publishable-key

# --- Mock API (local dev, optional) ---
# Use this machine's LAN IP, not localhost.
EXPO_PUBLIC_API_URL=http://192.168.1.10:8000
PORT=8000

# --- Harvest pipeline (optional, Python tooling only) ---
MAPILLARY_TOKEN=
FLICKR_API_KEY=

# --- LLM (optional everywhere; absent is supported) ---
EXPO_PUBLIC_LLM_API_KEY=
EXPO_PUBLIC_LLM_ENDPOINT=https://ollama.com/v1/chat/completions
EXPO_PUBLIC_VISION_MODEL=gemma4:31b
EXPO_PUBLIC_DHAMMA_MODEL=gpt-oss:120b-cloud
```

---

## 9. Secrets that must never be committed

| Item | Where it belongs |
|---|---|
| `.env.local` | Gitignored; also excluded from EAS via `.easignore` |
| `google-play-service-account.json` | Referenced by `eas.json` submit config. **Not in the repo.** Excluded by `.easignore` |
| Supabase **service-role** key | Never in this repo, in any form |
| Android signing keystore | Managed by EAS credentials |

**Before committing, check `git status` for `.env.local` or any `*service-account*.json`.**

---

## 10. External services requiring dashboard configuration

| Service | What must be configured there |
|---|---|
| **Supabase** | Project + 8 migrations applied; RLS on every table; **Authentication → Sign In / Providers → anonymous sign-in enabled** |
| **Expo / EAS** | Project `e8454679-…`, owner `siddantasodari`; env vars per profile; build credentials |
| **Google Play** | Service account JSON for `production` submit; internal track |
| **Railway** | Mock API hosting (optional) |
| **Mapillary / Flickr** | Tokens for the harvest pipeline (optional) |
| **LLM provider** | Endpoint + key (optional) |

> **Anonymous sign-in must be enabled in Supabase** or `ensureSession()` returns `null` and warns once. That is survivable *until* migration 0007 is applied — after which anon writes are dropped and every write fails. See [BACKEND_AND_API.md](BACKEND_AND_API.md) §3.

---

## Needs verification

1. Which env vars are configured in the EAS dashboard per profile.
2. Whether `EXPO_PUBLIC_API_URL` is consumed by any app code path.
3. `.mcp.json` contents and whether they matter to anyone but local tooling.
4. Whether the Supabase project has anonymous sign-in enabled and which migrations are applied.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*
