import { useCallback, useEffect, useRef, useState } from 'react';

import type { VoiceLanguage } from '@/services/voice';

const LOCALES: Record<VoiceLanguage, string> = { en: 'en-US', ne: 'ne-NP' };
type RecognitionModule = typeof import('expo-speech-recognition')['ExpoSpeechRecognitionModule'];

/**
 * Loads speech recognition only after the user asks for it. This is important
 * because Expo Go does not contain this native module; a top-level import would
 * otherwise prevent the entire app from opening in Expo Go.
 */
export function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [languageUsed, setLanguageUsed] = useState<VoiceLanguage>('ne');
  const [error, setError] = useState<string | null>(null);
  const moduleRef = useRef<RecognitionModule | null>(null);
  const subscriptionsRef = useRef<{ remove: () => void }[]>([]);
  const fallbackAttempted = useRef(false);

  const clearSubscriptions = useCallback(() => {
    subscriptionsRef.current.forEach((subscription) => subscription.remove());
    subscriptionsRef.current = [];
  }, []);

  useEffect(() => clearSubscriptions, [clearSubscriptions]);

  const start = useCallback(async (language: VoiceLanguage) => {
    setTranscript('');
    setError(null);
    fallbackAttempted.current = false;

    let recognition: RecognitionModule;
    try {
      recognition = moduleRef.current ?? (await import('expo-speech-recognition')).ExpoSpeechRecognitionModule;
      moduleRef.current = recognition;
    } catch {
      setError('Live voice needs a Sākṣī development build. You can type in Expo Go.');
      return;
    }

    clearSubscriptions();
    subscriptionsRef.current = [
      recognition.addListener('start', () => {
        setIsListening(true);
        setError(null);
      }),
      recognition.addListener('end', () => setIsListening(false)),
      recognition.addListener('result', (event) => {
        const value = event.results?.[0]?.transcript ?? '';
        if (value) setTranscript(value);
      }),
      recognition.addListener('error', (event) => {
        setIsListening(false);
        if (event.error === 'language-not-supported' && language === 'ne' && !fallbackAttempted.current) {
          fallbackAttempted.current = true;
          setLanguageUsed('en');
          setError('Nepali speech recognition is unavailable on this device. Listening in English instead.');
          startRecognition(recognition, 'en');
          return;
        }
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(event.message || 'Speech recognition could not start. You can type instead.');
        }
      }),
    ];

    if (!recognition.isRecognitionAvailable()) {
      setError('Speech recognition is unavailable on this device. You can type instead.');
      return;
    }
    if (!recognition.supportsOnDeviceRecognition()) {
      setError('On-device speech recognition is unavailable. You can type instead.');
      return;
    }

    const permission = await recognition.requestPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone and speech permissions are needed for voice input.');
      return;
    }

    let actualLanguage = language;
    if (language === 'ne') {
      try {
        const supported = await recognition.getSupportedLocales({});
        const locales = supported.installedLocales?.length ? supported.installedLocales : supported.locales;
        if (!locales.some((locale) => locale.toLowerCase().startsWith('ne'))) {
          actualLanguage = 'en';
          setError('Nepali speech recognition is unavailable on this device. Listening in English instead.');
        }
      } catch {
        // Some Android recognition services do not expose locale discovery.
      }
    }

    setLanguageUsed(actualLanguage);
    startRecognition(recognition, actualLanguage);
  }, [clearSubscriptions]);

  const stop = useCallback(() => {
    moduleRef.current?.stop();
    setIsListening(false);
  }, []);

  return { start, stop, isListening, transcript, languageUsed, error };
}

function startRecognition(recognition: RecognitionModule, language: VoiceLanguage): void {
  recognition.start({
    lang: LOCALES[language],
    interimResults: false,
    continuous: false,
    requiresOnDeviceRecognition: true,
    addsPunctuation: true,
    contextualStrings: ['Sākṣī', 'Dhamma', 'Lumbini', 'Buddha', 'dukkha', 'Nirvana'],
  });
}
