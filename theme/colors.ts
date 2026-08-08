/**
 * Sākṣī colour tokens.
 *
 * The palette is the whitewashed temple under Terai daylight — the lime render
 * of the Maya Devi shrine, Chunar sandstone, weathered Mauryan brick, and the
 * still water of the Puskarini.
 *
 * Never hardcode a hex value in a component. Import from `@/theme`.
 *
 * ── A note on the direction of this palette ────────────────────────────────
 *
 * 07-DESIGN-SYSTEM §1 argues for a dark interface, and the argument is
 * functional rather than decorative: the witness screen is a live viewfinder in
 * bright Terai sunlight, and a light UI washes out the overlay a person is
 * trying to judge alignment against.
 *
 * That reasoning is sound, and it is about *one surface*. It does not extend to
 * Tīrtha's lists, Settings, Chaityāvalī or Dhamma, which are read in the same
 * daylight as any other document. This palette is light because the app is
 * mostly a document; if the viewfinder proves to wash out on site, the fix is
 * to darken the capture surface specifically rather than the whole app.
 *
 * Two naming layers are exported: spec names (`ground`, `sand`, `lock`) and the
 * legacy role names every component actually uses. Values move together.
 */

// ── Ground: the whitewashed shrine ──────────────────────────────────────────
const ground = '#F5F3EE'; // lime render, barely warm — the page
const ground2 = '#FFFFFF'; // raised surfaces, cards, sheets
const ground3 = '#E8E5DD'; // recessed, pressed, inactive
const line = '#D6D1C6'; // hairlines, dividers, field outlines

// ── Sandstone: the pillar's own colour ──────────────────────────────────────
const sand = '#B79B72'; // fills and large areas, 2.38:1
const sand_dim = '#8E7657'; // accent text and pressed states, 3.88:1
const sand_faint = '#6E7069'; // tertiary text — 4.53:1, clears AA for body

// ── Structure ───────────────────────────────────────────────────────────────
const brick = '#8A5A45'; // weathered Mauryan brick
const ink = '#252A27'; // primary text, 13.16:1
const ink_soft = '#5A5C56'; // secondary text, 6.11:1

/**
 * Signal colours, darkened for a light ground.
 *
 * The spec's values were tuned against near-black. Carried across unchanged,
 * `seek` measured 2.03:1 here — an amber that cannot be seen is not a signal.
 * Each of these now clears 3:1 against the ground, so a state reads as a state.
 */
const lock = '#3E7CC4'; // alignment achieved. Lapis. Appears nowhere else. 3.88:1
const seek = '#A9761D'; // alignment in progress, amber. 3.58:1
const change = '#A8443A'; // detected change / open condition. 5.33:1
const resolvedGreen = '#477052'; // acknowledged / resolved. 5.11:1

/**
 * Map terrain.
 *
 * A vocabulary of its own, so the map never borrows a semantic token. Water in
 * particular must never be `lock`: that lapis means "you are standing in the
 * right place" and spending it on a pond destroys the one signal the witness
 * view depends on.
 *
 * Terrain sits deliberately low against the ground — present, but never
 * competing with the monuments, which are the content.
 */
const map_water = '#A9C4CC'; // still water of the Puskarini, 1.65:1
const map_vegetation = '#CBD7BE'; // the sal grove, 1.35:1 across large fills
const map_landuse = '#E8E4D9'; // compound and precinct ground, 1.15:1 as a wash
const map_road = '#FFFFFF'; // metalled road, read by being lighter than ground
const map_road_major = '#FFFFFF'; // the approach roads, carried by width
const map_path = '#C4AE8A'; // packed earth walking path, 1.94:1

export const colors = {
  // Spec names — prefer these in new code.
  ground,
  ground2,
  ground3,
  sand,
  sand_dim,
  sand_faint,
  brick,
  lock,
  seek,
  change,
  white: ground2,

  /** Map terrain. Not interchangeable with the semantic tokens above. */
  mapWater: map_water,
  mapVegetation: map_vegetation,
  mapLanduse: map_landuse,
  mapRoad: map_road,
  mapRoadMajor: map_road_major,
  mapPath: map_path,

  // ── Legacy role names ─────────────────────────────────────────────────────
  /** Page ground. */
  background: ground,
  /** Raised cards, sheets, list rows. */
  surface: ground2,
  /** Recessed surfaces, inactive fields, muted blocks. */
  surfaceSecondary: ground3,
  /** Hairlines, dividers, field outlines. */
  border: line,

  /** Primary accent — sandstone. Buttons, active navigation, emphasis. */
  sandstone: sand,
  /** Pressed / hovered sandstone, and sandstone text on pale ground. */
  sandstoneDeep: sand_dim,
  /** Excavated brick. Sparingly, for the deepest accent. */
  earth: brick,

  textPrimary: ink,
  textSecondary: ink_soft,
  textMuted: sand_faint,

  /** Alignment in progress — the reticle is searching for the vantage. */
  alignmentSeeking: seek,
  /**
   * Alignment achieved — the device matches the fixed viewpoint.
   *
   * RESERVED. This lapis means "locked" and nothing else. Never a generic
   * primary, link, brand, or the manual "match by eye" escape hatch. Spending
   * it anywhere else destroys its meaning.
   */
  alignmentLocked: lock,

  /** A condition observation that is open / unresolved. Not an error colour. */
  openCondition: change,
  /** A condition observation that has been resolved. */
  resolved: resolvedGreen,
} as const;

export type ColorToken = keyof typeof colors;
