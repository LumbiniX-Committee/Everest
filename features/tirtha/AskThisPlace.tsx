import { useState } from 'react';
import { ActivityIndicator, StyleSheet, TextInput, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { dhamma } from '@/services';
import { colors, radii, spacing } from '@/theme';
import type { DhammaAnswer, HeritageSite } from '@/types';

/**
 * The `custom` wisdom tier: ask your own question, here.
 *
 * The other three tiers decide in advance how much a place should say. This one
 * admits that a person standing in front of something has their own question,
 * and that no editor guessed it.
 *
 * It answers from the canonical corpus through the same engine as the Dhamma
 * screen — the one benchmarked at 50/50 with no citation naming a passage it
 * did not retrieve. So the refusal is real here too: a question the canon does
 * not support is declined rather than improvised over, and the decline says
 * what was searched.
 *
 * The site name is prepended to the question, not to bias the answer, but
 * because "when was this built" is unanswerable as typed and answerable at the
 * Ashokan Pillar. What the person typed is preserved and shown back to them.
 */
export function AskThisPlace({ site }: { site: HeritageSite }) {
  const [question, setQuestion] = useState('');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<DhammaAnswer | null>(null);
  const [asked, setAsked] = useState('');

  const ask = async () => {
    const text = question.trim();
    if (!text) return;

    setAsking(true);
    setAsked(text);
    try {
      const { answer: result } = await dhamma.ask(`${site.name}: ${text}`, 'en');
      setAnswer(result);
    } catch {
      setAnswer(null);
    } finally {
      setAsking(false);
    }
  };

  return (
    <View style={styles.block}>
      <Text variant="heading">Ask about this place</Text>
      <Text variant="body" tone="secondary">
        Answered from the canonical texts. If they do not cover it, you will be told that
        rather than given a guess.
      </Text>

      <TextInput
        value={question}
        onChangeText={setQuestion}
        placeholder={`What would you like to know about ${site.name}?`}
        placeholderTextColor={colors.textMuted}
        style={styles.input}
        multiline
        accessibilityLabel="Your question about this place"
      />

      <Button
        label={asking ? 'Searching…' : 'Ask'}
        disabled={!question.trim() || asking}
        loading={asking}
        onPress={() => void ask()}
      />

      {asking ? (
        <View style={styles.searching}>
          <ActivityIndicator color={colors.sandstoneDeep} />
          <Text variant="caption" tone="muted">
            Searching the canon
          </Text>
        </View>
      ) : null}

      {answer && !asking ? (
        <View style={styles.answer}>
          {/* Shown back verbatim: an answer to a question you cannot see is
              impossible to judge. */}
          <Text variant="caption" tone="muted">
            “{asked}”
          </Text>

          {answer.status === 'grounded' ? (
            <>
              <Text variant="body">{answer.text}</Text>
              <Text variant="caption" tone="muted">
                {answer.citations.length === 1
                  ? '1 canonical citation'
                  : `${answer.citations.length} canonical citations`}
                {answer.citations.length > 0
                  ? ` · ${answer.citations.map((citation) => citation.locator).join(', ')}`
                  : ''}
              </Text>
            </>
          ) : (
            <>
              <Text variant="body">{answer.text}</Text>
              <Text variant="body" tone="secondary">
                {answer.reason}
              </Text>
              {answer.suggestions.length > 0 ? (
                <Text variant="caption" tone="muted">
                  Try: {answer.suggestions.slice(0, 2).join(' · ')}
                </Text>
              ) : null}
            </>
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingVertical: spacing.lg, gap: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 76,
    textAlignVertical: 'top',
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  searching: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  answer: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
});
