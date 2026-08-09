# Live AI demo over ngrok

*How to build a preview APK that calls your real model over a public URL, so the
AI works on the demo phone with no venue wifi, while still degrading to the
on-device engine automatically if the tunnel dies.*

This pairs with the fast-fail circuit breaker (`core/net/breaker.ts`). Without
that breaker this setup would be dangerous, because an unreachable tunnel would
stall every question for 30 seconds. With it, an unreachable tunnel costs one
short probe and then the app answers on device. Do not run this demo on a build
that predates commit `de7f2e2`.

---

## The shape of it

```
  demo phone (mobile data)
        │  https://<name>.ngrok-free.app
        ▼
     ngrok tunnel  ──────────►  your laptop:8000
                                  npm run api
                                  holds OLLAMA_API_KEY (never leaves the laptop)
```

The phone knows only the public URL. The model key stays on your laptop, exactly
as it does in development. The APK carries the ngrok URL as
`EXPO_PUBLIC_API_URL`, which is only a URL and is safe to ship.

---

## One-time setup

1. **Get an ngrok account and authtoken** (free tier is enough) from
   `dashboard.ngrok.com`. Then, once:

   ```bash
   npx ngrok config add-authtoken <YOUR_TOKEN>
   ```

   `@expo/ngrok` is already installed, but the `ngrok` CLI config lives in your
   home directory and needs the token once.

2. **Reserve a stable domain if you can.** The free tier gives a random
   `*.ngrok-free.app` name each run, which means the URL changes and you must
   rebuild. A reserved domain (paid, cheap) keeps the URL fixed so one build
   lasts. If you cannot, plan to build shortly before judging.

---

## On the day, in order

### 1. Start the API on your laptop

```bash
npm run api
```

Confirm the boot log does **not** print `OLLAMA_API_KEY unset`. If it does, your
`.env.local` is missing the key and answers will be deterministic rather than
synthesised. The key must be present for the live model demo.

### 2. Open the tunnel

```bash
npx ngrok http 8000
```

Copy the `https://<something>.ngrok-free.app` line it prints. Test it from any
browser:

```
https://<something>.ngrok-free.app/health
```

You must see `{"ok":true,"service":"saksi-mock","sites":12}`. If you do not, stop
here and fix the tunnel; nothing downstream will work.

### 3. Put the URL into the EAS build environment

The APK reads `EXPO_PUBLIC_API_URL` at build time, so it has to be set in EAS,
not only in `.env.local` (which is gitignored and never reaches the cloud build).

```bash
npx eas env:create --environment preview --name EXPO_PUBLIC_API_URL --value "https://<something>.ngrok-free.app" --visibility plaintext
```

If it already exists from a previous run, update it instead:

```bash
npx eas env:update --environment preview --name EXPO_PUBLIC_API_URL --value "https://<something>.ngrok-free.app"
```

Confirm:

```bash
npx eas env:list --environment preview
```

> Do **not** put `OLLAMA_API_KEY` into EAS. It must never be in the app. Only the
> URL goes here.

### 4. Build the preview APK

```bash
npx eas build --profile preview --platform android
```

Queue time is the risk, so start this early. Install the resulting APK on the
demo phone.

### 5. Verify on the phone before you are on stage

- Open **Dhamma**, ask one of the scripted questions. It should answer instantly
  (that one is cached either way).
- Ask something **not** scripted, for example "what did the Buddha teach about
  effort?". A live server produces a fuller synthesised answer. This is your
  proof the tunnel is being used.
- Open **Tīrtha**, tap the guide, ask "what is enshrined here?" at Maya Devi. A
  live answer is warm and specific; the offline answer is a shorter extract from
  the seed. Either is honest.
- **Kill the tunnel** (Ctrl-C on ngrok) and ask another question. After a single
  short pause the app should answer from its on-device engine with no error.
  This is worth rehearsing, because it is the most reassuring thing you can show
  a judge: the live path is a bonus, not a dependency.

---

## What to say, and what not to say

**Say:** "The AI runs live against our model over a secure tunnel, and if the
network drops it falls back to the same engine running on the phone, so the demo
cannot fail."

**Do not say** the model runs on the phone. The 484 MB local model is optional
and most likely not installed on the demo device; what runs on the phone offline
is the deterministic cited retrieval engine and the extractive guide. Both are
real and honest. Claiming on-device LLM inference when it is the retrieval engine
answering is the kind of overstatement the whole project exists to avoid.

---

## If ngrok is blocked or flaky at the venue

Fall back to the offline build with no `EXPO_PUBLIC_API_URL` set. Everything
still works: the detector, cited Dhamma answers, refusals, and the extractive
guide. You lose only the fuller synthesised prose. Rehearse both so the decision
on the day is calm.

To build the pure offline APK, clear the variable and rebuild:

```bash
npx eas env:delete --environment preview --name EXPO_PUBLIC_API_URL
npx eas build --profile preview --platform android
```
