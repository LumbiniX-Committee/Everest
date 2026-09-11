# AGENTS.md

Instructions for AI coding agents working in this repository.

**Sākṣī** — a heritage and pilgrimage app for Lumbini, Nepal. Expo SDK 57 (managed) · React Native 0.86.2 · React 19 · TypeScript strict · Supabase.

---

## 1. Read before you work

1. **[CODEX_START_HERE.md](CODEX_START_HERE.md)** — project summary, commands, major warnings
2. The relevant documents under **[docs/ai-context/](docs/ai-context/README.md)** — start with its [README](docs/ai-context/README.md), which routes you by task
3. **[docs/ai-context/CHANGE_IMPACT_PLAYBOOK.md](docs/ai-context/CHANGE_IMPACT_PLAYBOOK.md)** before making any change
4. **[docs/ai-context/CODEX_WORKING_GUIDE.md](docs/ai-context/CODEX_WORKING_GUIDE.md)** for conventions

---

## 2. Check documentation freshness

The knowledge base was audited at commit `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1`. Run `git rev-parse HEAD`; if it differs, treat the docs as a map rather than a mirror.

**Always read a file before editing it. Source wins over documentation.**

---

## 3. Follow project conventions

- **Thin routes, fat features** — `app/` files read params and render a `features/` screen. No logic in `app/`.
- **Import via barrels and the `@/` alias** — `@/components/ui`, `@/services`, `@/store`, `@/data`. Never deep relative paths.
- **`core/` and `shared/` stay framework-free** — no React imports.
- **`services/` is the only layer touching device APIs or the network.**
- **Theme tokens only** — no hardcoded colours or magic numbers.
- **Storage keys live in `constants/storage.ts`** — never inline a key string.
- **Comments explain *why***, not what. Match the existing standard.

---

## 4. Verify affected source

Do not rely on documentation alone for anything you are changing. Read the file, trace its imports, and check consumers with `grep` before editing shared code — **there are no tests for the React layer**.

---

## 5. Run the checks

```bash
npm run verify    # typecheck + test + validate + vocab + eval:dhamma
npm run lint      # expect exactly 16 known errors in components/monk/SpeechCloud.tsx
```

`verify` excludes `lint` and does not type-check `core/` or `shared/`. Do not read a green `verify` as "everything is clean."

After a route change: `npx expo start -c` to regenerate typed routes.

---

## 6. Do not break the five promises

1. A measurement is never faked — unmeasured is `null`, **never `0`**
2. "By eye" is never dressed up as "measured"
3. The AI suggests, it never decides
4. Nothing is ever deleted
5. The phone is the source of truth

A change that weakens one of these is a defect even if every test passes.

---

## 7. Update documentation

**If your change alters documented behaviour, update the matching document in `docs/ai-context/` as part of the same change.** See [docs/ai-context/DOCUMENTATION_MAINTENANCE.md](docs/ai-context/DOCUMENTATION_MAINTENANCE.md) for which document covers what.

Stale documentation is worse than none — it sends the next agent confidently to files that no longer exist.

---

*The standalone Next.js app in [landing/](landing/) has its own `AGENTS.md`; these instructions do not apply there.*
