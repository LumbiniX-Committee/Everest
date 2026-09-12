# Play Store launch: handoff guide

This is the practical, non-technical companion to
[DEPLOYMENT.md](DEPLOYMENT.md), written for the specific situation this
project is in: **you** hold this repo and the EAS project, and **your
friend** holds the Google Play Developer account the app will actually be
published from. DEPLOYMENT.md has the exact commands; this file has the
order to do things in, who does which part, and the actual listing content
Play Console will ask for.

Do the preview build first. Only move to production once you have tested a
real build on a real phone and are ready to hand something to your friend.

---

## Part 1 — Preview build (you, do this first)

The preview build is a plain, installable `.apk`. No Play Console, no
review, no signing ceremony. It exists so you (and anyone you send it to)
can test the exact production code paths on a real device before anything
goes anywhere near a store.

```sh
# From the repo root
eas build --profile preview --platform android
```

What happens:

- EAS builds in the cloud and gives you a download link (and a QR code) when
  it finishes, usually 10 to 20 minutes.
- The resulting `.apk` reads whichever environment variables are set on the
  `preview` EAS environment (`eas env:list preview` to check). This is
  already configured for this project: Supabase, the portal URL, and the
  cloud AI key(s).
- Install it directly on an Android phone (download the link on the phone,
  or `eas build:run` if you want it pushed to a connected device). No
  Play Store needed to install it. Android will warn about installing from
  an unknown source; that's expected for a non-Play-Store `.apk`.

**Before you call a preview build "done," actually walk through the app on
it**: open Tīrtha, take a capture in Sākṣī, ask something in Dhamma, and (if
you have a custodian account set up) open the custodian portal from
Settings. Confirm the AI answers online rather than falling back silently,
and confirm sync doesn't throw the RLS error we fixed earlier.

Send this `.apk` to your friend too, if you want him to try the app itself
before worrying about publishing it. It's the fastest way for him to see
what he's about to put his name on.

---

## Part 2 — Production build (you)

Once the preview build feels right, build the real release artifact.

**Checklist before running the build:**

- [ ] `npm run typecheck && npm run lint` both clean
- [ ] `eas env:list production` shows all four: `EXPO_PUBLIC_SUPABASE_URL`,
      `EXPO_PUBLIC_SUPABASE_KEY`, `EXPO_PUBLIC_PORTAL_URL`,
      `EXPO_PUBLIC_LLM_API_KEY`
- [ ] `git status` is clean — EAS builds whatever is actually committed,
      not your working tree
- [ ] Anonymous Sign-ins are enabled on the Supabase project (Authentication
      → Sign In / Providers), or every sync will fail with the RLS error
      from before
- [ ] Decide the real version number now. `app.json` still says `0.1.0`.
      Play accepts that, but it's the number a user will see, and changing
      it later severs OTA update continuity for anyone already on the old
      one (see DEPLOYMENT.md's Runtime Version section). Pick the number
      you actually want to launch with.

```sh
eas build --profile production --platform android
```

This produces an `.aab` (Android App Bundle), not an `.apk`. Play Store
requires the bundle format for new app submissions — this is not
interchangeable with the preview build's `.apk`.

`autoIncrement: true` in `eas.json` means EAS assigns the Android
`versionCode` itself on every production build. You don't set this by hand.

---

## Part 3 — What you send your friend

Once the production build finishes, gather these and hand them over (a
shared folder, a message, whatever's easiest):

1. **The `.aab` file itself** — the download link EAS gives you at the end
   of the build, or run `eas build:list --platform android --limit 1` to
   get it again later.
2. **Package name**: `org.lumbinix.sakshi` — he'll need to type this
   exactly when creating the app listing. It cannot be changed after the
   first upload, so double-check it matches before he creates anything.
3. **Privacy policy URL**: `https://project-saksi.vercel.app/privacy` (also
   available in Nepali at `/ne/privacy`). Play Store will not let him
   publish without this.
4. **The store listing content** — Part 5 below has all of it written out,
   ready to paste in.
5. **What data the app actually collects** — also in Part 5. He needs the
   real answer for Play's mandatory Data Safety form; guessing here is a
   compliance risk, not just an inconvenience.
6. **App icon**, if he wants it separately from what's bundled in the
   `.aab`: `assets/icon.png` in this repo.

---

## Part 4 — What your friend does (his side, in Play Console)

He does not need any credentials from you, and you don't need any from him
for a first release — see the note on `eas submit` at the end if you want
to automate this later.

1. **Play Console → Create app.**
   - App name: `Sākṣī`
   - Default language: English (US) — add Nepali as an additional language
     if he wants the listing itself localized later
   - App or game: **App**
   - Free or paid: **Free**
   - Package name: `org.lumbinix.sakshi` (must match exactly, see above)

2. **Set up the store listing** using the content in Part 5: short
   description, full description, screenshots, category, contact details.

3. **Content rating questionnaire.** Answer honestly based on what the app
   actually contains (no violence, no user-generated public content beyond
   condition reports which are reviewed by custodians, no gambling). This
   determines the age rating shown on the store page. There's no way to
   pre-fill this from outside Play Console — he has to answer it there.

4. **Data safety form.** Use Part 5's data table. Getting this right
   matters: it's a public-facing declaration Google can audit against.

5. **Upload the `.aab`** under **Testing → Internal testing → Create new
   release**. Internal testing first, not straight to production — this is
   the track that lets the two of you confirm the real signed build works
   before anyone outside sees it.

6. **Accept Play App Signing** when prompted. This is a one-time,
   first-upload-only step: Google generates and holds the final signing
   key; the key EAS used to build the `.aab` is only the upload key. Normal
   and expected, not something to be cautious about.

7. **Submit for review.** Internal testing releases usually go live within
   minutes, no Google review needed. Moving from internal testing to a
   public track (production) does trigger Google's review, which can take
   anywhere from a few hours to a few days for a first submission.

---

## Part 5 — Store listing content (ready to paste)

### Short description (max 80 characters)

```
Witness heritage. Take a photo. Build the record that gets things fixed.
```

### Full description

```
Sākṣī (साक्षी) means "witness" — someone who sees a thing directly and can
speak to it. This app takes that literally.

Stand at a heritage site, line your phone up with a fixed viewpoint, and
take a photo of what the place looks like today. Come back next month or
next year, take the photo again from the same spot, and the two pictures
line up. Over time they become a record of how a place is changing, made by
the people standing in front of it, and brought to the institution actually
responsible for the site so it can be acted on.

Sākṣī launched at Lumbini, Nepal, the birthplace of the Buddha, and now
covers three Kathmandu Valley UNESCO monument-zone sites alongside it:
Patan Durbar Square, Changu Narayan, and Manga Hiti.

THREE PLACES IN THE APP

Tīrtha (sacred place) — Explore Lumbini and the Kathmandu Valley sites on a
map, read the history of each one, and fade between an old photograph and a
new one to see what has changed. Quests point you toward whatever viewpoint
has gone longest without a fresh survey, not toward what's popular.

Sākṣī (witness) — The main loop: pick a viewpoint, line up your phone, take
the photo, and note the condition of the site. An assigned custodian
reviews and acts on what you file through an authenticated web dashboard.

Dhamma (the teaching) — Ask about Buddhist texts or heritage conservation:
UNESCO records, the ICOMOS Venice and Burra Charters, Kathmandu Valley
archaeology. Answers are backed by real, cited sources, or you get an
honest "I cannot answer that" instead of a guess.

WHAT MAKES THIS DIFFERENT

Every claim the app makes about a place is either measured directly, cited
to a real source, or clearly marked as unverified. Photographs are never
generated. Citations are never invented. The record this builds is meant to
be trusted by a conservator, not just interesting to a visitor.

Works offline. Captures and reports queue locally and sync once you're back
in range, so patchy signal at a heritage site never costs you a record.
```

### Category

Primary: **Travel & Local**
(Education is a reasonable alternate if Play Console asks for a second tag.)

### Contact details

- Email: (your friend's contact email, or a shared project email if you
  have one)
- Website: `https://project-saksi.vercel.app`
- Phone / physical address: required by Play Console for the *developer
  account* itself, not the app listing. That's a one-time setup step on
  whichever account is publishing.

### Screenshots and graphics Play Console will ask for

- App icon: 512×512 PNG (bundled in the build; `assets/icon.png` if he
  wants the source file)
- Feature graphic: 1024×500 PNG or JPG — a simple banner is enough for a
  first release; this can be a plain background with the app name if there
  isn't a designed one ready
- Phone screenshots: minimum 2, Play recommends 4 to 8. Take these from a
  real device running the preview build — Tīrtha's map, a Sākṣī capture in
  progress, and a Dhamma answer are the three that show what the app
  actually does

### Data safety form — what to declare

This must match reality, since it's what `docs/PRIVACY.md` and the app's
own `/privacy` page already promise publicly. Reference `landing/app/
[locale]/(site)/privacy/page.tsx` if there's ever doubt about the exact
wording already committed to.

| Data type | Collected? | Purpose | Shared with third parties? |
|---|---|---|---|
| Precise location | Yes | App functionality (the capture record itself) | No |
| Photos | Yes | App functionality (observations, condition reports) | No |
| Email address | Yes, only if someone signs in as a custodian | Account management | No |
| Device or other identifiers | Yes (a locally generated device id) | App functionality (attributing offline-queued records) | No |

All of the above is encrypted in transit, and the app provides an in-app
way to export or delete a person's own records (Settings → Storage). Say so
if the form asks.

---

## A note on automating future releases

This guide has you build the `.aab` and hand it over by hand every time,
which is deliberately the simplest path for a first release: no
credentials cross between your account and your friend's.

`eas.json` already has `eas submit` wired up for later, if you want it:
your friend would generate a Google Cloud **service account key** scoped to
his Play Console app (Play Console → Setup → API access), and share that
JSON file with you. Whoever holds that file can push new releases to his
account without his hands-on involvement each time — worth doing once
you're both comfortable and shipping updates often, not before. See
DEPLOYMENT.md's "Create a Google service account" section for the exact
steps if you decide to set this up.

---

## Quick reference: who does what, in order

1. **You** — preview build, test it yourself
2. **You** (optional) — send the preview `.apk` to your friend so he sees
   the app before publishing it
3. **You** — production build (`.aab`)
4. **You** — send him the `.aab`, package name, privacy policy URL, and
   this file's Part 5 content
5. **Him** — create the app in Play Console, paste in the listing content,
   answer the content rating and data safety forms
6. **Him** — upload the `.aab` to Internal Testing, accept Play App Signing
7. **Both** — test the real signed build from internal testing
8. **Him** — promote to a public track when you're both satisfied
