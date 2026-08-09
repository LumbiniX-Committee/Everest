# Fonts

Empty on purpose — but no longer because the fonts are missing.

Sākṣī's three families now ship as npm packages rather than as loose `.ttf`
files in this directory:

| Role | Family | Package | Used for |
| --- | --- | --- | --- |
| display | Anek Devanagari | `@expo-google-fonts/anek-devanagari` | Headings, site names, Devanagari |
| body | IBM Plex Sans | `@expo-google-fonts/ibm-plex-sans` | UI, prose, navigation, buttons |
| mono | IBM Plex Mono | `@expo-google-fonts/ibm-plex-mono` | Coordinates, bearings, distances, timestamps |

All three are Open Font License; each package carries its own `LICENSE_FONT`.

They are **static instances**, not variable fonts. That is the reason for the
packages: the variable builds Google serves from its web endpoint carry weight as
an axis, and React Native cannot vary an axis — it would render one weight for
all three.

Registration lives in `theme/fonts.ts`, keyed by the family names
`theme/typography.ts` resolves through. Add a weight there, not here.

Put a file in this directory only if a family arrives from somewhere other than
Google Fonts — a commissioned Devanagari face, say. Then register it alongside
the others in `theme/fonts.ts`.
