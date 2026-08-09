/** Identity strings. Kept out of components so they are never retyped wrong. */
export const APP_NAME = 'Sākṣī';
export const APP_SUBTITLE = 'the witness';
/** Dhammapada 20.21 — "strive on with diligence". The app's standing instruction. */
export const APP_EPIGRAPH = 'appamādena sampādetha';

/** The three surfaces. This list is the navigation model. */
export const SURFACES = ['tirtha', 'sakshi', 'dhamma', 'profile'] as const;
export type Surface = (typeof SURFACES)[number];

export const SURFACE_LABELS: Record<Surface, string> = {
  tirtha: 'Tīrtha',
  sakshi: 'Sākṣī',
  dhamma: 'Dhamma',
  profile: 'Profile',
};

export const SURFACE_MEANINGS: Record<Surface, string> = {
  tirtha: 'Explore Lumbini',
  sakshi: 'Witness and record',
  dhamma: 'Sources and reflection',
  profile: 'Your observations',
};
