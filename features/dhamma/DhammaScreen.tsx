import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, TextInput, View } from 'react-native';

import { Button, Card, Screen, Text } from '@/components/ui';
import { ScreenHeader, SettingsButton } from '@/components/common';
import { demoDhammaEntries, findSource } from '@/data';
import { colors, radii, spacing } from '@/theme';
import { useVoiceInput } from '@/hooks/useVoiceInput';

/**
 * Dhamma — grounded knowledge.
 *
 * Ask, or browse. Both routes end in the same place, and the browse list is not
 * a fallback: showing what the collection can answer sets an honest expectation
 * of its size before someone types into it.
 *
 * The rule this surface is built on: nothing is asserted without a source, and
 * the source is visible before you tap in.
 */
export function DhammaScreen() {
  const router = useRouter();
  const [question, setQuestion] = useState('');
  const voice = useVoiceInput();

  useEffect(() => {
    if (voice.transcript) setQuestion(voice.transcript);
  }, [voice.transcript]);

  const askTyped = () => {
    const text = question.trim();
    if (!text) return;
    router.push({ pathname: '/(main)/dhamma/question', params: { q: text } });
    setQuestion('');
  };

  return (
    <Screen scroll>
      <ScreenHeader
        canGoBack={false}
        eyebrow="Dhamma"
        title="Questions"
        subtitle="Everything here carries a citation you can go and check."
        rightAction={<SettingsButton />}
      />

      <View style={styles.ask}>
        <TextInput
          value={question}
          onChangeText={setQuestion}
          style={styles.input}
          placeholder="Ask something about Lumbini or the early record"
          placeholderTextColor={colors.textMuted}
          multiline
          returnKeyType="search"
          onSubmitEditing={askTyped}
          accessibilityLabel="Your question"
        />
        {voice.error ? (
          <Text variant="caption" tone="muted">
            {voice.error}
          </Text>
        ) : null}
        <View style={styles.askActions}>
          <Button label="Ask" onPress={askTyped} disabled={!question.trim()} />
          <Button
            label={voice.isListening ? 'Stop voice' : 'Voice'}
            variant="secondary"
            onPress={() => (voice.isListening ? voice.stop() : void voice.start('ne'))}
            accessibilityHint="Speak a Nepali question into the microphone"
          />
        </View>
        {/*
          Said before asking, not after refusing. Someone who knows the corpus
          is four narrow collections reads a refusal as a fact about the
          collection rather than as the app being evasive.
        */}
        <Text variant="caption" tone="muted">
          A small, narrow collection. It will say so when it cannot answer.
        </Text>
      </View>

      <View style={styles.reflectionEntry}>
        <Text variant="heading">Reflection companion</Text>
        <Text variant="body" tone="secondary">
          Say what is on your mind. It turns that into a few questions — one at a time, in your own
          words — and ends with a short reflection you can check against the canon.
        </Text>
        <Button
          label="Begin a reflection"
          variant="secondary"
          onPress={() => router.push('/(main)/dhamma/reflect' as never)}
        />
      </View>

      <View style={styles.list}>
        <Text variant="heading">What it can answer</Text>
        {demoDhammaEntries.map((entry) => {
          const source = findSource(entry.citations[0]?.sourceId);
          return (
            <Card
              key={entry.id}
              onPress={() =>
                router.push({
                  pathname: '/(main)/dhamma/question',
                  params: { questionId: entry.id },
                })
              }
              accessibilityLabel={entry.question}
            >
              <Text variant="heading">{entry.question}</Text>
              {source ? (
                <Text variant="caption" tone="muted" style={styles.source}>
                  {source.title} · {source.attribution}
                </Text>
              ) : null}
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ask: { paddingTop: spacing.lg, gap: spacing.md },
  askActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  input: {
    minHeight: 88,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.base,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    fontSize: 16,
    lineHeight: 24,
  },
  list: { paddingTop: spacing.xl, gap: spacing.md, paddingBottom: spacing.lg },
  reflectionEntry: { paddingTop: spacing.xl, gap: spacing.md },
  source: { marginTop: spacing.sm },
});
