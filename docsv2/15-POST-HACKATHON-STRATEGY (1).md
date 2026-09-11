# 15 — POST-HACKATHON STRATEGY
### ICT Award Rising Star · what to build, what to kill, and why

**Deadline: 31 August 2026.** You have 8 days.

---

## 0. Read this part first

You asked me to criticise you if you're wrong. So here it is, directly:

**The tourism pivot would destroy the thing that won you the hackathon.**

Not weaken it. Destroy it. And I can show you exactly why with the research below.

But your underlying instinct — *"heritage conservation alone feels too small"* — is **correct and important**. You've spotted a real problem. You've just reached for the wrong solution.

The right move is not to become a tourism app. It's to **keep the moat and widen the subject matter.** There's a version of this that gets you almost everything you want, and it's stronger than what you described.

---

## 1. What actually won you LumbiniX

Be precise about this, because it determines everything else.

You did **not** win because you had a map. Every team has a map.
You did **not** win because you had a chatbot. Half the room had a chatbot.

You won because of three things nobody else had:

1. **Fixed-point rephotography** — guiding a phone to the exact position and heading of a previous photograph, so the output is an aligned time series a conservator can diff, not a pile of snapshots
2. **Citation-locked refusal** — an AI that declines rather than fabricates
3. **A closed loop to an institution** — an export format designed for the platform Nepal's heritage authorities already use

Every one of those is **hard to copy and hard to explain away**. That's a moat.

Now hold that next to the pivot.

---

## 2. Why the tourism pivot is a trap

### 2.1 The AI trip planner market is a bloodbath

I searched this properly. Here's what you'd be walking into:

**Layla** — live pricing via Skyscanner and Booking.com, bookable itineraries, PriceLock, $49/yr premium.
**Mindtrip** — an **11-million-point database**, in-chat flight booking through Sabre and PayPal launched May 2026, collaborative planning, community guides.
**Wanderlog, Wonderplan, Tripadvisor Trips, TripIt, GuideGeek, Tineo, MonkeyTravel, SearchSpot, Voyaiger, iPlan.ai, Roam Around, Ribbit, Stardrift** — and that's just the ones that appear in a single comparison article.
**Plus ChatGPT and Google Gemini**, which do this free, and Gemini pipes straight into Google Flights and Google Hotels.

Reviewers already describe this category as saturated, with the differentiator being **booking integrations and live pricing data** — both of which require commercial partnerships and inventory access you do not have and cannot get in eight days.

**The fatal problem: an LLM itinerary generator has no moat.** Any competent developer builds one in a weekend. You would be competing on the one dimension where you are weakest — data partnerships and capital — and abandoning the dimension where you are strongest.

### 2.2 The conflict of interest that kills your core product

This is the argument I most want you to sit with.

Your product's entire value proposition is **trustworthy evidence**. Your own line — the best one in your pitch — is:

> *"Technology should help preserve truth, not manufacture it."*

Now imagine you take commission from hotels near Lumbini, or promote businesses in the recommendation engine, or run sponsored placements in the chatbot.

You then walk into the Department of Archaeology and say: *"buy our conservation monitoring data, it's trustworthy."*

**Their first question will be: who pays you?**

And your answer is: hotels, restaurants, and tour operators with commercial interests at the exact sites you're monitoring. A conservation-evidence provider funded by businesses operating inside the heritage zone has a structural conflict. You cannot be both the referee and a sponsor of one team.

You'd be trading a defensible B2G/institutional business for affiliate commissions that Booking.com pays at a rate you can't negotiate.

**This isn't a minor concern. It's the difference between a company and a side project.**

### 2.3 It actively hurts your ICT Award chances

The Rising Star Innovation ICT Award is <cite index="8-1">a competitive award among tech products, industry projects, research, AI innovations, and prototype-based ideas developed by students and youth under the age of 27 studying in schools, colleges, and universities. A company registration is not required, and participants may register individually or as a group of up to four members.</cite>

The word in the category name is **Innovation**. Judges score novelty.

- "Fixed-point rephotography turning pilgrims into a conservation sensor network" → *nobody has seen this before*
- "AI trip planner with a chatbot" → *the judges have seen twenty of these*

The pivot moves you from the top of the innovation axis to the bottom.

Note also: for the 2025 cycle, <cite index="4-1">projects submitted had to be original and not affiliated with the R&D efforts of any established company</cite>. Keep your independence clean, and confirm every team member meets the age criterion before you submit.

### 2.4 One week is not a pivot window

You cannot build a credible tourism platform in eight days. You'd ship a shallow version of a category where the incumbents are deep, and lose the polish on the thing that actually works.

**Eight days is a sharpening window, not a rebuilding window.**

---

## 3. The synthesis — what to do instead

Here's the reframe that gets you most of what you want without losing the moat.

> **You are not a tourism app that also does conservation.**
> **You are a conservation-evidence network that uses tourism as its distribution channel.**

This was always the design. `00-MASTER-BRIEF.md` says it: the game is the recruitment mechanism, the monitoring is the product. Don't invert it.

### The three-layer model

| Layer | Who | What they get | Who pays |
|---|---|---|---|
| **Visitors** | Tourists, pilgrims, students | Free. Navigation, stories, AR then/now, quests, merit | Nobody. Never charge them |
| **Custodians** | Dept. of Archaeology, municipalities, LDT, trusts, monastery committees | The dashboard, coverage metrics, time series, exports | **This is your revenue** |
| **Researchers** | Universities, UNESCO/ICOMOS, conservation NGOs | Data access, API, longitudinal datasets | Licensing + grants |

Visitors are your **sensors**, not your customers. That single sentence resolves the entire strategy question.

### What this unlocks — and it's most of your list

You wanted to expand beyond Buddhist heritage. **Yes. Do that.** The mechanic is subject-agnostic:

**Tier 1 — same product, more sites (do this now):**
- Kathmandu Valley's seven monument zones — Durbar Squares of Kathmandu, Patan, Bhaktapur; Swayambhu; Boudhanath; Pashupatinath; Changu Narayan
- Janakpur, Lo Manthang, Bandipur, Gorkha Durbar, Panauti
- Traditional water systems — the *hitis* and *dhunge dharas*, which are visibly dying and almost undocumented
- Post-2015-earthquake reconstruction sites — **already legally required to be monitored**

**Tier 2 — same mechanic, different domain (the real scale story):**
- **Glacial lakes and GLOF risk** — fixed-point monitoring of retreat
- **River encroachment and sand mining** — Bagmati, Bishnumati
- **Trail and infrastructure condition** — Annapurna, Everest Base Camp trails
- **Urban tree canopy and green space loss**
- **Post-disaster damage assessment** — the same aligned-capture mechanic, applied to earthquakes and floods

**Tier 3 — international:**
Every UNESCO World Heritage property has a periodic reporting obligation and the same gap: expert missions are rare, visitors are constant. That's 1,200+ properties. **That's your billion-dollar story, and it's real** — because it's the same product, not a different one.

**Say this in the ICT Award application:** *"Lumbini is the pilot. The mechanic generalises to any place whose condition changes over time and matters to someone."*

That's a far bigger vision than an AI trip planner, and it's defensible.

---

## 4. Feature verdicts — your list, judged

### KEEP AND STRENGTHEN

| Feature | Verdict |
|---|---|
| **Fixed-point rephotography** | The moat. Everything else is negotiable |
| **Citation-locked Dhamma engine** | Second moat. See §5 for how to broaden it |
| **Condition reporting taxonomy** | Institutional credibility |
| **Custodian dashboard + export** | **This is the product you sell.** Underbuilt right now |
| **Anti-craving design** | Genuinely unique. Judges remember it |
| **Then/now AR dissolve** | Best demo moment you have |
| **Merit, non-transferable** | Structurally sound, keep exactly as designed |

### ADD (high value, low risk)

| Feature | Why |
|---|---|
| **Non-Buddhist sites** | Proves generalisation. **Add 3 in the next week** |
| **Custodian mobile view** | Let a caretaker acknowledge a report from their phone. Closes the loop visibly |
| **Multi-language visitor content** | Real accessibility for international pilgrims |
| **Public transparency page** | Anyone can see any site's condition history. Powerful for the pitch |
| **"Adopt a vantage"** | A person or school commits to resurveying one viewpoint quarterly. Cheap, and it's a retention mechanic that fits the theme |

### CUT OR DEFER

| Feature | Verdict |
|---|---|
| **AI itinerary planner** | **Cut.** Red ocean, no moat, hurts innovation score |
| **Hotel/restaurant recommendations** | **Cut.** Conflict of interest, kills institutional trust |
| **Coupons, discounts, sponsored deals** | **Cut, hard.** Directly poisons the evidence claim |
| **Freemium chat message limits** | **Cut.** Charging pilgrims for Dhamma access at Buddha's birthplace is a bad look, and it's pennies |
| **Booking integrations** | Defer indefinitely. Requires partnerships you don't have |
| **Currency conversion of merit** | Already ruled out (NRB rules + fraud incentive). Stays out |

### The one tourism feature worth keeping

**Navigation and discovery of underrated sites** — yes, keep this, but frame it correctly. It's not a tourism feature; it's **coverage acquisition**. You direct visitors to under-monitored sites because you need data there. The visitor gets a discovery; you get a resurvey. Those are the same action.

**Side quests to underrated places: keep.** Reward with merit and recognition, never discounts.

---

## 5. Should the Dhamma engine stay Buddhist?

Your instinct to broaden is right, but the *mechanism* should stay identical. Here's the reframe:

**Don't make it a general chatbot. Make it a source-grounded interpretation engine that refuses when it can't cite.**

The Buddhist canon was corpus #1. Add more corpora, same architecture:

- **Site history and archaeology** — excavation reports, UNESCO documents, ASI surveys
- **Conservation guidance** — ICOMOS charters, national heritage law
- **Hindu, Newar, Kirat, and Islamic heritage texts** for the corresponding sites
- **Oral history and intangible heritage** as you collect it

Each answer cites a real source. Each refusal is honest. **The behaviour is what's novel, not the subject.**

**On the reflection component:** keep it, but narrow it. It was always the riskiest surface, and in a broader product it becomes an odd fit. Two options:

1. **Keep it Lumbini-scoped** — a contemplative feature that lives at Buddhist sites only. Defensible, self-contained.
2. **Reframe as "reflection on place"** — questions that arise from standing where something happened, without religious framing.

Either is fine. What is *not* fine is turning it into a general-purpose life-advice AI. That was true before the pivot discussion and it's still true. Keep the distress override regardless.

---

## 6. Competitive landscape

### If you stay on conservation (recommended)

| Competitor | What they are | Your gap |
|---|---|---|
| **Arches** (Getty + World Monuments Fund) | The open-source incumbent. Enterprise, standards-based, CIDOC-CRM. Used by Historic England, LA, Antwerp, EAMENA, and DANAM in Nepal | **Professional-facing and desktop-first. No consumer capture layer.** You are the sibling, not the rival. *Feed* Arches, don't fight it |
| **Monument Monitor** (UK) | Visitors submit photos prompted by on-site signage | No game, no AR, no alignment guidance, no institutional export loop |
| **HMS Florida, CITiZAN, SCAPE** | Volunteer coastal/heritage monitoring | Recruit people who already care. You recruit the million who came anyway |
| **HEROS, commercial asset management** | Enterprise heritage asset software | Expensive, no citizen layer |

**The gap is real and stated plainly: nobody has built the consumer-facing, AR-guided, alignment-enforcing capture layer that feeds professional heritage systems.** That's your sentence.

### If you pivot to tourism

You'd be competing with Layla, Mindtrip, Wanderlog, Wonderplan, Tripadvisor, ChatGPT, and Gemini — all better funded, most with booking partnerships, several with millions of POI records. **You lose.**

---

## 7. Business model

### Revenue, ranked by realism

**1. Grants and institutional funding — start here, this is the near-term money**
Heritage-at-risk funders exist and fund exactly this: UNESCO, World Monuments Fund, Getty Foundation, ALIPH, British Council Cultural Protection Fund, embassy cultural preservation funds (the US Ambassadors Fund is active in Nepal). For a pre-revenue student team, **grant funding is realistic in a way that enterprise sales is not.**

**2. B2G / custodian licensing**
Annual licence per property or municipality for the dashboard, exports, and custodian tools. Nepal has 10 UNESCO properties and hundreds of protected monuments. Municipal heritage budgets exist. Slow procurement — but sticky once in.

**3. Institutional and research data access**
Longitudinal condition data has genuine research value. API access, licensing, co-authored datasets.

**4. Sponsor-funded dāna pools**
Corporate CSR and development banks fund *specific itemised conservation needs*. You route the allocation signal; the sponsor pays the custodian directly. **You never touch the money** — this is what keeps you clean.

**5. Deferred: international expansion licensing**
Same product, other countries' heritage agencies.

### What you never do

- Charge visitors
- Take commissions from businesses operating at monitored sites
- Sell sponsored placement in recommendations
- Run ads

**Write this into a published ethics policy.** "We do not accept money from any commercial entity operating within a site we monitor" is a *competitive advantage* in this market, not a limitation. It's the sentence that makes a government buyer trust you.

### Cost structure (a real strength — say it out loud)

Self-hosted PMTiles, static retrieval index, object storage on free tiers, on-device inference. **This runs for almost nothing.** A conservation tool with a big burn rate doesn't get adopted in Nepal. Yours does.

---

## 8. The eight-day plan

**Priority order. Do not start item 5 before item 1 is done.**

### Day 1–2 — Prove generalisation
- Add **3 non-Buddhist sites**: Patan Durbar Square, Changu Narayan, and one *hiti* (traditional water spout)
- Full seed data, vantages derived from Wikimedia/Mapillary as before, one reconstruction plate each
- **Why first:** it converts "a Lumbini app" into "a platform." That's the single biggest score change available

### Day 2–3 — Build the custodian side properly
This is your weakest surface and your actual product.
- Custodian login (simple, no complex auth)
- Mobile view: see reports for my site, acknowledge, mark in-progress, mark resolved, add a note
- Dashboard: coverage %, median time to acknowledgement, per-site trend
- Working CSV + GeoJSON export that opens in QGIS

### Day 3–4 — Broaden the Dhamma corpus
- Add site history and archaeology sources alongside the Pali canon
- Same citation validator, same refusal behaviour
- Demonstrate it answering a **non-Buddhist** heritage question with a real citation
- Re-run the eval, record the numbers

### Day 4–5 — Institutional contact (highest value per hour)
**One real conversation is worth more than any feature.**
- Email the Department of Archaeology, Lumbini Development Trust, Patan Municipality heritage section, the Kathmandu Valley Preservation Trust
- Contact **Nepal Flying Labs** — Nepali, reachable, existing DoA relationship, and they articulated your thesis before you did
- Contact **DANAM / Nepal Heritage Documentation Project** — Arches alignment is a genuine collaboration hook
- Ask for a 20-minute call, not a partnership. A screenshot of one supportive reply is a slide

### Day 5–6 — Polish and stabilise
- Fix the top bugs, not all bugs
- Seed realistic history so the dashboard isn't empty
- Test on three phones
- Make sure the then/now dissolve is bulletproof

### Day 6–7 — The application itself
- 3-minute demo video, tightly edited, phone screen mirrored
- Written submission (§9)
- Architecture diagram, eval numbers, limitations stated honestly
- Public repo, clean README, complete LICENCES.md

### Day 8 — Buffer
Something will break. Submit a day early.

---

## 9. What the ICT Award submission must say

Judges score innovation, impact, and feasibility. Structure it:

1. **The gap** — UNESCO assesses Lumbini via expert missions lasting days, every year or two. Over a million visitors pass through annually. Nobody was collecting what they could see.
2. **The innovation** — fixed-point rephotography as a consumer mechanic. Not photo upload: guided alignment producing a registered time series. **Lead with this.**
3. **The second innovation** — an AI that refuses rather than fabricates, with every claim resolving to a real source segment.
4. **Working prototype** — video proof, live URL, public repo.
5. **Validation** — you won a national hackathon judged on exactly these criteria. Say it plainly.
6. **Generalisation** — Lumbini pilot, now running on Kathmandu Valley sites, applicable to any monitored place. 1,200+ UNESCO properties have the same gap.
7. **Sustainability** — institutional licensing and grants, near-zero running cost, published no-commercial-conflict policy.
8. **Limitations, stated plainly** — this is a credibility multiplier. Compass accuracy, artistic-reconstruction labelling, canon scope, no institutional agreement yet.

**Check before submitting:** all team members under the age limit, group of up to four, no company affiliation, nomination in by 31 August.

---

## 10. The honest answer to "will we be trillionaires"

I'm not going to flatter you here, because you'd see through it.

**Realistic outcome:** a genuinely good, fundable Nepali civic-tech venture. Grants, government contracts, international heritage-body partnerships. A company that employs people and matters. That is a *very* good outcome from a student project.

**The path to something much larger** exists, but it isn't tourism. It's this: **become the standard capture layer for citizen-collected condition evidence** — heritage first, then infrastructure, environment, and disaster response. That's a horizontal platform with real network effects, because the dataset compounds and nobody else has one.

**The path to nothing** is becoming AI trip planner #47.

You have something rare: a genuinely novel mechanic, validated by a national win, in a category with no consumer-facing competitor. Very few student teams have that.

**Don't trade it for a crowded market because the crowded market looks bigger.**

---

## 11. If you disagree with me

You know things I don't — your team's appetite, local market signals, what the judges responded to in person. If you still want the tourism direction after reading this, the compromise that does least damage:

- Keep conservation as the product and the business model, unchanged
- Add **discovery and navigation** for non-heritage attractions as a *free* visitor feature, framed as coverage acquisition
- **No bookings, no commissions, no sponsored placement, no coupons** — the conflict-of-interest line is the one I'd hold under any version
- Keep the chatbot source-grounded; never let it become a general recommender

That gives visitors more reason to open the app without compromising what you sell or what makes you novel.

But my actual recommendation is the one above: **sharpen, don't widen.** Eight days, three new sites, a real custodian dashboard, one institutional conversation, and a tight submission.
