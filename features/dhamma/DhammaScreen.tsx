import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Card, Screen, Text } from '@/components/ui';
import { ScreenHeader } from '@/components/common';
import { demoDhammaEntries, findSource } from '@/data';
import { spacing } from '@/theme';

/**
 * Dhamma — grounded knowledge.
 *
 * A list of questions, not topics. People arrive at Lumbini with questions in
 * their own words, and the surface is organised the way they ask rather than
 * the way a curriculum would file it.
 *
 * The rule this surface is built on: nothing is asserted without a source, and
 * the source is visible before you tap in.
 */
export function DhammaScreen() {
  const router = useRouter();

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Dhamma"
        title="Questions"
        subtitle="Everything here carries a citation you can go and check."
      />

      <View style={styles.list}>
        {demoDhammaEntries.map((entry) => {
          // The first citation stands for the entry in the list. Showing what an
          // answer rests on before it is opened is what makes this a collection
          // of evidence rather than a list of assertions.
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
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  source: { marginTop: spacing.sm },
});
