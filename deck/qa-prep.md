# Judge Q&A

Source: 09-PITCH-AND-DEMO §4, plus the two answers 10-REVIEW §1/§3/§4 says to
have ready. Keep answers to two or three sentences; stop talking.

---

**"Isn't this just Pokémon Go with temples?"** <!-- lint-vocab:allow -->
Pokémon Go generates no artifact. This generates an aligned conservation time <!-- lint-vocab:allow -->
series with an export path to a national heritage schema. The game is the
recruitment mechanism, not the product.

**"What stops people faking reports?"**
Merit pays for completing the survey, not for finding damage — a resurvey that
finds nothing pays exactly the same. Plus corroboration thresholds, reporter
reliability from corroboration history, custodian verification, and per-vantage
rate limits.

**"Why not fine-tune the model?"**
Fine-tuning installs style, not verifiable fact, and it makes hallucination
fluent — the invented sutta comes out in perfect register. For a product whose
whole value is traceable citation, retrieval is the correct architecture. Here
are our measured numbers on both. *(Have the eval table ready.)*

**"Is a game at a sacred site disrespectful?"**
Fair question, and it drove the design. No competition, no territory, no speed <!-- lint-vocab:allow -->
leaderboards. Merit for stillness. The app silences itself inside the Sacred <!-- lint-vocab:allow -->
Garden. The mechanics are circumambulation and darśana — practices that already
exist there. And we hard-disable capture in restricted zones.

**"Who pays for it?"**
Sponsor and CSR conservation pools, tourism-board licensing, and the export
tooling as a service to heritage authorities. Not users. Never ads. *(See
business-viability.md.)*

**"What if LDT says no?"**
The monitoring data has value independent of adoption, and the same system
applies to the Kathmandu Valley monument zones, to Ramagrama, and to any site
under conservation stress. We'd rather work with them — and there's an obvious
path, since they already ship two apps.

**"Where did your images come from?"**
Mukherji's 1901 ASI report, public domain. Wikimedia Commons and Flickr under
CC. Mapillary under CC-BY-SA. Every asset is in `LICENCES.md` with source,
author and licence. We deliberately did not use Google Street View — their terms
prohibit deriving data from it, including for academic projects.

**"What did you build in 48 hours versus before?"**
Documentation, content, corpus indexing and asset harvest were prepared
beforehand; all application code was written here. **Have the git log open.**

**"Your AR isn't very accurate."**
Correct. GPS gives 3–10 m and compass heading drifts up to 45°. That's why
alignment is guided by matching a reference image rather than trusting the
sensor — the user's eyes beat the magnetometer, and the ghost overlay makes that
the primary mechanism.

---

## Two answers to have loaded (10-REVIEW)

**If a judge raises blockchain / soulbound tokens:** <!-- lint-vocab:allow -->
> "Another way to make merit non-transferable is a soulbound token. We didn't <!-- lint-vocab:allow -->
> need a blockchain — we needed a table with no spend column. Non-transferability
> is a schema decision, not a consensus mechanism."

That sentence wins the exchange. And Nepal Rastra Bank prohibits cryptocurrency
dealing — shipping a wallet in a Nepali pilgrimage app would be a compliance
problem with a demo attached.

**"Why didn't you use a Buddhist fine-tune like Karma Electric?"**
We evaluated it. `anicka/karma-electric-llama31-8b` is real and Apache-2.0 — but
it's a fine-tune (locked out by decision D5) and, decisively, it cannot cite a
source. For a product whose entire claim is verifiability, that's
disqualifying. Say it plainly; it's a strong answer.

**"Judge asks something you don't know."**
"I don't know — that's on our open questions list." Then name a real one from
01-RESEARCH-DOSSIER §10. This lands better than a guess, every time.
