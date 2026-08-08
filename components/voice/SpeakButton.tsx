import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { hasVoice, speakText, stopSpeaking, type VoiceLanguage } from '@/services/voice';
import { spacing } from '@/theme';

export function SpeakButton({ text, language }: { text: string; language: VoiceLanguage }) {
  const [available, setAvailable] = useState(language === 'en');
  const [speaking, setSpeaking] = useState(false);

  useEffect(() => {
    let active = true;
    void hasVoice(language).then((value) => {
      if (active) setAvailable(value);
    }).catch(() => {
      if (active) setAvailable(language === 'en');
    });
    return () => {
      active = false;
      stopSpeaking();
    };
  }, [language]);

  if (!available) {
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
