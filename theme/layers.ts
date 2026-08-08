/** zIndex ordering, so overlays never fight each other by accident. */
export const layers = {
  base: 0,
  cameraOverlay: 10,
  reticle: 20,
  sheet: 30,
  toast: 40,
} as const;
