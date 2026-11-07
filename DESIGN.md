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
| Display | Baloo 2 | Warm and rounded, with Latin, IAST diacritics and Devanagari in one family |
| Body | Mukta | Clear at small sizes, with the same coverage |
| Measurements | IBM Plex Mono | Coordinates, bearings and timestamps only, never prose |

Devanagari needs vertical room. Keep display line height at about 1.3 or more, and never tighten letter spacing on Nepali text.

## Shape and motion

- Corners are soft: `sm 12`, `md 16`, `lg 22`, `xl 30`, from `theme/radii.ts`.
- Surfaces separate by tone first. Shadows belong on things that float, such as the tab bar.

## Voice

Warm, plain and honest. Invite people to look and walk, and say what is known and how. Never overclaim: the five promises in [AGENTS.md](AGENTS.md) outrank any marketing line. Tagline: "Witness Lumbini at first light."

## Avoid

- Marigold text on light grounds, or white text on marigold
- Prayer flag colours used to signal state
- Religious imagery as decoration beyond the mark and the greeting monk
