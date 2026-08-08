# Deployment

How a change gets from this repo onto a device. Android only for now — iOS has
never been built and has no credentials.

---

## The two release paths

Sākṣī ships through EAS. There are two distinct paths, and picking the wrong
one is the most common mistake:

| | Binary build | OTA update |
|---|---|---|
| Command | `eas build --profile production` | `eas update --channel production` |
| Carries | native code, permissions, SDK upgrades, `app.json` | JS and assets only |
| Reaches users | via Play Store review | in seconds, no review |
| Needed when | you touched anything native | you only touched JS/TS |

**Anything that changes `app.json`, adds an Expo module, or bumps the SDK needs
a binary build.** An OTA update cannot deliver native code, and shipping one
that assumes native code the installed binary lacks will crash the app on
launch.

### Runtime version

`app.json` sets `runtimeVersion.policy: "appVersion"`. An OTA update is only
delivered to installed builds whose `version` matches the one the update was
published from. So bumping `version` from `0.1.0` to `0.2.0` deliberately
severs OTA continuity: users on `0.1.0` stop receiving updates until they
install a new binary. That is the intended safety property — it stops a JS
bundle from landing on a binary it was never tested against.

---

## Environment variables

The app reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY`
(`services/supabase/index.ts`). Locally these come from `.env.local`; on EAS
they come from the environment named by the build profile.

```sh
eas env:list production          # verify before every production build
```

A production build with these unset produces an app that throws
"Supabase is not configured" the moment anything tries to sync. The build
itself succeeds — nothing catches this until runtime. Check the list.

Both are `EXPO_PUBLIC_`, so they are inlined into the JS bundle and readable by
anyone with the app. That is fine: the Supabase key is the publishable key.
Row Level Security is what actually protects the data. A service-role key must
never be added here.

---

## Play Store submission

`eas.json` has the submit profile wired, but it points at a credential file and
a Play Console app that must exist first. Three one-time steps:

### 1. Create the app in Play Console

Play's API cannot create a listing, and it rejects the first upload from any
API client. So the **first** `.aab` has to be uploaded by hand:

1. Play Console → Create app → package name `org.lumbinix.sakshi`
2. Internal testing → Create new release → upload the `.aab` from
   `eas build:list --platform android --limit 1`
3. Complete the content rating, data safety, and privacy policy forms — Play
   blocks release until all three are done

Every later submission can be automated.

### 2. Create a Google service account

1. Play Console → Setup → API access → link a Google Cloud project
2. Create a service account, grant it **Release manager** on the app
3. Google Cloud Console → that service account → Keys → Add key → JSON
4. Save the downloaded file as `google-play-service-account.json` in the repo
   root

That file is gitignored and grants release rights to the app. It is a secret —
do not commit it, and do not paste it into a chat or an issue.

### 3. Submit

```sh
eas submit --platform android --profile production --latest
```

The profile submits to the `internal` track with `releaseStatus: "draft"`, so
an accidental run cannot reach the public. Promote to production from Play
Console once the internal testers are happy.

---

## Release checklist

```sh
npm run typecheck && npm run lint     # both must be clean
eas env:list production               # both Supabase vars present
git status                            # tree clean — EAS builds committed state
eas build --platform android --profile production
```

`autoIncrement: true` with `appVersionSource: "remote"` means EAS owns the
Android `versionCode` and bumps it per build. Do not set it by hand in
`app.json` — the remote value wins and hand-edits are silently ignored.

For a JS-only fix on an already-released version:

```sh
eas update --channel production --message "what changed"
```

---

## Known gaps

- **iOS has never been built.** Needs an Apple Developer account; EAS will
  generate the distribution cert and provisioning profile on first build.
  `submit.production` has no `ios` block yet.
- **`version` is still `0.1.0`.** Play accepts it, but decide the real launch
  number before the first public track — see the runtimeVersion note above for
  what bumping it costs.
- **No development build.** EAS warns that the app is developed against Expo
  Go. Now that `expo-updates` is installed, Expo Go no longer reflects the
  production runtime; use `eas build --profile development` for a dev client.
