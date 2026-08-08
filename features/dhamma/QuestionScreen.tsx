import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Divider, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { SourceCard } from '@/components/source';
import { findDhammaEntry, findSource } from '@/data';
import { colors, radii, spacing } from '@/theme';

/**
 * A single question.
 *
 * Order is deliberate: the answer, then the words it rests on, then the
 * citation, then any caveat. A caveat placed last is read; a caveat placed in a
 * footnote is not.
 */
export function QuestionScreen({ questionId }: { questionId: string }) {
  const router = useRouter();
  const entry = findDhammaEntry(questionId);

  if (!entry) {
    return (
      <Screen>
        <EmptyState
          title="No such question"
          body="This entry is not in the collection."
          actionLabel="Back to Dhamma"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          Dhamma
        </Text>
        <Text variant="title">{entry.question}</Text>
      </View>

      <Text variant="bodyLarge" style={styles.answer}>
        {entry.answer}
      </Text>

      {entry.original ? (
        <View style={styles.original}>
          <Text variant="mono" tone="sandstone">
            {entry.original}
          </Text>
        </View>
      ) : null}

      <Divider />

      <View style={styles.block}>
        <Text variant="label" tone="muted" uppercase>
          {entry.citations.length === 1 ? 'Source' : 'Sources'}
        </Text>
        {/*
          Rendered through the same SourceCard the heritage surfaces use. Each
          source carries its own caveat, so a limitation of the evidence is
          stated wherever that evidence appears rather than only here.
        */}
        {entry.citations.map((citation) => {
          const source = findSource(citation.sourceId);
          if (!source) return null;
          return <SourceCard key={citation.sourceId} source={source} citation={citation} />;
        })}
      </View>

      {entry.caveat ? (
        <>
          <Divider />
          <View style={styles.block}>
            <Text variant="label" tone="muted" uppercase>
              What this does not settle
            </Text>
            <Text variant="body" tone="secondary">
              {entry.caveat}
            </Text>
          </View>
        </>
      ) : null}

      {entry.reflectionPrompt ? (
        <>
          <Divider />
          <View style={styles.block}>
            <Text variant="label" tone="muted" uppercase>
              To sit with
            </Text>
            {/*
              A question, left open. No input, no save — §14 ends the sequence
              at reflection, and giving it a text box would turn it into a task.
            */}
            <Text variant="bodyLarge" tone="secondary">
              {entry.reflectionPrompt}
            </Text>
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  answer: { paddingBottom: spacing.lg },
  original: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radii.md,
    padding: spacing.base,
    marginBottom: spacing.lg,
  },
  block: { paddingVertical: spacing.lg, gap: spacing.sm },
});
