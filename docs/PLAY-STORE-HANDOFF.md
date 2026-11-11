# Play Store release kit: Sākṣī 1.0

Everything needed to publish the first version on Google Play, current as of 2026-11-08. The exact build commands are in [DEPLOYMENT.md](DEPLOYMENT.md); what changed and was tested is in [WORK_LOG.md](WORK_LOG.md).

## 1. Status

| Item | Status | Owner |
| --- | --- | --- |
| Code: `npm run verify` and CI green | Done | — |
| Store builds keep every feature open, with no prices or code box (Play payments policy) | Done, enforced by `tools/check-release-config.mjs` | — |
| Only the permissions the app uses: location while in use, camera | Done (`blockedPermissions` in `app.json`) | — |
| Privacy policy, with every outside service named | Done: https://saksi-beta.vercel.app/en/privacy | — |
| Data-deletion page | Done: https://saksi-beta.vercel.app/en/privacy#delete | — |
| In-app privacy link, and map and data credits | Done (Settings → About) | — |
| Feature graphic 1024 × 500 | Done: `docs/store-assets/feature-graphic.png` | — |
| App icon 512 × 512 | Done: `brand/saksi-icon-512.png` | — |
| Production app bundle (`.aab`) | Built from the release commit; see WORK_LOG | — |
| Phone screenshots (4 to 8) | **Needed**: shot list in section 6 | You |
| Google Play developer account, and creating the app | **Needed** | You |
| Contact email for the listing | **Needed**: Play shows it publicly | You |
| Test the signed build from internal testing on a real phone | **Needed**: checklist in section 7 | You |
| Decide whether to sell Pro: needs Google Play Billing, or a policy check for your market | Later; 1.0 ships with everything free | You |

## 2. Identity

- **App name:** Sākṣī
- **Package:** `com.saksinepal.saksi`. It can never change after the first upload.
- **Version:** 1.0.0. The version code is managed by EAS (`appVersionSource: remote`, `autoIncrement`).
- **Free or paid:** Free. **Ads:** none. **In-app purchases:** none.
- **Website:** https://saksi-beta.vercel.app
- **Privacy policy:** https://saksi-beta.vercel.app/en/privacy (Nepali: `/ne/privacy`)
- **Account and data deletion URL:** https://saksi-beta.vercel.app/en/privacy#delete

## 3. Store listing (ready to paste)

**Title** (30 characters at most):
```
Sākṣī: Nepal Heritage & Treks
```

**Short description** (80 characters at most):
```
Heritage sites, treks and offline maps for Nepal, with a guide at every step.
```

**Full description:**
```
Sākṣī (साक्षी) means "witness". It is a real-time guide for visitors to Nepal, foreign and Nepali alike: it shows you where things are, walks you there, explains them when you arrive, and works when the signal does not.

EXPLORE
• A clear map of Lumbini, the Kathmandu Valley, Pokhara and Chitwan, with heritage sites, temples, museums and viewpoints.
• Walking directions to any site, and the history of each place when you reach it.
• Entry fees by visitor type, from the Nepal Tourism Board, with the date they were checked.
• 3D models of monuments such as Swayambhunath and Boudhanath, clearly labelled as schematic.

TREK
• Ghorepani–Poon Hill, Langtang Valley and Everest Base Camp, day by day: distance, climb, walking time, where you sleep and how high.
• A warning on days you gain more than the usual safe height at altitude.
• A trail map that shows how far you are along today's trail, and how far and how high the next stop is.
• Places to stay at each overnight stop, with a number to call ahead.
• Permits, seasons, how to get there, and safety notes for each trek.

WORKS OFFLINE
• Save the map for a city or a trek to your phone and use it with no signal.
• Treks, site guides and listings are stored on the phone.

ESSENTIALS
• Places to stay, eat, get medical help or money, travel services and police, from open map data, each with Call, Directions and Website.

WITNESS
• Stand where a historic photograph was taken, line your phone up with the same view, and add today's picture to a record of how the place is changing over time.
• Report damage you notice, so the people who look after a site can act.

HONEST BY DESIGN
• Nothing is guessed. Unknown values say "not known". Distances, altitudes and fees name their source.
• No account, no name, no email needed. Your records stay on your phone until you choose to share them.

In English and नेपाली.
```

**Nepali listing (optional second language):**

Title:
```
साक्षी: नेपाल सम्पदा र ट्रेक
```
Short description:
```
नेपालका सम्पदा, ट्रेक र अफलाइन नक्सा, हरेक कदममा मार्गदर्शनसहित।
```
Full description:
```
साक्षी नेपाल घुम्न आउने विदेशी र नेपाली दुवैका लागि वास्तविक-समयको मार्गदर्शक हो। यसले ठाउँ कहाँ छ देखाउँछ, त्यहाँसम्म हिँडाएर पुर्‍याउँछ, पुगेपछि त्यसको इतिहास बताउँछ, र सिग्नल नहुँदा पनि काम गर्छ।

• लुम्बिनी, काठमाडौं उपत्यका, पोखरा र चितवनको स्पष्ट नक्सा, सम्पदा स्थल, मन्दिर, संग्रहालय र दृश्य बिन्दुसहित।
• घोरेपानी–पुनहिल, लाङटाङ उपत्यका र सगरमाथा आधार शिविर ट्रेक, दिनदिनैको दूरी, उकालो, हिँडाइको समय र बास बस्ने ठाउँसहित।
• सहर वा ट्रेकको नक्सा फोनमा सुरक्षित गरेर सिग्नलबिना प्रयोग गर्नुहोस्।
• बस्ने, खाने, स्वास्थ्य र पैसाका आवश्यक ठाउँ, फोन र बाटोसहित।
• ऐतिहासिक तस्बिर खिचिएकै ठाउँबाट आजको तस्बिर थपेर सम्पदाको अवस्थाको अभिलेख बनाउनुहोस्।

कुनै खाता, नाम वा इमेल चाहिँदैन। अनुमान गरिएको कुरा कहिल्यै नापिएको जस्तो देखाइँदैन।
```

**Category:** Travel & Local. **Tags:** Travel guide, Hiking, Maps.

## 4. Data safety form (must match the privacy policy)

**Does the app collect or share user data?** Yes.
**Is all data encrypted in transit?** Yes (HTTPS throughout).
**Can users request deletion?** Yes, in the app: Settings → Privacy → Delete. It deletes the phone's records and photographs and unlinks the device's anonymous identity. Reports already shared into a site's conservation record are kept, but can no longer be tied to the device. The deletion URL is above.

| Data type | Collected | Shared | Optional? | Purpose |
| --- | --- | --- | --- | --- |
| Precise location | Yes: stored with an observation the visitor chooses to share | **Yes**: the current position and destination go to the OpenStreetMap routing server (FOSSGIS) when the visitor asks for walking directions | Optional (the app works without location) | App functionality |
| Photos | Yes: observations and condition reports the visitor chooses to share | No | Optional | App functionality |
| Device or other IDs | Yes: a random device id and an anonymous account id | No | Required for sync and plans | App functionality |
| Crash logs | Yes, only if turned on in Settings | No | Optional (off by default) | Analytics: app stability |

Not collected: name, email (except invited custodian staff who sign in), phone number, contacts, messages, financial information, health data, web history, audio.

Map tiles, fonts, terrain and satellite imagery are fetched from OpenFreeMap, AWS, and Google Map Tiles once that is enabled. Those servers see the device's IP address and the area being viewed. That is ordinary content delivery, not user data the app collects, but it is named in the privacy policy.

## 5. Other Play Console declarations

- **Content rating (IARC):**
  - Category: Reference, News, or Educational, or Travel.
  - No violence, sexual content, profanity, drugs, gambling or user-to-user chat.
  - Users can share photographs and reports, but these go to invited site custodians, not to other users.
  - Answer "No" to sharing location with other users.
  - Expected rating: Everyone / PEGI 3.
- **Target audience:** 13 and over. Not designed for children, so the Families policy does not apply.
- **Ads:** No.
- **App access:** "All functionality is available without special access."
  - Settings → Custodian sign-in is for invited site staff only.
  - To let reviewers see it, create a demo custodian with `node tools/set-custodian-password.mjs` and give the email and password here. Otherwise note: "Custodian sign-in is for invited heritage-site staff. No visitor feature requires it."
- **Government app:** No. **Financial features:** None. **Health:** No. **News:** No.
- **Permissions:** location (while in use), camera, notifications. No background location, microphone or foreground services.

## 6. Screenshots: shot list

Use a real phone running the production or preview build. Portrait, 1080 × 1920 or the phone's native size. Light theme, English.

1. **Explore home:** the map preview with the "Trekking routes" and "Essentials" cards visible.
2. **Full-screen map** zoomed into Kathmandu Durbar Square, with temple names showing.
3. **Site page:** Swayambhunath or Maya Devi Temple, with fees and history.
4. **3D view** of Boudhanath.
5. **Trek page:** Everest Base Camp, with the altitude chart and the first days.
6. **Trail map:** a trek day on terrain, with the progress card.
7. **Essentials:** Stay or Health near Thamel, with Call and Directions.
8. **Guided visit:** the viewpoint screen with its steps and direction arrow, taken on site if possible.

Optionally add a caption bar to each (brand jade `#0E6E62`, white text), e.g. "Every trek, day by day" or "Works with no signal".

## 7. Before promoting to production

Test the signed build from **internal testing** on at least one mid-range Android phone:

- [ ] First run: language → visitor → start; it lands on Explore. No plan or price screen appears.
- [ ] Settings → Your plan says everything is included, with no prices.
- [ ] Map: pan and zoom, place names appear, directions to a site draw a route.
- [ ] Save a trek map, turn on flight mode, and open the trail map: the map still draws.
- [ ] Essentials: Call opens the dialler; Directions opens the map route.
- [ ] Camera: take an observation by eye; it appears in your record.
- [ ] Settings → About → "Read the privacy policy" opens the page.
- [ ] Settings → Privacy → Export works.
- [ ] Rotate, background and reopen the app, and kill it mid-capture: nothing is lost or stuck.

## 8. Order of work

1. **You:** create the Play developer account, then Create app with the identity in section 2.
2. **You:** fill in sections 3, 4 and 5 in Play Console, and upload the feature graphic, icon and screenshots.
3. **You or me:** upload the production `.aab` to **Internal testing**, and accept Play App Signing when prompted.
   - From the command line: `npx eas-cli submit --platform android --profile production` once `google-play-service-account.json` exists (Play Console → Setup → API access).
4. **You:** run the section 7 checklist on the internal build.
5. **You:** promote to Closed testing, then Production. Google's review of a first public release takes from hours to a few days.

## 9. Later, not for 1.0

- **Selling Pro:** use Google Play Billing for digital features, or confirm the user-choice billing or external-offers rules for your markets. Then turn on `EXPO_PUBLIC_PRO_GATING` for store builds and relax the release check.
- **Satellite view:** turns on by itself once the Google Cloud prepayment clears and the Map Tiles API is enabled.
- **iOS:** needs an Apple Developer account. App Store review applies the same digital-goods rule.
