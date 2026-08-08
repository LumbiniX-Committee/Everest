import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Divider, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { findDhammaEntry } from '@/data';
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
          Source
        </Text>
        <Text variant="body" tone="secondary">
          {entry.citation}
        </Text>
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
