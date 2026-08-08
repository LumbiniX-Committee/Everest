import narrationData from '../seed/narration.json';

/**
 * Static require map for narration audio files (.en.opus).
 * Metro's `require()` needs static literal paths.
 */
export const siteAudioFiles: Record<string, number> = {
  'ashokan-pillar': require('../assets/audio/ashokan-pillar.en.opus'),
  'china-temple': require('../assets/audio/china-temple.en.opus'),
  'gautami-nuns-temple': require('../assets/audio/gautami-nuns-temple.en.opus'),
  'korean-temple': require('../assets/audio/korean-temple.en.opus'),
  'marker-stone': require('../assets/audio/marker-stone.en.opus'),
  'maya-devi-temple': require('../assets/audio/maya-devi-temple.en.opus'),
  'myanmar-temple': require('../assets/audio/myanmar-temple.en.opus'),
  'puskarini': require('../assets/audio/puskarini.en.opus'),
  'ramagrama': require('../assets/audio/ramagrama.en.opus'),
  'tilaurakot': require('../assets/audio/tilaurakot.en.opus'),
  'vihara-remains': require('../assets/audio/vihara-remains.en.opus'),
  'world-peace-pagoda': require('../assets/audio/world-peace-pagoda.en.opus'),
};

export type NarrationEntry = {
  site_id: string;
  approx_seconds: number;
  ne_review: string;
  en: string;
  ne: string;
};

export const narrations: NarrationEntry[] = narrationData;

/** Returns narration audio source for a site, if available. */
export function audioForSite(siteId: string): number | undefined {
  return siteAudioFiles[siteId];
}

/** Returns narration text entry for a site, if available. */
export function narrationForSite(siteId: string): NarrationEntry | undefined {
  return narrations.find((item) => item.site_id === siteId);
}
