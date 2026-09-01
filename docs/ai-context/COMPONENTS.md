# Components

**Audited commit:** `dbe6d45e7297c5d889be9e69c3e2e190a578e6b1` (branch `main`)
**Location:** [components/](../../components/) — 68 files across 16 subfolders, each with an `index.ts` barrel.

---

## 1. Conventions

- **Import from the barrel:** `import { Button, Card } from '@/components/ui'` — not from the file.
- **Named function exports**, never `export default` (route files are the only default exports).
- **Props types are named `<Component>Props` and exported** where non-trivial; tiny components inline the type.
- **Styling:** `StyleSheet.create` with tokens from [theme/](../../theme/) — `colors`, `spacing`, `radii`, `typography`, `layers`. **No hardcoded hex values or magic numbers.**
- **Feature-specific components** live under `features/<domain>/components/`, not here.

---

## 2. Design system — [components/ui/](../../components/ui/)

The 12 primitives every screen composes from. **Highest blast radius in the codebase — a change here can regress every screen.**

| Component | Props | Purpose |
|---|---|---|
| [Text](../../components/ui/Text.tsx) | `RNTextProps & { variant?: TypographyVariant; tone?: ToneName; uppercase?; center? }` | **Use instead of RN `Text` everywhere.** Applies typography + tone tokens |
| [Button](../../components/ui/Button.tsx) | `{ label; onPress?; variant?: ButtonVariant; disabled?; loading?; block?; style?; accessibilityHint?; icon?: IconName }` | Has a built-in `loading` state; `icon` draws an optional leading glyph via `Icon` |
| [Screen](../../components/ui/Screen.tsx) | `{ children; scroll?; bleed?; edges?: readonly Edge[]; style?; contentStyle? }` | **Screen wrapper** — safe-area + scroll. `bleed` for edge-to-edge (camera, map) |
| [Card](../../components/ui/Card.tsx) | `{ children; onPress?; style?; accessibilityLabel? }` | Surface container; pressable when `onPress` given |
| [Chip](../../components/ui/Chip.tsx) | `{ label; selected?; onPress?; disabled?; style? }` | Filter/selection pill |
| [Icon](../../components/ui/Icon.tsx) | `{ name; size? = 22; color? = colors.primary; style? }` | **The single icon surface** — wraps `@expo/vector-icons`. Default tint is the navy/teal palette's primary teal (was `sandstoneDeep` before the navy/teal redesign) |
| [MetaRow](../../components/ui/MetaRow.tsx) | `{ label; value; mono? = true; tone? = 'primary' }` | Label/value row. **Monospace by default** — for measurements |
| [Badge](../../components/ui/Badge.tsx) | `ConditionBadge({ status: ConditionStatus })`, `SourceBadge({ tier: SourceTier })` | **Two domain-typed exports**, not a generic badge |
| [Divider](../../components/ui/Divider.tsx) | `{ inset? }` | Separator |
| [BottomSheet](../../components/ui/BottomSheet.tsx) | `BottomSheetProps` | Modal sheet; uses safe-area insets |
| [ProgressIndicator](../../components/ui/ProgressIndicator.tsx) | `ProgressIndicatorProps` | Step progress (onboarding) |
| [ProgressRing](../../components/ui/ProgressRing.tsx) | `ProgressRingProps` | Circular progress (quests, merit) |

### Notes that matter

**`Badge` is domain-typed, not generic.** It exports `ConditionBadge` (takes `ConditionStatus`) and `SourceBadge` (takes `SourceTier`) — both bound to real domain enums, so an invalid state is a compile error. Do not replace with a stringly-typed badge.

**`MetaRow` defaults to monospace** (`mono = true`) because it displays measurements — bearings, distances, error margins. Monospace keeps digits aligned so a reader can compare rows. Keep the default.

**`Icon` centralises the icon set.** [constants/app.ts](../../constants/app.ts) explains why icons replaced emoji:

> "Emoji are drawn by the system emoji font, arrive pre-coloured, cannot be tinted to match a selected tab, and are a different drawing on every vendor's phone. The names below are typed against the glyph map at the call site, so a mistyped one is a compile error rather than a missing tab."

**`Text` should always be preferred over React Native's `Text`** — it is the only place typography and tone tokens are applied.

### Colour themes

[theme/colors.ts](../../theme/colors.ts) defines matching `navyColors` and
`whiteColors` semantic palettes. Components continue to consume `colors`; the
root [index.tsx](../../index.tsx) selects that stable object's initial values
before Expo Router loads. The Appearance toggle lives in
[features/settings/SettingsScreen.tsx](../../features/settings/SettingsScreen.tsx)
and performs a persisted app reload because most component styles are static.

---

## 3. Shared state components — [components/common/](../../components/common/)

| Component | Purpose |
|---|---|
| [LoadingState](../../components/common/LoadingState.tsx) | Loading placeholder |
| [EmptyState](../../components/common/EmptyState.tsx) | Nothing-to-show |
| [ErrorState](../../components/common/ErrorState.tsx) | Failure + retry |
| [OfflineBanner](../../components/common/OfflineBanner.tsx) | Offline indicator |
| [ScreenHeader](../../components/common/ScreenHeader.tsx) | Title + back (uses `expo-router`) |
| [SettingsButton](../../components/common/SettingsButton.tsx) | Header control → settings stack |

**These four states are the project's standard vocabulary.** [features/leaderboard/LeaderboardScreen.tsx](../../features/leaderboard/LeaderboardScreen.tsx) is the reference implementation using all of them.

`SettingsButton` is how settings is reached **without** being a tab — it appears in each surface's header.

---

## 4. Feature-support components

Grouped by domain. Not part of the design system, but shared across screens within (and sometimes between) features.

### Map — [components/map/](../../components/map/)
| Component | Notes |
|---|---|
| [SiteMap3D](../../components/map/SiteMap3D.tsx) + [.web.tsx](../../components/map/SiteMap3D.web.tsx) | MapLibre 3D map. **Platform-split** |
| [MapWebView](../../components/map/MapWebView.tsx) + [.web.tsx](../../components/map/MapWebView.web.tsx) | `react-native-webview` map. **Platform-split** |
| [SitePlan](../../components/map/SitePlan.tsx) | Site plan overlay |
| [mapHtml.ts](../../components/map/mapHtml.ts) | HTML string for the webview map |

### Capture / alignment — [components/reticle/](../../components/reticle/)
`Reticle` (Reanimated), `AlignmentReadout`, `CompassCalibrationPrompt` — the viewfinder overlay for [CaptureScreen](../../features/sakshi/CaptureScreen.tsx).

### Observation — [components/observation/](../../components/observation/)
`ConditionSheet` (report entry), `PathologySummaryCard`, `YoloVisionOverlay` (draws detector candidates).

### Chat / sources — [components/chat/](../../components/chat/), [components/source/](../../components/source/)
`ChatBubble`, `ChatComposer`, `ChatTranscript`, `SourceList` | `Citation`, `SourceCard`, `SourceDetailSheet`.

These implement the citation UI that makes Dhamma answers checkable.

### Then/Now — [components/thennow/](../../components/thennow/), [series/](../../components/series/), [timeline/](../../components/timeline/)
`ThenNowCompare`, `EvidenceTierLabel`, `TimeSeriesScrubber`, `Timeline`. `ThenNowCompare` is also reused by `CaptureScreen` for the pre-submission frame review.

**`EvidenceTierLabel` is load-bearing for honesty** — it is how "a viewer can always tell a photograph from a reconstruction" (Charter #6).

### Site — [components/site/](../../components/site/)
`SiteListItem`, `VantageListItem`, `SiteVisual`, `NarrationPlayer` (`expo-audio`).

### Practice / arrival / voice — [components/practice/](../../components/practice/), [arrival/](../../components/arrival/), [voice/](../../components/voice/)
`MeritAcknowledgement`, `PracticeSummaryCard` | `ArrivalWisdom` | `SpeakButton` (`expo-speech`).

### Navigation — [components/navigation/](../../components/navigation/)
[SurfaceTabBar](../../components/navigation/SurfaceTabBar.tsx) — the **custom tab bar** passed to `<Tabs tabBar={...}>` in [app/(main)/_layout.tsx](<../../app/(main)/_layout.tsx>). Renders the three surfaces from `SURFACES` / `SURFACE_LABELS` / `SURFACE_ICONS`.

### Monk — [components/monk/](../../components/monk/)
`GreetingMonk` (11-frame `.webp` animation from [assets/monk/](../../assets/monk/)), `SpeechCloud`.

> ⚠️ **[SpeechCloud.tsx](../../components/monk/SpeechCloud.tsx) contains all 16 lint errors in the project** — 15 × `react-hooks/refs`, 1 × `react-hooks/set-state-in-effect`, from calling `.interpolate()` on an `Animated.Value` held in a ref during render. See [KNOWN_ISSUES_AND_TECHNICAL_DEBT.md](KNOWN_ISSUES_AND_TECHNICAL_DEBT.md).

---

## 5. The platform-split pattern

Metro resolves `.web.tsx` automatically on web. Import normally:

```tsx
import { SiteMap3D } from '@/components/map';   // → .web.tsx on web, .tsx on native
```

Used for MapLibre and WebView, which have no direct web equivalent. [eslint.config.js](../../eslint.config.js) restores the platform extension list to the import resolver specifically so lint agrees with the bundler.

**Add a `.web.tsx` when a component depends on a native-only module.**

---

## 6. Animation stack

| Library | Used in |
|---|---|
| `react-native-reanimated` 4.5.1 | `Reticle`, `OnboardingFrame`, `AlignmentRehearsal` |
| `react-native-worklets` 0.10.1 | Reanimated dependency |
| `react-native-gesture-handler` | Root wrapper, `AlignmentRehearsal` |
| RN `Animated` | `SpeechCloud` ⚠️ (the lint-error source) |

> **Two animation systems coexist.** New animation work should use Reanimated, consistent with the newer components.

---

## 7. Accessibility

Present but not systematic:
- `Card` takes `accessibilityLabel`; `Button` takes `accessibilityHint`
- `Screen` handles safe-area insets

**Not verified:** screen-reader labelling coverage, focus order, contrast ratios, dynamic type. No accessibility tests exist. **Needs verification.**

---

## 8. Extending safely

| Task | Where |
|---|---|
| New design-system primitive | `components/ui/` + export from its `index.ts`. **Check every screen** |
| New feature-shared component | The matching `components/<domain>/` folder |
| Component used by one feature only | `features/<domain>/components/` |
| New icon | Use `Icon` with a valid glyph name — never raw `@expo/vector-icons` |
| New colour/spacing | Add a token to `theme/`, never a literal |

### Before changing anything in `components/ui/`

1. Grep for the component name across `app/`, `features/`, `components/`
2. Run `npm run typecheck`
3. Run `npm run lint` (expect the 16 pre-existing `SpeechCloud` errors, nothing new)
4. Smoke-test at least one screen per surface — **there are no component tests to catch a regression**

---

## Needs verification

1. Complete per-component consumer lists (import graph not fully traced).
2. Full prop types for `BottomSheet`, `ProgressIndicator`, `ProgressRing`.
3. Accessibility coverage across all 68 components.
4. Whether any component is unused/dead.
5. What differs between the native and `.web.tsx` map implementations.

---

*Part of the [docs/ai-context](README.md) knowledge base. Snapshot of commit `dbe6d45e`; verify against current source before relying on details.*
