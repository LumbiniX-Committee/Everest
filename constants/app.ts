/** Identity strings. Kept out of components so they are never retyped wrong. */
export const APP_NAME = 'Sākṣī';
export const APP_SUBTITLE = 'the witness';
/** Dhammapada 20.21 — "strive on with diligence". The app's standing instruction. */
export const APP_EPIGRAPH = 'appamādena sampādetha';

/**
 * The three surfaces. This list is the navigation model.
 *
 * There is no fourth "AI" surface. Synthesis by a language model is how Dhamma
 * answers a question that retrieval alone cannot phrase — a capability of that
 * surface, not a place of its own. A tab for it split one idea across two
 * entries in the bar and, as shipped, rendered the identical screen twice.
 */
export const SURFACES = ['tirtha', 'sakshi', 'dhamma'] as const;
export type Surface = (typeof SURFACES)[number];

export const SURFACE_LABELS: Record<Surface, string> = {
  tirtha: 'Tīrtha',
  sakshi: 'Sākṣī',
  dhamma: 'Dhamma',
};

export const SURFACE_ICONS: Record<Surface, string> = {
  tirtha: '🧭',
  sakshi: '👁️',
  dhamma: '🪷',
};

export const SURFACE_MEANINGS: Record<Surface, string> = {
  tirtha: 'Explore Lumbini',
  sakshi: 'Witness and record',
  dhamma: 'Sources and reflection',
};
