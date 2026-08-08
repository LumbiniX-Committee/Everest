import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Divider, Screen, Text } from '@/components/ui';
import { EmptyState, LoadingState } from '@/components/common';
import { Citation, SourceDetailSheet } from '@/components/source';
import { findDhammaEntry, findSource } from '@/data';
import { dhamma } from '@/services';
import type { DhammaLanguage } from '@/services/dhamma';
import { colors, radii, spacing } from '@/theme';
import { isGrounded, type DhammaAnswer, type Source } from '@/types';

/**
 * A question and what the collection can say about it.
 *
 * One renderer for both outcomes. `DhammaAnswer` is a discriminated union, so a
 * refusal cannot be dressed as an answer and an answer cannot appear without
 * the citations that justify it — the guarantee is structural rather than a
 * convention someone has to maintain.
 *
 * §14: no chat bubbles, no assistant persona, no typing animation. The reading
 * order is question, then evidence, then answer, then sources, then reflection.
 * A numbered claim above a reference is a pattern people already know how to
 * read sceptically, which is the disposition this surface wants.
 */
export function AnswerScreen({ questionId, query }: { questionId?: string; query?: string }) {
  const router = useRouter();
  const [answer, setAnswer] = useState<DhammaAnswer | null>(null);
  const [retrieving, setRetrieving] = useState(false);
  const [openSource, setOpenSource] = useState<Source | null>(null);
  const [language, setLanguage] = useState<DhammaLanguage>('ne');

  // A canned entry resolves synchronously; a typed question goes to retrieval.
  const entry = questionId ? findDhammaEntry(questionId) : undefined;
  const questionText = entry?.question ?? query ?? '';

  useEffect(() => {
    if (!questionText) return;

    let active = true;
    setRetrieving(true);
    dhamma
      .ask(questionText, language)
      .then((result) => {
        if (active) setAnswer(result.answer);
      })
      .catch(() => {
        if (active) setAnswer(null);
      })
      .finally(() => {
        if (active) setRetrieving(false);
      });
    return () => {
      active = false;
    };
  }, [questionText, language]);

  if (!entry && !query) {
    return (
      <Screen>
        <EmptyState
          title="No question"
          body="Nothing was asked."
          actionLabel="Back to Dhamma"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (retrieving || !answer) {
    return (
      <Screen scroll>
        <Head question={questionText} />
        {/*
          The wait names the work. §14 forbids a fake typing animation, and
          "Searching the collections" is both true and more informative than a
          cursor pretending to compose prose.
        */}
        <LoadingState label="Searching the collections" fill={false} />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Head question={questionText} />

      {questionText ? (
        <View style={styles.languageToggle}>
          <Text variant="label" tone="muted" uppercase>
            Response language
          </Text>
          <View style={styles.languageButtons}>
            <Button
              label="नेपाली"
              variant={language === 'ne' ? 'primary' : 'secondary'}
              onPress={() => setLanguage('ne')}
              disabled={retrieving || language === 'ne'}
            />
            <Button
              label="English"
              variant={language === 'en' ? 'primary' : 'secondary'}
              onPress={() => setLanguage('en')}
              disabled={retrieving || language === 'en'}
            />
          </View>
        </View>
      ) : null}

      {isGrounded(answer) ? (
        <>
          <Text variant="bodyLarge" style={styles.answer}>
            {answer.text}
          </Text>

          {answer.evidence.some((item) => item.passage) ? (
            <View style={styles.evidence}>
              <Text variant="label" tone="muted" uppercase>
                What this rests on
              </Text>
              {answer.evidence
                .filter((item) => item.passage)
                .map((item, index) => (
                  <Text key={`${item.citation.sourceId}-${index}`} variant="mono" tone="sandstone">
                    {item.passage}
                  </Text>
                ))}
            </View>
          ) : null}

          {answer.caveat ? (
            <View style={styles.caveat}>
              <Text variant="label" tone="seeking" uppercase>
                What this does not settle
              </Text>
              <Text variant="body" tone="secondary">
                {answer.caveat}
              </Text>
            </View>
          ) : null}

          <Divider />

          <View style={styles.block}>
            <Text variant="label" tone="muted" uppercase>
              {answer.citations.length === 1 ? 'Source' : 'Sources'}
            </Text>
            {answer.citations.map((citation, index) => {
              const source = findSource(citation.sourceId);
              if (!source) return null;
              return (
                <Citation
                  key={`${citation.sourceId}-${citation.locator ?? index}`}
                  source={source}
                  citation={citation}
                  index={index + 1}
                  onPress={() => setOpenSource(source)}
                />
              );
            })}
          </View>

          {answer.reflectionPrompt ? (
            <>
              <Divider />
              <View style={styles.block}>
                <Text variant="label" tone="muted" uppercase>
                  To sit with
                </Text>
                {/*
                  A question, left open. No text box and nothing saved — §14
                  ends its sequence at reflection, and an input would turn it
                  into another task.
                */}
                <Text variant="bodyLarge" tone="secondary">
                  {answer.reflectionPrompt}
                </Text>
              </View>
            </>
          ) : null}
        </>
      ) : (
        <View style={styles.refusalBlock}>
          {/*
            §25. The refusal is a trust feature, not an error state: it is set
            in the same type as an answer, carries what was searched so the
            reader can see it resulted from looking, and always offers somewhere
            to go next.
          */}
          <View style={styles.refusal}>
            <Text variant="bodyLarge">{answer.text}</Text>
          </View>

          <View style={styles.block}>
            <Text variant="label" tone="muted" uppercase>
              Why
            </Text>
            <Text variant="body" tone="secondary">
              {answer.reason}
            </Text>
          </View>

          <View style={styles.block}>
            <Text variant="label" tone="muted" uppercase>
              Collections searched
            </Text>
            {answer.searched.map((collection) => (
              <Text key={collection} variant="caption" tone="secondary">
                {collection}
              </Text>
            ))}
          </View>

          {answer.related.length > 0 ? (
            <>
              <Divider />
              <View style={styles.block}>
                <Text variant="label" tone="muted" uppercase>
                  Related, but not an answer
                </Text>
                {answer.related.map((citation, index) => {
                  const source = findSource(citation.sourceId);
                  if (!source) return null;
                  return (
                    <Citation
                      key={`${citation.sourceId}-${index}`}
                      source={source}
                      citation={citation}
                      onPress={() => setOpenSource(source)}
                    />
                  );
                })}
              </View>
            </>
          ) : null}

          {answer.suggestions.length > 0 ? (
            <>
              <Divider />
              <View style={styles.block}>
                <Text variant="label" tone="muted" uppercase>
                  The collection can answer
                </Text>
                {answer.suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    label={suggestion}
                    variant="secondary"
                    onPress={() =>
                      router.push({
                        pathname: '/(main)/dhamma/question',
                        params: { q: suggestion },
                      })
                    }
                  />
                ))}
              </View>
            </>
          ) : null}
        </View>
      )}

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />
    </Screen>
  );
}

function Head({ question }: { question: string }) {
  return (
    <View style={styles.head}>
      <Text variant="label" tone="muted" uppercase>
        Dhamma
      </Text>
      <Text variant="title">{question}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  answer: { paddingBottom: spacing.lg },
  evidence: {
    gap: spacing.sm,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.lg,
  },
  caveat: { gap: spacing.sm, paddingBottom: spacing.lg },
  block: { paddingVertical: spacing.lg, gap: spacing.sm },
  languageToggle: { gap: spacing.sm, paddingBottom: spacing.lg },
  languageButtons: { flexDirection: 'row', gap: spacing.sm },
  refusalBlock: { paddingBottom: spacing.lg },
  refusal: {
    padding: spacing.base,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 3,
    borderLeftColor: colors.textMuted,
  },
});
