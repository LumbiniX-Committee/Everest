# Sākṣī design system

**Idea:** the witness's eye becomes a lotus cradling the rising sun. It should feel like Lumbini at first light: calm, warm, and welcoming to a first-time visitor.

Tokens live in [theme/](theme/) for the app and [landing/app/globals.css](landing/app/globals.css) for the website. Brand files and usage rules are in [brand/](brand/README.md).

## Colour

| Name | Hex | Comes from | Used for |
| --- | --- | --- | --- |
| Pond Jade | `#0E6E62` | Puskarini pond | Morning primary, brand ground |
| Marigold | `#F7A823` | Sayapatri garlands | Website actions, active tab, sun. Dusk primary is `#F7B32B` |
| Morning Mist | `#F5F8F3` | First light | Morning ground |
| Pine Ink | `#12302B` | Sal forest | Morning text |
| Himalayan Dusk | `#0B2024` | Sky after sunset | Dusk ground |
| Robe Maroon | `#8C3B3F` | Monastic robes | Website alerts and overdue states |

Prayer flag colours (`#2F6FD0`, `#FFFFFF`, `#D8412F`, `#1F9D6B`, `#F7C325`) are decoration only: the confetti and the small band. They never carry text or meaning.

**Rules**

- Name a role, never a value. Raw colours belong only in `theme/colors.ts`.
- Text on a fill uses its pair: `onPrimary`, `onAccent` or `onScrim`.
- Marigold is a fill. It fails contrast as text on a light ground.
- Captions over photographs sit on `scrim` and use `onScrim`, in both themes.
- `tests/native/theme-contrast.test.ts` holds these pairs to WCAG AA. Add a pair there when you add a combination.
- The stored theme keys stay `white` and `navy` so existing preferences keep working. Visitors see Lumbini morning and Himalayan dusk.

## Type

| Role | Face | Why |
| --- | --- | --- |
| Display (app) | Baloo 2 | Latin, IAST diacritics and Devanagari in one family. Android's per-glyph fallback in a mixed-script heading is unreliable, so the app keeps one family |
| Display (website) | Newsreader | An editorial serif, so the site reads as a well-made guide rather than an app template. Its latin-ext subset carries IAST; Devanagari headings fall through to Mukta |
| Body | Mukta | Clear at small sizes, with the same coverage |
| Measurements | IBM Plex Mono | Coordinates, bearings and timestamps only, never prose |

Devanagari needs vertical room. Keep display line height at about 1.3 or more, and never tighten letter spacing on Nepali text.

## Working rules (from the November 2026 design research)

The full report, with sources, is `reports/Sākṣī redesign design direction.md` (kept outside git). These are the rules it led to:

1. **Show where things come from.** Every sourced claim carries its source, one tap away. Unmeasured is "not recorded", never 0.
2. **Depth is one control.** Glance · Story · Scholar, one segmented control that swaps content in place and is remembered. Never nested "more" links.
3. **Honest status.** A report's timeline only moves when someone acts. "Received" until then.
4. **Sacred subjects are content, never ornament.** No Buddha images, Swayambhu eyes, Om, Kumari or prayer flags as icons, borders, loaders or decoration. The website's five-colour prayer-flag stripe was retired for this reason.
5. **Readable in sunlight.** Aim for 7:1 on primary reading text (an inference from display physics; WCAG's 4.5:1 is the floor), 48dp targets, and layouts that survive 200% text.
6. **Restraint over ornament.** Hairlines and spacing before cards; cards only for things you can tap. No identical three-card rows, no gradient blobs, no uniform fade-ins.
7. **Real, credited photographs** of the place, never stock or generated images.

**Premium layer (2026-11-08):**
- **Website:** the name set huge in Devanagari; italic serif promises; a floating frosted nav; a bento grid with one dark anchor card; a "full circle" ring diagram; a dark closing panel; a lokta-paper grain and a giant साक्षी watermark.
- **App:** Explore opens on a deep-jade Guide card with a marigold glow, live depth pills and one marigold call to action, with Ask and Report beside it. Every place page opens on its photograph, historical plate or labelled schematic, with the photo's credit.
- **Motion:** slow and once-only (float, orbit, fade-up). It always stops under reduced motion, which Reanimated respects by default in the app.

**Sunlight theme (2026-11-08):** Settings → Appearance → "High contrast for sunlight". It is the morning palette with near-black text, darker secondary text and borders, and deeper accents. `theme-contrast.test.ts` holds its primary and secondary text to 7:1 on every ground.

**Photographs:**
- **Places:** 10 sites gained a credited Commons photo (`tools/data/build-site-photos.mjs`). Matches need both a Wikidata name match and coordinates within 600 m, and each image was checked by eye; Basantapur Durbar was rejected because its match showed a neighbouring temple.
- **Treks:** each has a hand-checked photo (`data/trekPhotos.ts`).
- **Credit and offline:** the credit sits on the image itself, so when a photo cannot load offline its credit disappears with it, and the place falls back to its plate or schematic.

**Characters (2026-11-11):** four original, non-sacred mascots, drawn in `brand/mascots/*.svg` and exported to `assets/mascots/`:
- a licensed **guide**, on Explore;
- a trekking **porter** with doko and namlo, on the trek list (a porter, never "a Sherpa", which is a people);
- a **rhesus macaque**, in empty states, with no Hanuman symbols and never shown being fed or touched;
- a **Newar woodcarver** at a lattice window, beside the 3D models.

**Deities are never drawn as characters.** At Pashupatinath the deity is described in words only (`data/placeNotes.ts`), with the visitor rules. The research and sources are in `reports/Pashupati and Basantapur 3D models.md` (kept outside git).

**Open question for the owner:** the monk character (`components/monk`, the website's former hero) has the curled hair of Buddha images. The research recommends against sacred figures as mascots. It has been removed from the website hero; its use in the app needs a decision.

## Shape and motion

- Corners are soft: `sm 12`, `md 16`, `lg 22`, `xl 30`, from `theme/radii.ts`.
- Surfaces separate by tone first. Shadows belong on things that float, such as the tab bar.

## Voice

Warm, plain and honest. Invite people to look and walk, and say what is known and how. Never overclaim: the five promises in [AGENTS.md](AGENTS.md) outrank any marketing line. Tagline: "Witness Lumbini at first light."

## Avoid

- Marigold text on light grounds, or white text on marigold
- Prayer flag colours used to signal state
- Religious imagery as decoration beyond the mark and the greeting monk
