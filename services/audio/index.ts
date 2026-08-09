import { Platform } from 'react-native';

/**
 * The audio session.
 *
 * One call, made once at startup, that decides how narration behaves against
 * everything else the phone is doing. It matters more than it looks: without
 * it the platform default applies, and the two defaults are wrong in opposite
 * directions for this app.
 *
 * ── playsInSilentMode: false ───────────────────────────────────────────────
 *
 * expo-audio defaults this to `true`, which means narration plays through the
 * iOS ringer switch and through Android's silent mode. For a music player that
 * is correct — you pressed play, you meant it. For narration that starts by
 * itself because you walked somewhere, it is the app overriding a decision the
 * person already made with a physical switch, inside a temple precinct.
 *
 * So the silent switch wins. This is also what makes `autoNarration` defensible
 * as an on-by-default preference: the automatic behaviour cannot make noise in
 * a place where someone has silenced their phone, and the narration text is
 * shown either way.
 *
 * ── interruptionMode: duckOthers ───────────────────────────────────────────
 *
 * A pilgrim may already be listening to something. `doNotMix` would stop it
 * outright and `mixWithOthers` would talk over it; ducking lowers it for the
 * length of a ninety-second narration and hands it back.
 *
 * ── shouldPlayInBackground: false ──────────────────────────────────────────
 *
 * Narration is tied to a screen showing the passage and its sources. Audio that
 * outlives that screen is a voice with no citation attached, which is the one
 * thing this app does not do.
 */

/** Web has no audio session to configure, and expo-audio no-ops there anyway. */
export const isSupported = Platform.OS !== 'web';

let configured = false;

export async function configure(): Promise<void> {
  if (!isSupported || configured) return;
  try {
    // Required lazily for the same reason notifications are: this file sits in
    // the services barrel, which the hooks barrel pulls in, which the tab bar
    // imports — a module that throws while evaluating on an unsupported host
    // would take every screen down with it rather than just the audio.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const audio = require('expo-audio') as typeof import('expo-audio');
    await audio.setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: 'duckOthers',
      shouldPlayInBackground: false,
      allowsRecording: false,
    });
    configured = true;
  } catch (error) {
    // A device that will not grant an audio session still shows the narration
    // text. Nothing here is worth failing a screen over.
    console.warn('Failed to configure the audio session:', error);
  }
}

/** True once the session has been set up. Read by the narration hook. */
export function isConfigured(): boolean {
  return configured;
}
