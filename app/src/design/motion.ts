/**
 * app/src/design/motion.ts — the only motion in the app.
 *
 * Source: 07-DESIGN-SYSTEM §4. The reticle snap is the single piece of
 * orchestrated motion in Sākṣī. Everything else is a 120 ms opacity fade or
 * nothing at all. Restraint is the design.
 *
 * Pure data + one pure helper, no react-native import, so it typechecks today.
 */

export const motion = {
  /** The reticle snapping shut on alignment. ease-out. */
  snapMs: 180,
  /** The only other duration: an opacity fade. */
  fadeMs: 120,
  /** Standard ease-out cubic-bezier curve. */
  easeOut: [0.16, 1, 0.3, 1] as const,
} as const;

/**
 * Respect prefers-reduced-motion (07 §4): replace the snap with an instant
 * colour change. Pass the OS reduce-motion flag (from AccessibilityInfo on RN)
 * and get back the duration to use — 0 means "no tween, change instantly".
 */
export function snapDuration(reduceMotion: boolean): number {
  return reduceMotion ? 0 : motion.snapMs;
}

export function fadeDuration(reduceMotion: boolean): number {
  return reduceMotion ? 0 : motion.fadeMs;
}
