import type { WisdomTier } from '../../types/preferences.ts';

/**
 * How much a place says when you reach it.
 *
 * The policy lives here rather than inside a screen because two surfaces have
 * to agree about it: the site page you open deliberately, and the notification
 * that arrives unasked when you cross a geofence. If those disagree, someone
 * who chose `basic` gets a scriptural push notification, which is precisely the
 * intrusion the setting exists to prevent.
 *
 * ── What the tiers do and do not change ────────────────────────────────────
 *
 * They select depth over material that is already written and already sourced:
 * the one-line summary, the fuller description, the facts table, the scholarly
 * sources, the canonical passages the site rests on. **No tier generates a
 * claim about a place.** `high` is more exhaustive than `basic`; it is not more
 * confident, and `basic` is not a simplification that shades into being wrong.
 * That is the whole reason the ladder is built from existing fields rather than
 * from three separately-written blurbs — three blurbs would eventually disagree
 * with each other, and the shortest one would be the one nobody proofread.
 */
export type WisdomDepth = {
  /** `short` is the first sentence; `full` is the whole summary. */
  prose: 'short' | 'full';
  facts: boolean;
  /** Scholarly sources — UNESCO, ASI, survey records. */
  sources: boolean;
  /** Canonical passages resolved from the site's `dhammaLinks`. */
  scripture: boolean;
  /** The question box, which hands the depth decision back to the reader. */
  ask: boolean;
};

const DEPTHS: Record<WisdomTier, WisdomDepth> = {
  basic:  { prose: 'short', facts: false, sources: false, scripture: false, ask: false },
  medium: { prose: 'full',  facts: true,  sources: true,  scripture: false, ask: false },
  high:   { prose: 'full',  facts: true,  sources: true,  scripture: true,  ask: false },

  // Custom is not a fifth depth. It is medium plus the question box: someone
  // who wants to ask their own question still needs to know where they are
  // standing before they can think of one.
  custom: { prose: 'full',  facts: true,  sources: true,  scripture: false, ask: true },
};

export function depthFor(tier: WisdomTier): WisdomDepth {
  return DEPTHS[tier] ?? DEPTHS.medium;
}
