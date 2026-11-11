# Launch Sākṣī on what the phone proves

Sākṣī has built nearly everything in its brief: about thirty features covering Guide, Ask and Report, a map and treks. No feature has been confirmed on a real phone, though. And the Play bundle (1.0.0, built from `e08d04d`) is missing the features that carry the brand story. Those are the Glance · Story · Scholar depth control, the Guide · Ask · Report home, the report timeline, the Sunlight theme, the 3D town, four new 3D models plus the detailed Pashupatinath rebuild, and the extra photos. They exist only in preview APKs (latest from `5c5b8b5`). The fit with what visitors need is strong in one place and partial elsewhere. **Lumbini gets about 1.1 million visits a year, about 63% of them from Nepalis, but it has no maintained guide app that explains the site.** The official app sells tickets, the one paid pilgrimage app has not been updated since September 2023, and visitors report the in-temple audio guide as broken. Sākṣī's offer is cited content, honest "Not known" states and a depth control, and that is what this gap calls for. Its weak spots are pilgrim languages other than English and Nepali, live conditions, and data checked on site. The kit below is therefore written in two stages. Every draft describes only what the 1.0 Play bundle does, and it notes which lines to add once a new production bundle is built from current source and passes a phone test. The main recommendation is to hold the public launch until that bundle exists and at least one custodian is onboarded. Marketing should start through owned and partner channels: Facebook, guides, hostels and the Lumbini Development Trust (LDT). It should follow Play's ban on superlatives and the app's own promise never to fake a measurement.

## Thirty features are built, none proven on a phone, and the brand features miss the Play bundle

The inventory of source at `5c5b8b5` (with the docs commit `beb70c2` that followed it) shows a broad, coherent product. None of it has run on a real phone. The work log says it plainly: "**Nothing here has run on a real phone.** Web can't exercise the camera, GPS, compass, Android back button or swipe gestures" (`docs/WORK_LOG.md`, Milestone 1). Every sensor-dependent path is checked only by unit tests or in a browser. That covers GPS arrival, compass and pitch alignment, the camera, the map inside the phone's WebView, offline packs in flight mode and Pro code redemption. The field checklist in `docs/APP_GUIDE.md` is entirely unchecked. It covers GPS accuracy at Maya Devi and Patan, pitch at about 0°, reaching a lock, arrival firing once, and estimated viewpoints. The automated layer is real: 162+ core tests, about 70 React tests in 16 files, three SQL test files, four Maestro flows that need a dev build, and CI in `.github/workflows/verify.yml`. It cannot stand in for a walk around the Sacred Garden.

Two corrections apply to the notes. First, migration `0013_reporter_timeline.sql` **was applied to production on 2026-11-08 and confirmed live**: authenticated users can run it and anonymous users cannot (`docs/WORK_LOG.md`, entry added in `beb70c2`). The server half of the report timeline is ready. Second, preview APKs containing the post-1.0 work exist, the latest built from `5c5b8b5`. **No production Play bundle has been built since `e08d04d`**, so the shipped Play build contains none of the post-1.0 features.

The table sorts features by the question marketing has to answer: is it in the Play bundle, and how far has it been verified?

| Feature | What the user gets | In 1.0 Play bundle? | Verification | Gap that limits the claim |
|---|---|---|---|---|
| Onboarding | Language, self-declared visitor type, start hub, permissions asked when first needed | Yes | Browser walkthrough | Nepali strings not reviewed by a native speaker |
| Map modes (standard, 3D, terrain) | MapLibre map with clustering, accuracy circle, search that ignores diacritics | Yes | Rendered in Chrome | Not checked in the phone's WebView. Basemap labels are English only |
| Satellite / hybrid | Google Map Tiles | Hidden, shown as "Coming soon" | — | Google billing prepayment not enabled |
| Offline map packs | Save a hub or trek corridor: basemap to z14, terrain to z12 | Yes (Pro, open to all) | Headless Chrome with tile hosts blocked | "Not checked: a real phone in flight mode" |
| Walking directions | Turn-by-turn from a public Valhalla server | Yes | Unit tests on route geometry | Needs a connection. English only. Public server terms |
| 74 curated site pages | Provenance, text, facts, sources, Ask, fees/hours/access, "Not known" | Yes | Some React tests, browser checks | 10 have a Commons photo. Hours known for 22 places |
| Depth control (Glance · Story · Scholar) | One remembered setting across site pages | **Preview APK only** | Code present | Curated sites only, not the 434 listed places |
| 434 listed places | Description, directions, fee by visitor type, hours, step-free access, attribution | Yes | Seed validator | 143 have photos. **Bhaktapur Durbar Square is missing.** Chitwan has 6 places |
| Entry fees | Official NTB fees for 10 sites, dated (checked 2026-11-07) | Yes | Validator warns after 6 months | Only 10 sites |
| 3D monument models | Schematic glTF, tappable features, labelled "Nothing here is measured" | Part: 9 in 1.0; the detailed Pashupatinath rebuild and the new Taleju, Kasthamandap, Basantapur and Maju Dega are preview only | Chrome render (four models) | Only heights and counts are sourced. No cultural review yet. First open needs a connection |
| 3D town | OSM buildings drawn as houses at street zoom | **Preview APK only** | Built | Frame rate on a low-end phone unknown |
| Treks (Poon Hill, Langtang, EBC) | Profile, per-day climb, acclimatisation flag, permits, safety | Yes | Data build; Kyanjin Ri corrected to 4,541 m | No day of any trek walked |
| Trek trail map | Position on the day's line, off-trail warning beyond 150 m plus GPS error | Yes | Unit tests | Never walked |
| Essentials | 1,086 open-data listings (stay, eat, health, money, transport, police) with Call and Directions | Yes | Confidence ≥0.8; blank phones set to null | Not verified on site. No opening hours |
| Ask | Hybrid retrieval, a grounding gate that refuses, sentence-level citation check, "I don't know" | Yes | 74/74 benchmark in `npm run verify` | **No LLM key in `eas.json`**, so store builds likely answer by retrieval alone, still cited |
| Reflection companion | Guided reflection chat | Yes | Unit tests | Depends on the same LLM configuration |
| Report: guided capture | Five-step vantage alignment. "Aligned" only with a live lock, otherwise "by eye" | Yes | Unit tests | Every sensor step unverified. 41 of 53 viewpoints estimated. Photography at Maya Devi and the Marker Stone awaits the site authority |
| Condition reports | Observations. What the phone cannot measure is stored as null, "Not measured" | Yes | React tests; migration 0010 live | — |
| Report timeline | Received → acknowledged → being worked on → resolved, dated, with the custodian's note, kept offline | **Preview APK only** (server side live) | Unit + SQL tests; 0013 live | **No real custodian onboarded**, so no report will yet move past "received" |
| Sunlight theme | Text at 7:1 contrast | **Preview APK only** | Contrast test | Not checked outdoors |
| Privacy export / delete | Export records. "Delete" wipes this phone and starts a new unlinked identity | Yes | Unit tests | Already-synced records stay (append-only). Export not phone-tested |
| Plans / Pro | Activation codes (NPR 1,000 / USD 20 a month) | Gating off: **everything free** | Tested end to end against production, not on a phone | Selling needs Play Billing |
| Mascots | Guide, porter, macaque, Newar woodcarver | **Preview APK only** | Untested | No cultural review |
| Nepali language | Interface through a validated literal registry | Yes (partial) | Localisation tests | Not reviewed by a native speaker. Map and directions in English |
| Quests, merit, leaderboard (legacy) | Camera tasks, points, before/after | Yes (partial) | Integrity test | Not in the brief. Values duplicated in TS and SQL |
| Custodian web portal | Staff dashboard whose actions drive the reporter timeline | Web | Route tests | No custodian onboarded. Play reviewer needs a demo login |
| Public website | EN/NE site, explorer map, APK download, live at saksi-beta.vercel.app | Deployed | Deployed | Claims must be re-checked against the shipped build |

Sources for every row: `docs/WORK_LOG.md`, `docs/APP_GUIDE.md`, `docs/PLAY-STORE-HANDOFF.md`, `docs/ai-context/KNOWN_ISSUES_AND_TECHNICAL_DEBT.md`, the seed files and the code paths named in the inventory notes.

Three things in this table shape the marketing. **The story the brand wants to tell is not yet on Play.** That story is one place, three verbs, a remembered depth setting and an honest report timeline. Screenshots of the jade Guide card or the timeline would show features that Play users cannot get. **Ask should not be sold as "AI chat."** The store build most likely answers by retrieval with no language model. That is still a cited, honest answer, and it is arguably a stronger trust pitch, but it is not what "AI guide" promises. Any LLM key placed in the build would also ship readable inside the APK (`core/dhamma/llm.ts`). **Report is two-sided, and the custodian side is empty.** The earlier design research found that FixMyStreet users whose first report was fixed were **54% more likely to report again** ([mySociety](https://www.mysociety.org/2015/03/10/local-government-you-can-shape-your-own-responsible-citizens/)), and 57% in the academic analysis of the same data ([Oxford Research Archive](https://ora.ox.ac.uk/objects/uuid:2bd169fd-0b27-46e4-8b81-1ccfccf7c55a/files/ma5b19b3d0c0005e21d0bc3e457691bf5)). A timeline that stays at "received" forever is honest, and it keeps promise 1, but promoting it before any custodian is in place spends the first impression that research says matters most.

Some debt matters at launch. Known issue C1 warns that migration 0007 can lock out all writes if anonymous sign-in is disabled, and it "needs verification against the live project" (`KNOWN_ISSUES_AND_TECHNICAL_DEBT.md`). A launch-day write outage would break Report and sync. `npm run lint:all` reports 70 errors that `verify` hides. Background arrivals may not fire because background location is blocked for Play (M10). iOS has never been verified.

## Lumbini interpretation is the gap no competitor fills

Visitor numbers point to a different first audience than the usual trekking-app pitch assumes. Nepal received **1,158,459 foreign arrivals in 2025**, about flat on 2024. India sent 292,438 of them, a quarter of the total ([Himalayan Times](https://thehimalayantimes.com/nepal/more-than-11-million-foreign-visitors-arrived-in-nepal-in-2025)). In 2024 the declared purposes were holiday 693,119, trekking and mountaineering 175,575, and pilgrimage 166,394, with pilgrimage up 25% ([MoCTCA](https://www.tourism.gov.np//files/statistics/30.pdf)). Lumbini alone counted **1,114,266 visitors in 2025**: 702,910 Nepali, 270,387 Indian and 140,969 from third countries. The third-country figure has risen almost sixfold since 2022, led by Sri Lanka, Thailand, Myanmar, China and Vietnam ([Kathmandu Post](https://kathmandupost.com/national/2026/01/05/lumbini-s-charm-pulls-pilgrims-and-visitors-from-106-countries)). Domestic travel is larger still. 52.4% of Nepali households took a domestic trip, religious trips average 2.04 days, 68.7% of trips use public transport, and Gen Z is the largest share of travellers ([Kathmandu Post](https://kathmandupost.com/money/2026/07/04/domestic-tourism-pumps-rs400-billion-into-economy-as-young-nepalis-travel-more)).

The interpretation gap at Lumbini is well documented. Reporters found "no information boards that tell the visitors about the site" ([Nepali Times](https://nepalitimes.com/lumbini-is-not-a-buddhist-disneyland)), and most Nepali visitors arrive without a guide ([Nepali Times](https://nepalitimes.com/telling-the-story-of-buddha-s-lumbini)). Only about 30% stay overnight, and the government is spending an $85M loan to change Lumbini's "hit and run" image ([Kathmandu Post](https://kathmandupost.com/money/2026/03/24/nepal-aims-to-change-lumbini-s-image-as-hit-and-run-destination-with-85m-loan)). The apps on offer do not close it. The official **Lumbini Tickets and Donation** app sells tickets and nothing else ([App Store](https://apps.apple.com/us/app/-/id6451117320)). The $4.99 **Buddha's Footsteps** app was last updated in September 2023 and lists six languages, none of them Nepali ([App Store](https://apps.apple.com/us/app/id1672903292)). One visitor review says "the audio guide inside the temple does not even work" ([Wanderlog](https://wanderlog.com/list/geoCategory/1587265/), anecdotal). Elsewhere, interpretation comes from global platforms in thin slices. VoiceMap sells one Nepal walk, "Old Kathmandu", for $3.99 ([VoiceMap](https://voicemap.me/tour/kathmandu/old-kathmandu)). Google Arts & Culture hosts web stories on Patan and the Valley, not an on-site guide ([Google Arts & Culture](https://artsandculture.google.com/story/RgUhF7YdbMPE5w)).

| Competitor | What it covers in Nepal | Price | What it lacks against Sākṣī |
|---|---|---|---|
| Maps.me / Organic Maps | Offline maps, teahouses, trail junctions ([placesnepal](https://www.placesnepal.com/blog/must-have-apps-for-trekking-in-nepal)) | Free | No interpretation, no sources, no reporting |
| Gaia GPS / AllTrails | Topo and trails ([mobilemaplets](https://mobilemaplets.pages.dev/blog/alltrails-vs-gaia-gps.html); [TechRadar](https://www.techradar.com/health-fitness/fitness-apps/alltrails-is-the-latest-app-with-an-ai-powered-subscription-tier-but-it-looks-way-more-useful-than-the-genai-from-garmin-and-strava)) | ~$36–90/yr | No heritage. Paid. Not Nepal-specific |
| Honeyguide "Trekking in Nepal" | Teahouses, altitude info. Poon Hill free, other routes paid ([kimkim](https://www.kimkim.com/c/best-apps-for-nepal); [AppAdvice](https://appadvice.com/app/trekking-in-nepal/1112263577)) | Route add-ons | No heritage. Listing looks stale (2018, 7 ratings) |
| Khumbu Map; Nepal Trekking Community | Khumbu topo; 26 treks with forums ([App Store](https://apps.apple.com/us/app/id1533033994); [App Store](https://apps.apple.com/app/id6443986636)) | IAP / tokens | iOS only, 1–2 ratings, English only, no heritage |
| VoiceMap "Old Kathmandu" | One 36-stop audio walk ([VoiceMap](https://voicemap.me/tour/kathmandu/old-kathmandu)) | $3.99 | One walk. No Lumbini, treks or Nepali |
| Google Arts & Culture | Patan, Valley stories, CyArk 3D ([Google Arts & Culture](https://artsandculture.google.com/asset/documenting-sundari-chowk-in-patan-palace-nepal/RgGNODvN4O282g)) | Free | Online only, not location-aware |
| Lumbini Tickets and Donation | Official LDT ticketing ([App Store](https://apps.apple.com/us/app/-/id6451117320)) | Free | Tickets only. A **complement**, not a rival |
| Buddha's Footsteps | Eight pilgrimage sites incl. Lumbini, some audio ([App Store](https://apps.apple.com/us/app/id1672903292)) | $4.99 | No update since Sep 2023. No Nepali |

FATMAP's shutdown is a useful contrast. Strava closed it on 1 October 2024 without migrating users' adventures, then deleted account data ([TechCrunch](https://techcrunch.com/2024/06/26/strava-to-shutter-3d-mapping-platform-fatmap-18-months-after-acquisition)). Sākṣī's promises that the phone is the source of truth and nothing is deleted answer that fear directly. Use this as a value statement, never as a dig at a competitor.

Fit by segment is uneven. The ranking below is a synthesis of the evidence, not a survey, and it scores the shipped 1.0 bundle.

| Segment | Top needs (inferred) | What Sākṣī 1.0 gives | Fit |
|---|---|---|---|
| Nepali domestic (~700k at Lumbini) | Nepali UI, NPR fees, festival timing, bus/transport, low data, self-guided interpretation | Nepali UI (unreviewed), fees by visitor type for 10 sites, offline packs, essentials incl. transport, cited site pages | **Good once Nepali is reviewed.** No festival calendar or bus info |
| Asian Buddhist pilgrims (~141k, fastest growing) | Interpretation in own language, etiquette, wayfinding across the Sacred Garden | Cited site pages and map in English/Nepali | **Weak on language**: no Sinhala, Thai, Burmese, Vietnamese or Chinese |
| Indian visitors (~270k at Lumbini) | Hindi, Lumbini/Pashupati logistics, UPI | English/Nepali. Pashupatinath described in words; its detailed 3D model is preview-only | Partial. No Hindi |
| Western heritage tourists | Fees, hours, interpretation, scam and fare awareness, offline | Dated official fees, cited pages, 3D models, offline packs | **Good** for interpretation; thin on hours (22 places) and no fare guidance |
| Trekkers (~165–175k declared) | Offline maps, permit and guide-rule clarity, neutral altitude advice, weather | Three treks with acclimatisation flags, permits, safety, trail map, offline corridors | Partial. Three treks only, no weather or live trail conditions, never walked |

Two needs Sākṣī can meet better than anyone, and both suit its honesty stance. Trek rules are contested. Guides have been mandatory for foreign trekkers since April 2023, except in the Everest region, which refused the rule ([Kathmandu Post](https://kathmandupost.com/money/2023/03/14/nepal-ends-solo-trekking-era-everest-region-is-an-exception)). A dated, sourced statement of the rule by region is valuable precisely because blogs contradict each other. The fake-rescue racket also left a trust vacuum. Police reviewed 4,782 foreign patients and confirmed 171 fake rescues worth about $20M ([Kathmandu Post](https://kathmandupost.com/money/2026/03/27/inside-nepal-s-fake-rescue-racket)). Altitude guidance from a party that earns nothing from an evacuation is a real differentiator. Whether the trek pages already state the Everest exception was not confirmed in the notes; check before claiming it. The guide rule also means Sākṣī should be marketed as **guide-friendly**, a companion and not a replacement.

## The marketing kit: claim only what the shipped bundle does

Press-kit guidance is practitioner opinion, not a standard, but it agrees on a lean, web-hosted kit plus a zip. It should have a plain-language paragraph, short founder bios and the origin story, 3–5 real screenshots, the logo in two formats, one quotable line, third-party voices and a named contact. "Reporters won't read a 12-page brand book. They want to grab 4 assets in 90 seconds and write" ([DEV Community](https://dev.to/sclaydon/how-to-get-press-coverage-for-your-startup-without-a-pr-agency-137h); [Entrepreneur](https://entrepreneur.com/growing-a-business/why-every-startup-needs-a-press-kit/242202)). For Sākṣī the kit is a `/press` page on the website plus a zip containing:

1. The fact sheet and the "does not do" box below.
2. 25- and 100-word descriptions in English and Nepali. The Nepali versions should be written or reviewed by a native speaker, since the in-app Nepali is still unreviewed.
3. Founder photo and two-sentence bios.
4. Five screenshots taken from the build being promoted.
5. The Play feature graphic.
6. The logo lockups in SVG and PNG, light and dark. A mark, lockups and generator scripts exist in the separate ~/Everest repository (commit `77e9003`). Copy them into the saksi kit only if that is the chosen mark.
7. A 30–60 second demo video.
8. Two founder quotes, plus one third-party quote (a guide, a monk or an LDT officer) only with their written permission.
9. A named contact with email and WhatsApp/Viber.

### Google Play listing assets and the rules they must pass

Google's listing rules are strict and they line up with the app's promises ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/9866151?hl=en)):

- **Short description:** 80 characters at most, stating the core purpose and what is unique. Extra keywords "don't affect ranking."
- **Banned words in the short description, feature graphic, screenshots and video:** "Best", "#1", "Top", "New", "Million Downloads", calls to action such as "Download now", and "Discount" or "Sale".
- **Icon:** 512×512 PNG, with no badges or text.
- **Feature graphic:** 1024×500 with no alpha and no device imagery, with alt text of 140 characters or fewer.
- **Screenshots:** at least 2 to publish. **At least 4 at 1080 px or higher are needed to be eligible for promotion.** They must show the real app, not hands holding devices.
- **Video:** a YouTube link that shows the real experience in the first 10 seconds. Only the first 30 seconds autoplay.

Custom store listings (up to 50, targeted by country) let a Nepal-targeted listing carry Nepali text and Nepali-interface screenshots ([Play Console](https://play.google.com/console/about/customstorelistings/)). Store listing experiments can test the feature graphic and the first screenshot with up to two variants ([Appradar](https://appradar.com/blog/app-ab-testing-with-store-listing-experiments-in-google-play)). Two limits are commonly cited but not verified from Google's page: a 30-character title and a 4,000-character full description. Also check that Nepali is offered as a listing language under "Manage translations" before planning the custom listing around it.

Visually, take the brief from the earlier design research. Use a credited real photograph of a named monument, brick and lime wash over a quiet neutral, and **no Buddha image, Swayambhu eyes, Om, mandala or prayer flags as decoration**. Campaigners hold that Buddha images "are not meant to be used for decoration... under any circumstance" ([Knowing Buddha](https://knowingbuddha.org/another-successful-cooperation-with-a-sense-of-respect/)). Nepal removed 20 Visit Nepal 2020 yeti statues after objections to their Kumari imagery ([Mark Horrell](https://www.markhorrell.com/blog/2020/much-ado-about-yetis-nepals-latest-tourism-blunder/)). Keep the mascots out of marketing until a cultural review signs them off. They are preview-only in any case.

Screenshot captions should be descriptive and feature-led. The set below matches the 1.0 bundle: "Every site names its sources", "Fees from the Nepal Tourism Board, with the date checked", "Says 'Not known' when it doesn't know", "Ask a question; each answer shows where it came from", "Three treks, day by day, with altitude", "Save a map before you lose signal", "Report what you see; unmeasured stays blank", "3D models labelled 'Nothing here is measured'". Use the offline caption only after the flight-mode phone test passes. Once a production bundle from `5c5b8b5` or later passes its phone test, add "Glance, Story or Scholar: choose your depth", "Follow your report: received, acknowledged, resolved" and "A high-contrast theme for bright sun".

### Ready-to-paste drafts

**Play title (25–29 characters; check the limit in Play Console):** `Sākṣī: Nepal Heritage & Treks` (29) or `Sākṣī: Nepal Heritage Guide` (27).

**Play short description, 80-character limit.** Use the primary draft now. The alternate names places. Use the offline variant only after the flight-mode test.

> Nepal heritage sites and treks, with answers that show their sources

(68 characters)

> Lumbini, Kathmandu Valley and three treks, with answers that show their sources

(79 characters, alternate)

> Sourced guide to Nepal heritage sites and treks, with maps you can save offline

(79 characters, only after a real phone passes the flight-mode test)

None of the three uses a ranking word, a price word or a call to action. "Kathmandu Valley" is accurate but not exhaustive, because Bhaktapur Durbar Square is missing from the places data. Do not write "every site in the Valley."

**Press-release paragraph (for the 1.0 bundle; fill the brackets).**

> KATHMANDU, [date] — Sākṣī, a free guide to Nepal's heritage sites and trekking routes, is now available for Android on Google Play. It covers 74 curated heritage sites, among them Lumbini, Nepal — the birthplace of the Buddha — and monuments of the Kathmandu Valley, along with 434 listed places, 1,086 everyday essentials such as clinics, money and transport, and three treks: Poon Hill, Langtang and Everest Base Camp. Each site page names the sources behind it, shows Nepal Tourism Board entry fees with the date they were last checked, and says "Not known" where information is missing rather than guessing. Visitors can ask questions and receive answers drawn from the app's library of sources, each tied to a citation; when the sources do not support an answer, Sākṣī says it does not know. Visitors who notice damage at a monument can file a condition report; anything the phone cannot measure is left blank instead of estimated. Sākṣī is built by [team] in [city], Nepal. "[Founder quote: one plain sentence on why honesty about sources matters at sacred sites]," said [name, role].

Once the offline phone test passes, add: "Map areas and trek routes can be saved to the phone before signal drops." Once the new bundle ships, add: "Readers choose how deep to go at each site, from a short glance to a scholar's view with sources, and anyone who files a report can follow its progress as site staff respond." Add the second half of that sentence only once a custodian is active.

**Fact sheet.**

| Item | Entry |
|---|---|
| Name | Sākṣī (साक्षी, "witness") |
| What it is | A free guide to Nepal's heritage sites and treks that shows its sources and marks what it does not know |
| Platform | Android, Google Play. iOS not available |
| Version on Play | 1.0.0 (build 4). [Update when a new bundle ships] |
| Price | Free. Every feature is open; no paid plan is on sale |
| Coverage | 74 curated sites (Lumbini, Kathmandu Valley, Pokhara, Chitwan hubs); 434 listed places; 1,086 essentials; 3 treks (Poon Hill 5 days, Langtang 6 days, Everest Base Camp 11 days); schematic 3D models of selected monuments [confirm the count in the shipped bundle] |
| Languages | English. Nepali interface [list only after native-speaker review] |
| Works without signal | Saved map areas and trek corridors [only after the phone flight-mode test]. Directions and Ask need a connection [confirm Ask's offline behaviour] |
| Data sources | Nepal Tourism Board (fees), OpenStreetMap, Wikidata, Overture Maps, Wikimedia Commons (credited photos), open AWS elevation tiles |
| Honesty rules | Unmeasured stays blank, never zero. "By eye" is never shown as measured. Answers cite sources or say "I don't know." Records are never deleted from the shared log |
| Privacy | No account needed. Export your records any time. "Delete" wipes this phone and starts a fresh, unlinked identity; reports already sent stay on the record |
| Website | saksi-beta.vercel.app [replace with production domain] |
| Contact | [name], [email], [WhatsApp/Viber] |

**"What Sākṣī does not do" box.** Put it in the press kit, on the website and near the end of the full Play description.

> **What Sākṣī does not do.** It does not replace a licensed guide; Nepal requires one for foreign trekkers in most regions. It does not issue permits or tickets, and it does not arrange rescue. It does not measure monuments: in the 3D models only overall heights and counts are sourced, and many photo viewpoints are marked "Estimated." It has not checked every listing in person — places, essentials and trek stops come from open data, and opening hours are known for only some places. It gives no live news on roads, strikes, weather or landslides. Walking directions need a connection and are in English. Satellite imagery is not available yet. It does not guide photography where a site restricts it, including Maya Devi Temple. Deleting your data in the app clears this phone; reports you have already sent stay on the shared record. Sākṣī is not on iPhone yet.

Every sentence in the box comes from the inventory. The guide-rule sentence is sourced to the [Kathmandu Post](https://kathmandupost.com/money/2023/03/04/no-more-solo-treks-guides-mandatory-from-april-1). The box turns the app's gaps into evidence of its honesty. That matters because Nepal's 2026 National Advertising Policy bans misleading ads and lets consumers claim compensation ([Kathmandu Post](https://kathmandupost.com/national/2026/07/05/nepal-brings-social-media-ai-advertising-under-new-national-policy)).

## Facebook, guides and the Lumbini Development Trust reach the real audience

Facebook is the reach channel in Nepal by a wide margin. DataReportal gives it **14.8M ad reach (50% of the population)**, Messenger 11.0M, Instagram 4.35M and Reddit only 557k ([DataReportal](https://datareportal.com/reports/digital-2026-nepal)). NapoleonCat puts Facebook higher, at about 18.4M; the methods differ ([NapoleonCat](https://stats.napoleoncat.com/social-media-users-in-nepal/2026/)). TikTok is legal. The ban was lifted in August 2024 ([Kathmandu Post](https://kathmandupost.com/national/2024/08/23/nepal-lifts-its-ban-on-tiktok)), and as a registered platform TikTok was spared the September 2025 block of 26 platforms. That block was reversed within days after protests in which at least 19 people died ([Kathmandu Post](https://kathmandupost.com/money/2025/09/10/nepal-lifts-social-media-ban-in-wake-of-deadly-crackdown-that-killed-19-protesters)). The Social Media Bill was withdrawn in February 2026 ([Lokmat/ANI](https://www.lokmattimes.com/international/nepal-government-withdraws-controversial-social-media-bill/amp)).

For a near-zero budget, rank channels as follows:

1. A Nepali-first Facebook page and posts in heritage and travel groups, with Messenger as the support line.
2. One demo video cut into TikTok, Reels and Shorts clips.
3. A Nepali press release to TechPana, GadgetByte and NepaliTelecom. Nepali tech press covers app launches such as Hajur AI and NEPA ([ShareSansar](https://www.sharesansar.com/index.php/newsdetail/new-nepali-digital-app-hajur-ai-launches-with-social-educational-and-entertainment-features-2026-03-03); [GadgetByte](https://gadgetbytenepal.com/about-gadgetbyte/)).
4. Value-first posts in English trekking and travel communities, after reading each subreddit's self-promotion rules.
5. Three to five micro-creators on barter or familiarisation-trip terms, every post disclosed in Nepali and English. Clause 9.13 of the Advertising Policy requires "mandatory self-declaration" of sponsored and influencer content ([Kathmandu Post](https://kathmandupost.com/national/2026/07/05/nepal-brings-social-media-ai-advertising-under-new-national-policy)).

The 2025 block is also the argument for owned channels. QR codes should point to the website or a UTM-tagged Play link, and the team should keep an email list and a Viber or WhatsApp broadcast, so a week-long platform outage does not silence the launch.

On the ground, partners matter more than ads. Rank them by how feasible they are for a small team:

1. **Thamel and Lumbini hostels, guesthouses and cafés:** a counter card with a QR code. This is the easiest yes.
2. **Licensed guides, reached through TAAN and NATHM training sessions.** TAAN lists 2,299 member agencies ([TAAN](https://www.taan.org.np/members?l=o)) and runs guide trainings with NTB ([Tourism Info Nepal](https://tourisminfonepal.com/?p=22608)). Pitch the app as a tool for guides, given the guide mandate.
3. **The Lumbini Development Trust**, through a formal letter and a one-page partner sheet. LDT already accepts QR-mediated tools. Saarang's QR storyboards drew about 600 scans a month, and a Trust manager called them an effective way to share credible information ([Buddha Air blog](https://www.buddhaair.com/blog/the-qr-story)). LDT also runs its own ticket app ([LDT](https://lumbinidevtrust.gov.np/en/corporate-ltd/news/details/373)). Position Sākṣī as complementary: link to LDT ticketing, offer LDT content review, and ask for a decision on exterior photography at Maya Devi, which the app is waiting for. **LDT is also the obvious first custodian**, and that turns the report timeline from a promise into a working loop.
4. **NTB:** slow. Aim for a listing in its information channels, not funding.
5. **TIA SIM counters:** high reach. Ncell and NTC sell to every arriving foreigner ([NepaliTelecom](https://www.nepalitelecom.com/ncell-tourist-sim)), but this realistically needs a personal contact.

The partner sheet should lead with what the partner gains (informed visitors, rules respected, accurate content), state that it costs them nothing, and carry a QR code. Name a source as a partner only after it agrees in writing.

## Launch in gates: build, field-test, onboard a custodian, then announce

The timing works out like this. Today is 11 November 2026, and the autumn trekking peak (October–November on the Annapurna Circuit, per the [Kathmandu Post](https://kathmandupost.com/money/2025/02/11/solo-ban-fails-to-deter-trekkers-from-annapurna-circuit)) is ending. A rushed launch now would sell the 1.0 bundle into a quiet season. The plan below spends the quiet months closing gates and then times the public announcement for the next season. Practitioners advise pitching press 4–6 weeks before the news ([DEV Community](https://dev.to/sclaydon/how-to-get-press-coverage-for-your-startup-without-a-pr-agency-137h)). Play pre-registration is useful only if the date is firm, because the campaign ends in every country if the app has not launched within 90 days ([Mobile Action](https://www.mobileaction.co/?p=15869)).

| Phase | Gate to pass | Marketing actions allowed |
|---|---|---|
| 0. Now | — | Website "what Sākṣī does" and "does not do" pages, press-kit page in draft, partner letters to LDT and TAAN. No Play promotion |
| 1. Build | Production AAB from current source (≥`5c5b8b5`); EAS env confirmed (LLM or not); C1 anonymous-auth check against live Supabase; 70 lint errors triaged | Draft screenshots from the new build |
| 2. Field test | Phone run of the APP_GUIDE field checklist at Lumbini and Patan: GPS, pitch, lock, arrival once, flight-mode offline, WebView map and 3D on a mid-range Android phone (a Redmi A-class phone; Xiaomi led Nepal's market in 2025, per [GadgetByte](https://www.gadgetbytenepal.com/xiaomi-number-1-brand-in-nepal)), Sunlight theme outdoors, privacy export | Unlock the offline claims and the "choose your depth" captions that the test confirms |
| 3. Review | Native-speaker review of Nepali; cultural review of 3D models (Pashupatinath especially) and mascots; monk or LDT review of religious copy | Nepal custom store listing; Nepali press release |
| 4. Custodian | At least one custodian (ideally LDT) active and reviewer demo login set | Report timeline in screenshots and copy |
| 5. Soft launch | Closed or open testing track; 4+ screenshots at 1080 px; Data safety form matches "delete" behaviour | Hostels, guides, owned channels with UTM links; seed honest early reviews |
| 6. Public | Vitals clean after soft launch | Press, creators, Facebook groups, short video; optional Buddha Jayanti moment for Lumbini |

Measurement needs no in-app SDK. Play Console breaks down listing visitors, conversion and installs by traffic source, country, language, custom listing and **UTM source and campaign** ([Play Console Help](https://support.google.com/googleplay/android-developer/answer/6263332)). Give every hostel card, guide sheet, LDT placement and press piece its own campaign tag. Track the following:

- conversion by custom listing (Nepal against the rest of the world)
- installs by campaign
- rating count and average, replying to every review in the reviewer's language
- uninstalls
- Android vitals
- one product signal that already lives on the server: reports filed and reports moved past "received"

Keep expectations realistic. Travel apps average about **18% day-1 and 2.8% day-30 retention** ([Business of Apps](https://www.businessofapps.com/?p=97743)) because they are used around trips. Judge per trip, not per month, and set targets only after two to four weeks of real cohorts. Prompt for in-app reviews only after a completed site visit, and never from a "Rate us" button, because the API's hidden quota can silently suppress the prompt ([Android Developers](https://developer.android.com/guide/playcore/in-app-review)). Any new telemetry must be declared in the Data safety form. And no launch claim should present an estimate as a measurement.

The pitfalls follow from the evidence above:

- **Advertising preview-only features as on Play.** Depth control, the timeline, Sunlight, the 3D town and the new models are the most tempting and the most damaging to claim early.
- **Calling Ask "AI".** It probably runs without a model in store builds. Any AI-generated imagery or voice in ads must be labelled under the 2026 policy.
- **Promising Nepali before it is reviewed**, or pilgrim languages the app lacks.
- **Promising authorities respond to reports** before a custodian exists.
- **Describing "delete" as deleting your data.** It clears the phone; synced records stay.
- **Birthplace phrasing.** Always write "Lumbini, Nepal — birthplace of the Buddha". The phrasing drew a formal Nepali protest in 2020 ([ThePrint](https://theprint.in/diplomacy/nepal-now-locks-horns-with-india-over-buddha-day-after-jaishankar-called-him-indian/478306)).
- **Sacred imagery as ornament, trend audio over sacred sites, and photos of worshippers or cremations.**
- **Faking social proof:** no invented quotes, logos or partner claims.
- **Running promotions during unrest.** Lumbini tourism dipped in the September 2025 unrest and recovered within a week ([Kathmandu Post](https://kathmandupost.com/province-no-5/2025/09/16/after-a-tense-week-lumbini-heads-for-normalcy-as-tourists-return)). Keep a pause plan.
- **Scaling on borrowed infrastructure:** the public Valhalla routing server (self-host if its terms don't allow production use) and the Google imagery key that would ship inside the APK.

The APK download on the website needs care too. Google began Android developer verification on 30 September 2026 in its first countries and will apply it to certified devices globally in 2027 ([Google support](https://support.google.com/android-developer-console/answer/16561738?hl=en)). Sign the APK from a verified account and publish its checksum.

## Conclusion

The research changes what "launch-ready" means for Sākṣī. The code is not the blocker. The blockers are three gates outside the code: a phone in a real place, a custodian on the other end of Report, and a Nepali reader checking the text. Each one unlocks a specific line of copy, which makes the launch plan double as a verification plan. The brand's strongest selling points (cited answers, "Not known" and "I don't know", "unmeasured stays blank", a timeline that never advances on its own) are also the claims that are cheapest to break by overclaiming. The kit therefore works as a contract: each sentence in it can be traced to a tested behaviour.

Two of the findings change Sākṣī's strategy. First, the largest unserved audience is not the Western trekker. It is the unguided Nepali visitor at Lumbini, followed by fast-growing Asian Buddhist pilgrims, whose languages the app does not yet offer. Nepali review and one pilgrim language would widen reach more than another trek would. Second, LDT appears in this research as a partner for distribution, for content review, as the authority on photography and as the first custodian. One well-prepared relationship could unlock all four, and it is the clearest single move to make before any public announcement.
