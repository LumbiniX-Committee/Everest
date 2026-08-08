# Fonts

Empty on purpose. Font files are licensed artefacts and get committed
deliberately, not fetched by a tool.

Sākṣī expects three families:

| Role | Family | Used for |
| --- | --- | --- |
| display | Anek Devanagari | Headings, site names, Nepali text |
| body | IBM Plex Sans | UI, prose, navigation, buttons |
| mono | IBM Plex Mono | Coordinates, bearings, distances, timestamps |

All three are Open Font License and available from Google Fonts.

To enable them:

1. Drop the `.ttf` files here using the exact names listed in `theme/fonts.ts`.
2. Uncomment the entries in `fontAssets` in that file.
3. Nothing else — every component already resolves through those keys.

Until then `theme/typography.ts` falls back to the platform default, which is
the intended behaviour and not a bug.
