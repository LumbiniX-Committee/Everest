import * as Speech from 'expo-speech';

export type VoiceLanguage = 'en' | 'ne';

const LOCALES: Record<VoiceLanguage, string> = {
  en: 'en-US',
  ne: 'ne-NP',
};

export function voiceLocale(language: VoiceLanguage): string {
  return LOCALES[language];
}

export async function hasVoice(language: VoiceLanguage): Promise<boolean> {
  if (language === 'en') return true;
  const voices = await Speech.getAvailableVoicesAsync();
  return voices.some((voice) => voice.language.toLowerCase().startsWith('ne'));
}

export function stopSpeaking(): void {
  Speech.stop();
}

export function speakText(
  text: string,
  language: VoiceLanguage,
  onDone?: () => void,
  onError?: (error: Error) => void,
): void {
  if (!text.trim()) return;
  Speech.stop();
  Speech.speak(text, {
    language: voiceLocale(language),
    rate: language === 'ne' ? 0.88 : 0.92,
    pitch: 1,
    onDone,
    onStopped: onDone,
    onError: (error) => onError?.(new Error(error as unknown as string)),
  });
}
