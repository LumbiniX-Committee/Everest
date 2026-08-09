export type VoiceLanguage = 'en' | 'ne';

/**
 * Reading aloud.
 *
 * expo-speech is a native module, and this file is reachable from `@/services`
 * — the barrel that nearly every screen imports. A static import here is
 * therefore evaluated during app startup on every device, including one running
 * an over-the-air update on a build made before expo-speech existed. There the
 * module is absent, the import throws while modules are still being evaluated,
 * and the app does not start at all. Not the voice feature: the app.
 *
 * So it is required lazily behind an availability check, the same guard
 * expo-image-picker, expo-notifications and MapLibre already use here. The
 * sibling hook `hooks/useVoiceInput.ts` does this with a dynamic import for
 * expo-speech-recognition; this is the same idea, kept synchronous because
 * `speakText` is called straight from an onPress.
 *
 * Where speech is missing everything degrades to a no-op and `isSpeechSupported`
 * reports false, so the UI can leave the control out rather than offer a button
 * that does nothing.
 */
// @ts-ignore
type SpeechModule = any;

let speechCache: SpeechModule | null | undefined;

function loadSpeech(): SpeechModule | null {
  if (speechCache !== undefined) return speechCache;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    speechCache = require('expo-speech') as SpeechModule;
  } catch {
    speechCache = null;
  }
  return speechCache;
}

/** False on a build whose native side predates expo-speech. */
export function isSpeechSupported(): boolean {
  return loadSpeech() !== null;
}

const LOCALES: Record<VoiceLanguage, string> = {
  en: 'en-US',
  ne: 'ne-NP',
};

export function voiceLocale(language: VoiceLanguage): string {
  return LOCALES[language];
}

/**
 * Whether this device can actually speak the language.
 *
 * English is assumed present — every platform TTS ships it — but only once the
 * module itself is there to do the speaking. Nepali is asked about rather than
 * assumed, because on most handsets it is genuinely not installed.
 */
export async function hasVoice(language: VoiceLanguage): Promise<boolean> {
  const speech = loadSpeech();
  if (!speech) return false;
  if (language === 'en') return true;

  try {
    const voices = await speech.getAvailableVoicesAsync();
    return voices.some((voice: any) => voice.language.toLowerCase().startsWith('ne'));
  } catch {
    // A device that cannot enumerate its voices is not a device that has a
    // Nepali one; claiming otherwise would offer a button that says nothing.
    return false;
  }
}

export function stopSpeaking(): void {
  loadSpeech()?.stop();
}

export function speakText(
  text: string,
  language: VoiceLanguage,
  onDone?: () => void,
  onError?: (error: Error) => void,
): void {
  if (!text.trim()) return;

  const speech = loadSpeech();
  if (!speech) {
    // Report completion rather than leaving the caller stuck showing "Stop
    // speaking" for speech that was never going to start.
    onDone?.();
    return;
  }

  speech.stop();
  speech.speak(text, {
    language: voiceLocale(language),
    rate: language === 'ne' ? 0.88 : 0.92,
    pitch: 1,
    onDone,
    onStopped: onDone,
    onError: (error: any) => onError?.(new Error(error as unknown as string)),
  });
}
