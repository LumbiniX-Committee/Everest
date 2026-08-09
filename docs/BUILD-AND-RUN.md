# Building, running and testing Sākṣī

Everything below was verified against this repo on 2026-08-09 — the versions,
paths and account names are the real ones, not placeholders.

---

## 0. The one thing to understand first

**Expo Go will not run this app.** Not "some features degrade" — it will not
start.

Sākṣī depends on native modules that are compiled into the binary:

| Module | What it does here |
|---|---|
| `onnxruntime-react-native` | runs your trained crack detector on-device |
| `@maplibre/maplibre-react-native` | the offline map |
| `expo-camera` | capture and alignment |
| `expo-sqlite` | the observation record |
| `expo-sensors` | compass and pitch for the reticle |
| `llama.rn` | on-device language model |
| `expo-speech-recognition` | Nepali voice input |

Expo Go ships a fixed set of native modules and none of these custom ones are in
it. So you need a **development build** — your own app binary, containing your
native modules, that then loads JavaScript from Metro exactly like Expo Go does.

You build it **once**. After that, day-to-day work is just `npx expo start` and a
reload — the same fast loop. You only rebuild when native code changes: a new
native package, or an edit to `app.json` plugins.

---

## 1. Daily loop (after the build exists)

Two terminals.

```bash
# terminal 1 — the API, which is also the only path to the AI
npm run api

# terminal 2 — the bundler
npx expo start --dev-client -c
```

Open the dev-build app on the phone; it finds Metro on the LAN. Or scan the QR.

**`-c` clears the Metro cache.** Use it whenever `.env.local` changed —
`EXPO_PUBLIC_*` values are inlined into the bundle at build time, so without
`-c` you keep running the old values. This is the single most common "why is
nothing changing" cause.

### The API banner is your early-warning system

`npm run api` prints the address the phone must dial:

```
saksi mock API on http://0.0.0.0:8000  (12 sites, 6 vantages, 10 quests)
  phone → http://10.10.2.188:8000   (same wifi as this machine)
[dhamma] engine loaded ✓
```

If it instead prints a **WARN** that `EXPO_PUBLIC_API_URL` disagrees with the
machine's address, fix `.env.local` and restart Expo with `-c`. That address is
DHCP-assigned and moves whenever the machine reconnects.

**Why this matters:** `OLLAMA_API_KEY` has no `EXPO_PUBLIC_` prefix, so Expo
never inlines it into the bundle — deliberately, because it is a billable
secret. The app therefore *cannot* call the provider directly. `mock-api` is the
only route to AI. Server down or unreachable ⇒ deterministic answers, with no
error shown, because every layer falls back gracefully.

---

## 2. Building for the phone

### Option A — EAS cloud build (recommended; no local Android toolchain)

```bash
npm run build:development
```

That is `eas build --profile development --platform android`. It builds on
Expo's servers and gives you a QR code / URL to install the APK.

- Account: `aadityabro1` · project `sakshi` (`e8454679-…`) · package
  `org.lumbinix.sakshi`
- Takes roughly 10–20 minutes depending on the queue. **Start it before you need
  it** — queue time, not code, is what makes people miss a deadline.
- `patch-package` runs on the build server via `postinstall`, so the
  `onnxruntime-react-native` Gradle fix is applied there too.

Check status any time:

```bash
npx eas build:list --platform android --limit 5
```

### Option B — local build (faster iteration, needs the Android SDK)

`android/` is **gitignored** — it is generated. If it is missing:

```bash
npx expo prebuild --platform android
```

Then, with a phone connected over USB (developer mode + USB debugging on):

```bash
npx expo run:android
```

> **Gotcha specific to this machine.** `JAVA_HOME` points at **JDK 25**, which
> is newer than the Android Gradle Plugin supports. If the build dies with a
> Java/Gradle version error, point it at the JDK bundled with Android Studio
> (verified present, **JDK 21**):
>
> ```bash
> # Git Bash, this shell only
> export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr"
> npx expo run:android
> ```
>
> ```powershell
> # PowerShell, this shell only
> $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
> npx expo run:android
> ```

Confirm the phone is visible first:

```bash
adb devices     # must list a device, not "unauthorized"
```

### iOS

There is no `ios/` directory and iOS needs macOS to build locally. Use EAS:

```bash
npx eas build --profile development --platform ios
```

This needs an Apple Developer account, and the device UDID registered for an
internal-distribution build.

---

## 3. Which profile to build

From `eas.json`:

| Profile | Output | Use it for |
|---|---|---|
| `development` | dev client, internal | **Daily work.** Loads JS from Metro, so you rebuild only for native changes. |
| `preview` | standalone **APK**, internal | **The demo.** Self-contained, no laptop needed — share the APK directly. |
| `production` | **AAB**, auto-increments version | Play Store submission only. An AAB cannot be sideloaded. |

For a hackathon demo you want **`preview`**:

```bash
npx eas build --profile development --platform android   # to develop
npx eas build --profile preview     --platform android   # to demo/share
```

Do not hand a judge a `development` build — it is useless without your Metro
server running on the same network.

---

## 4. Web

Web genuinely works and is a real fallback if the phone fails on stage.

```bash
npm run web          # expo start --web
```

Static export, verified building cleanly (every route, exit 0):

```bash
npx expo export --platform web --output-dir dist
npx serve dist       # or any static host
```

### What will *not* work on web, and why

The bundle builds, but native modules have no browser equivalent:

- **The map** — MapLibre native does not render on web here.
- **Crack detection** — `onnxruntime-react-native` is a native module.
- **The on-device LLM** — `llama.rn` is native.
- **Camera capture, compass, pitch** — no sensors; alignment cannot lock.
- **Nepali voice input** — falls back to the browser API where available.

What *does* work on web: navigation, Then/Now comparison, the Dhamma surfaces
(via `mock-api`), site and quest browsing, and the whole record UI.

Treat web as **a way to show the interface**, not as the product. The product's
claims are about standing in a place with a camera.

---

## 5. Testing

### The gate — run before every commit

```bash
npm run verify
```

Chains five checks: `typecheck` → `test` (107 tests) → `validate` (seed
integrity) → `vocab` (banned-vocabulary sweep) → `eval:dhamma` (50-question
retrieval benchmark).

Five `coords still 'doc'` warnings from `validate` are known and expected.

> **Gotcha:** if `typecheck` reports errors about routes that clearly exist,
> delete the stale generated router types first:
>
> ```bash
> rm -f .expo/types/router.d.ts && npm run verify
> ```

### Strict core typecheck (not in the gate)

```bash
cd tools/test && npm run typecheck
```

Covers `core/` and `shared/` under stricter settings.

### Testing the API without a phone

```bash
curl -s -X POST http://localhost:8000/dhamma/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What are the four noble truths?","language":"en","mode":"auto"}'
```

`"tier":"full_rag"` means the provider answered. `"tier":"fallback"` or
`"cached_demo"` means it fell back to deterministic retrieval — check that
`npm run api` was used (it is the only launcher that loads `.env.local`).

### On-device checks that nothing else can catch

- **Crack detection.** Capture at a vantage → observation opens → **Scan photo
  for damage**. If that button is absent, `onnxruntime-react-native` is missing
  from the installed binary — **rebuild**; a reload cannot fix it.
- **Airplane mode.** The claim is offline-first. Turn the radios off and confirm
  Dhamma still answers and Then/Now still renders.
- **Force-quit and relaunch.** Photographs must survive; they are copied out of
  the camera cache into `documentDirectory` precisely so they do.

---

## 6. When something breaks

| Symptom | Cause | Fix |
|---|---|---|
| App won't open at all in Expo Go | Native modules absent | Build a dev client (§2) |
| "Scan photo for damage" missing | Binary predates the ONNX modules | Rebuild |
| AI answers but is never tailored | Phone cannot reach `mock-api` | Check the boot banner; fix `EXPO_PUBLIC_API_URL`; restart with `-c` |
| Env change has no effect | Value baked into the old bundle | `npx expo start -c` |
| Phone cannot reach the laptop | Different networks, or firewall | Same wifi; allow `node` inbound |
| Gradle fails on Java version | `JAVA_HOME` is JDK 25 | Point at Android Studio's JDK 21 (§2B) |
| Typecheck fails on real routes | Stale `router.d.ts` | `rm -f .expo/types/router.d.ts` |
| Map blank on web | MapLibre is native-only | Expected — use the phone |

---

## 7. Before the demo

1. `npm run verify` — green.
2. Build **`preview`** early. Queue time is the risk, not the code.
3. Install the APK on the actual demo phone and open it once.
4. Test **in airplane mode** — that is the claim being made.
5. If any part depends on `mock-api`, confirm the laptop and phone share a
   network *at the venue*, and re-check the IP in the boot banner. Venue wifi is
   where the address changes.
