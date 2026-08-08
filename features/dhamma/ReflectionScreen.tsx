import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Divider, Screen, Text } from '@/components/ui';
import { LoadingState } from '@/components/common';
import { SpeakButton } from '@/components/voice/SpeakButton';
import { dhamma } from '@/services';
import type { DhammaLanguage, ReflectionApiResult } from '@/services/dhamma';
import { colors, radii, spacing } from '@/theme';

const STAGES = 4;

export function ReflectionScreen({ siteId }: { siteId?: string }) {
  const router = useRouter();
  const [language, setLanguage] = useState<DhammaLanguage>('ne');
  const [stage, setStage] = useState(1);
  const [answers, setAnswers] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [response, setResponse] = useState<ReflectionApiResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const request = useCallback(async (nextStage: number, nextAnswers: string[], nextInput?: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await dhamma.reflect({
        stage: nextStage,
        userInput: nextInput,
        answers: nextAnswers,
        siteId,
        language,
      });
      setResponse(result);
      setStage(result.stage);
    } catch {
      setError(language === 'ne'
        ? 'आत्म-चिन्तन सेवा अहिले उपलब्ध छैन। नेटवर्क जाँचेर फेरि प्रयास गर्नुहोस्।'
        : 'The reflection service is unavailable. Check the connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [language, siteId]);

  useEffect(() => {
    void request(1, []);
  }, [request]);

  const submit = () => {
    const value = input.trim();
    if (!value || loading || response?.distress_override) return;
    const nextAnswers = [...answers, value];
    setAnswers(nextAnswers);
    setInput('');
    void request(stage < STAGES ? stage + 1 : STAGES + 1, nextAnswers, value);
  };

  const changeLanguage = (nextLanguage: DhammaLanguage) => {
    if (nextLanguage === language || loading) return;
    setLanguage(nextLanguage);
  };

  const isComplete = Boolean(response?.completed || stage > STAGES);
  const isCrisis = Boolean(response?.distress_override);

  return (
    <Screen scroll>
      <View style={styles.header}>
        <Text variant="label" tone="muted" uppercase>
          Dhamma · Reflection companion
        </Text>
        <Text variant="title">
          {language === 'ne' ? 'चार प्रश्न, आफ्नै अनुभवतर्फ' : 'Four questions, toward your own experience'}
        </Text>
        <Text variant="body" tone="secondary">
          {language === 'ne'
            ? 'म तपाईंको ठाउँमा उत्तर दिनेछैनँ। एक पटकमा एउटा प्रश्न सोध्छु, तपाईंले आफ्नै शब्दमा हेर्नुहुन्छ।'
            : 'I will not answer in your place. I will ask one question at a time, and you will look in your own words.'}
        </Text>
      </View>

      <View style={styles.languageRow}>
        <Text variant="label" tone="muted" uppercase>
          Language
        </Text>
        <View style={styles.languageButtons}>
          <Button label="नेपाली" variant={language === 'ne' ? 'primary' : 'secondary'} onPress={() => changeLanguage('ne')} />
          <Button label="English" variant={language === 'en' ? 'primary' : 'secondary'} onPress={() => changeLanguage('en')} />
        </View>
      </View>

      {loading && !response ? <LoadingState label="Preparing the next question" fill={false} /> : null}

      {error ? (
        <Card>
          <Text variant="body" tone="secondary">{error}</Text>
          <Button label={language === 'ne' ? 'फेरि प्रयास गर्नुहोस्' : 'Try again'} variant="secondary" onPress={() => void request(stage, answers)} />
        </Card>
      ) : null}

      {response && !isComplete && !isCrisis ? (
        <>
          <View style={styles.progress}>
            {[1, 2, 3, 4].map((item) => (
              <View key={item} style={[styles.progressDot, item <= stage && styles.progressDotActive]} />
            ))}
          </View>
          <Text variant="caption" tone="muted">
            {language === 'ne' ? `प्रश्न ${stage} / ${STAGES}` : `Question ${stage} of ${STAGES}`}
          </Text>
          <Card style={styles.questionCard}>
            <Text variant="bodyLarge">{response.inquiry}</Text>
            <SpeakButton text={response.inquiry} language={language} />
          </Card>
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            textAlignVertical="top"
            placeholder={language === 'ne' ? 'आफ्नो अनुभव आफ्नै शब्दमा लेख्नुहोस्…' : 'Write in your own words…'}
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            accessibilityLabel={language === 'ne' ? 'तपाईंको उत्तर' : 'Your reflection'}
          />
          <Button
            label={stage === STAGES
              ? (language === 'ne' ? 'मेरो प्रतिबिम्ब हेर्नुहोस्' : 'See my reflection')
              : (language === 'ne' ? 'अर्को प्रश्न' : 'Next question')}
            onPress={submit}
            disabled={!input.trim() || loading}
            loading={loading}
            block
          />
        </>
      ) : null}

      {isCrisis ? (
        <View style={styles.crisis}>
          <Text variant="heading">{language === 'ne' ? 'अहिले मानवीय सहयोग रोज्नुहोस्' : 'Choose human support now'}</Text>
          <Text variant="body" tone="secondary">{response?.inquiry}</Text>
          {response?.helplines?.map((helpline) => (
            <View key={helpline.number} style={styles.helpline}>
              <Text variant="label">{helpline.name}</Text>
              <Text variant="bodyLarge" tone="sandstone">{helpline.number}</Text>
              <Text variant="caption" tone="muted">{helpline.hours}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {isComplete && !isCrisis ? (
        <View style={styles.final}>
          <Text variant="label" tone="muted" uppercase>
            {language === 'ne' ? 'तपाईंको प्रतिबिम्ब' : 'Your reflection'}
          </Text>
          <Text variant="bodyLarge">{response?.guidance ?? response?.inquiry}</Text>
          <SpeakButton text={response?.guidance ?? response?.inquiry ?? ''} language={language} />
          {response?.citations && response.citations.length > 0 ? (
            <View style={styles.sources}>
              <Text variant="label" tone="muted" uppercase>
                {language === 'ne' ? 'जाँच्न सकिने स्रोत' : 'Sources to check'}
              </Text>
              {response.citations.map((citation) => (
                <Text key={citation.segment_id} variant="mono" tone="sandstone">
                  {citation.display} · [{citation.segment_id}]
                </Text>
              ))}
            </View>
          ) : null}
          <Text variant="caption" tone="muted">
            {response?.disclaimer}
          </Text>
          <Button label={language === 'ne' ? 'फेरि सुरु गर्नुहोस्' : 'Start again'} variant="secondary" onPress={() => { setAnswers([]); setInput(''); setResponse(null); setStage(1); }} />
        </View>
      ) : null}

      <Divider />
      <Text variant="caption" tone="muted">
        {response?.disclaimer ?? (language === 'ne'
          ? 'यो आत्म-चिन्तनको साधन हो; परामर्श, थेरापी वा मानसिक स्वास्थ्य उपचार होइन।'
          : 'This is a reflective inquiry tool. It is not counselling, therapy, or mental health treatment.')}
      </Text>
      <Button label={language === 'ne' ? 'फिर्ता' : 'Back'} variant="quiet" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { paddingTop: spacing.lg, gap: spacing.sm, paddingBottom: spacing.lg },
  languageRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  languageButtons: { flexDirection: 'row', gap: spacing.sm },
  progress: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.xs },
  progressDot: { height: 5, flex: 1, borderRadius: radii.sm, backgroundColor: colors.border },
  progressDotActive: { backgroundColor: colors.sandstone },
  questionCard: { marginTop: spacing.md, marginBottom: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.sandstone },
  input: {
    minHeight: 140,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.base,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  final: { gap: spacing.md, paddingVertical: spacing.lg },
  sources: { gap: spacing.sm, padding: spacing.base, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md },
  crisis: { gap: spacing.md, paddingVertical: spacing.lg },
  helpline: { gap: spacing.xs, padding: spacing.base, backgroundColor: colors.surfaceSecondary, borderRadius: radii.md },
});
