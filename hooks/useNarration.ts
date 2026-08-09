import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useRef } from 'react';

import { audioForSite, narrationForSite, type NarrationEntry } from '@/data';

export type NarrationState = {
  /** The recorded track exists and is bundled. */
  hasAudio: boolean;
  /** The narration text, which ships in the seed and is always available. */
  narration?: NarrationEntry;
  playing: boolean;
  /** Seconds elapsed and total, both rounded — this drives a caption, not a scrubber. */
  positionSeconds: number;
  durationSeconds: number;
  toggle: () => void;
  stop: () => void;
};

/**
 * The recorded narration for a site, optionally starting on its own.
 *
 * Written as a hook rather than a service holding a player. expo-audio ties a
 * player to a component's lifetime, and the failure mode of getting that wrong
 * is a voice that keeps talking after the screen it belonged to has gone —
 * which for this app is a passage read aloud with its citation no longer on
 * screen. `useAudioPlayer` releases with the component, so the sound cannot
 * outlive its source.
 *
 * ── On autoPlay ────────────────────────────────────────────────────────────
 *
 * Guarded three ways, because automatic audio has to be harder to trigger than
 * a button is. It fires only when the site *changes*, so re-rendering does not
 * restart the voice mid-sentence; only once per site, so a screen that
 * remounts while you stand still stays quiet; and never at all when the phone's
 * silent switch is on, which `services/audio` enforces at the session level.
 */
export function useNarration(
  siteId: string | null | undefined,
  { autoPlay = false }: { autoPlay?: boolean } = {},
): NarrationState {
  const source = siteId ? audioForSite(siteId) : undefined;
  const narration = siteId ? narrationForSite(siteId) : undefined;

  // `?? null` rather than `undefined`: passing undefined leaves the previous
  // source loaded, so moving to a site with no recording would play the last
  // site's narration under the new site's name.
  const player = useAudioPlayer(source ?? null);
  const status = useAudioPlayerStatus(player);

  const startedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!autoPlay || !siteId || !source) return;
    if (startedFor.current === siteId) return;
    startedFor.current = siteId;
    // A player that will not start is not worth an error state on a screen
    // whose text is already readable — the transport control still works.
    // `seekTo` resolves asynchronously, so play() is chained rather than called
    // beside it: called beside it, playback can start before the seek lands and
    // the narration opens a few seconds in.
    void player
      .seekTo(0)
      .then(() => player.play())
      .catch(() => undefined);
  }, [autoPlay, siteId, source, player]);

  // Leaving the site re-arms the automatic start, so a genuine return plays
  // again while standing still does not.
  useEffect(() => {
    if (!siteId) startedFor.current = null;
  }, [siteId]);

  const playing = status?.playing ?? false;

  return {
    hasAudio: source !== undefined,
    narration,
    playing,
    positionSeconds: Math.floor(status?.currentTime ?? 0),
    durationSeconds: Math.floor(status?.duration || narration?.approx_seconds || 0),
    toggle: () => {
      if (playing) {
        player.pause();
        return;
      }
      // Restart rather than resume once it has run to the end, so a second tap
      // on a finished track plays it instead of doing nothing.
      const total = status?.duration ?? 0;
      if (total > 0 && (status?.currentTime ?? 0) >= total - 0.25) {
        void player.seekTo(0).then(() => player.play()).catch(() => undefined);
        return;
      }
      player.play();
    },
    stop: () => {
      player.pause();
      void player.seekTo(0).catch(() => undefined);
    },
  };
}
