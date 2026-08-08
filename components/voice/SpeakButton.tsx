import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import {
  hasVoice,
  isSpeechSupported,
  speakText,
  stopSpeaking,
  type VoiceLanguage,
} from '@/services/voice';
import { spacing } from '@/theme';

/**
 * Three outcomes, not two. "No Nepali voice installed" and "this build cannot
 * speak at all" are different facts, and showing the first when the second is
 * true sends someone into their system settings to install a voice that would
 * not be used.
 */
type Availability = 'checking' | 'ready' | 'no-voice' | 'unsupported';

export function SpeakButton({ text, language }: { text: string; language: VoiceLanguage }) {
  // Resolved during the first render rather than in an effect: the check is a
  // synchronous module lookup, so there is nothing to wait for, and setting it
  // from an effect would render a state the component already knew was wrong.
  const [availability, setAvailability] = useState<Availability>(() =>
    isSpeechSupported() ? 'checking' : 'unsupported',
  );
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    if (!isSpeechSupported()) return;

    let active = true;

    void hasVoice(language)
      .then((value) => {
        if (active) setAvailability(value ? 'ready' : 'no-voice');
      })
      .catch(() => {
        if (active) setAvailability('no-voice');
      });

    return () => {
      active = false;
      stopSpeaking();
    };
  }, [language]);

  // Silent while deciding, and silent where the build cannot speak: a control
  // that appears and then vanishes is worse than one that arrives a beat late.
  if (availability === 'checking' || availability === 'unsupported') return null;

  if (availability === 'no-voice') {
    return (
      <Text variant="caption" tone="muted">
        Nepali voice is not installed on this device.
      </Text>
    );
  }

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    speakText(text, language, () => setSpeaking(false), () => setSpeaking(false));
  };

  return (
    <View style={styles.row}>
      <Button
        label={speaking ? 'Stop speaking' : 'Listen'}
        variant="quiet"
        onPress={toggle}
        accessibilityHint={speaking ? 'Stops speech' : 'Reads this aloud'}
      />
    </View>
  );
}

const styles = StyleSheet.create({ row: { marginTop: spacing.xs, alignSelf: 'flex-start' } });
