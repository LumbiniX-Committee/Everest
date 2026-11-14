# Operations checklist: services, accounts and licences

What Sākṣī depends on outside the code, who owns each piece, and what is still
to do before real visitors use it at Swayambhu, Lumbini and Basantapur.
Checked 2026-11-13 against the repository and live services. Owner of every
account below: **O.M.X Lab Private Limited** (Sākṣī is its product).

| Service | What it does for Sākṣī | State today | Still to do (who) |
| --- | --- | --- | --- |
| **Domain** `omxlab.com.np` | Company site and email | **Not working**: no name servers, does not resolve | Register/renew the `.com.np` domain (register.com.np, with the company registration), add DNS. Point a `saksi.` subdomain or the apex at Vercel. (You) |
| **Mail** `hello@omxlab.com.np` | Contact address shown on the website footer, privacy page and in-app About O.M.X Lab | **Cannot receive mail**: no MX records | Set up mail (Zoho Mail free tier or Google Workspace), add MX, SPF, DKIM and DMARC records. Until then the published address bounces. (You) |
| **Vercel** project `saksi` | Website, model and walker files, `/app/android.json` for update checks | Live at saksi-beta.vercel.app; deploys on every push to `main` | Add the custom domain once DNS exists; keep `main` the only branch that deploys. (Claude can do with the token) |
| **Supabase** project `xvahqoivcmfiasffuufr` | Sync of records, custodian portal, auth for staff | Live; migrations applied through the Management API | Production database changes need explicit approval each time. Move the project under an O.M.X Lab-owned organisation if it is in a personal one. (You decide) |
| **Expo / EAS** account `saksi-nepal` | Builds (APK, AAB), over-the-air updates (channel `preview`, runtime 1.0.0) | Working; updates published today | Transfer the Expo account/organisation to O.M.X Lab ownership. A new APK is needed only when native code or the runtime changes; publish the new runtime in `landing/public/app/android.json` so the in-app banner offers it. |
| **Expo Go** | — | **Not usable**: the app uses native modules (MapLibre Native, sensors, SQLite) that Expo Go does not contain | Test with the preview APK or a development build (`eas build --profile development`). |
| **Google Play** | Android release, package `com.saksinepal.saksi` | Release kit ready (`docs/PLAY-STORE-HANDOFF.md`); `eas submit` targets the internal track as a draft | Create the Play developer account **as O.M.X Lab** (organisation account needs a D-U-N-S number), create the app, add 4–8 screenshots, set the contact email (after mail works), upload `google-play-service-account.json` (never commit it), test the internal build on a phone. (You) |
| **Apple App Store** | iOS release, bundle `com.saksinepal.saksi` | **Not started**: no Apple Developer account, no iOS build or submit profile | Enrol O.M.X Lab in the Apple Developer Program (organisation, D-U-N-S), then `eas build -p ios` and an App Store Connect record. iOS needs its own privacy labels and screenshots. (You, then Claude) |
| **Google Maps Platform** | Satellite/hybrid imagery on the map (`services/imagery`, `EXPO_PUBLIC_GOOGLE_MAPS_KEY`) | Key set locally | Restrict the key to the Android package and signing SHA-1 and to the Map Tiles API; set a budget alert; make sure the billing account is the company's. Google's terms require their logo/attribution when imagery is shown (already handled by the credit line). |
| **AI** | Dhamma answers and quest review: on-device engine first; optional LLM through `EXPO_PUBLIC_LLM_ENDPOINT` / `EXPO_PUBLIC_LLM_API_KEY` | No LLM endpoint configured: the app runs fully on its deterministic engine (74/74 benchmark) | If a hosted model is wanted, put it behind a server route (Vercel function) so no API key ships inside the app; name the provider in the privacy policy before turning it on. (Decide) |
| **Claude Code** | Development only | — | Nothing ships in the app. Keep tokens in `.env.tools.local` (git-ignored). |
| **GitHub** `siddantasodari4-eng/saksi` | Source, CI | Personal account | Move the repository to an O.M.X Lab organisation; the website footer's "Source code" link then needs updating. |

## Licensing and ownership

- **Code:** Apache-2.0. **Content and data:** CC BY 4.0, plus ODbL for
  OpenStreetMap-derived coordinates. Copyright line: "O.M.X Lab Private
  Limited and the Sākṣī contributors" (`NOTICE`, `LICENSE-CONTENT`).
- **Making O.M.X Lab the sole copyright holder** needs a short written
  assignment (or contributor licence agreement) from each other contributor:
  Aaditya Sapkota, Nabin Paudel, Binayak Gautam. Until then their work stays
  credited to them under the same licences. Once signed, change both files
  to "O.M.X Lab Private Limited".
- **Name and marks:** "Sākṣī" and the O.M.X Lab logo are not licensed with
  the code. Consider trademark registration in Nepal (Department of
  Industry) for both.
- **3D models:**
  - Our own Blender models (`tools/models/blender/`) and OMX Lab's own
    materials, textures and notes: O.M.X Lab's.
  - Sketchfab scans on the map: CC BY 4.0, credited per creator in
    `LICENCES.md` and on the map.
  - Sketchfab scans shown only in Sketchfab's player: not copied; credited.
  - Any model built from someone else's capture needs that creator's written
    permission before it is published, and their credit beside ours
    (see `LICENCES.md`).
- **Images and panoramas:** only CC0 / CC BY / CC BY-SA / public domain from
  Wikimedia Commons, credited per file. Commercial libraries (e.g.
  360cities.net) need a paid licence first.
