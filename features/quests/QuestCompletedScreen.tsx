import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';

import { Button, ProgressRing, Screen, Text } from '@/components/ui';
import { database } from '@/services';
import { useQuests } from '@/store/quests';
import { colors, radii, spacing } from '@/theme';
import type { QuestSubmission } from '@/types';

/**
 * The end of a quest.
 *
 * This screen was a 🪷 at 40 points in a grey circle, the words "Quest
 * Completed!", and a card headed "Puṇya Merit Recognized" with the intention
 * underneath it. Three things wrong with that, and they compound.
 *
 * The emoji is not the app's visual language. Everything else here is drawn
 * from the reticle — an instrument closing on a vantage — and a system emoji
 * renders in whatever face the operating system happens to ship, at whatever
 * weight, in a palette nobody chose.
 *
 * The exclamation mark is not the app's voice. This is a project whose linter
 * bans the vocabulary of achievement outright, whose merit has no score, and
 * whose copy elsewhere states things plainly and stops. Congratulating someone
 * for finishing a checklist is the register the whole design avoids.
 *
 * And it showed nothing of what had been done. Someone had just walked a
 * precinct, photographed foundations and graded what they found, and the screen
 * summarising it contained no photograph. The evidence is the point; a summary
 * that omits it is a receipt.
 *
 * So: a closed ring in the app's own form, what was brought back, and the
 * intention the quest was for — stated once, without being called a reward.
 */
export function QuestCompletedScreen({ questId }: { questId: string }) {
  const router = useRouter();
  const { getQuestById } = useQuests();
  const quest = getQuestById(questId);

  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);

  useEffect(() => {
    let active = true;
    void database
      .listQuestSubmissions(questId)
      .then((rows) => {
        if (active) setSubmissions(rows.filter((row) => row.photoUri));
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [questId]);

  const taskCount = quest?.tasks.length ?? 0;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.container}>
        {/*
          The ring closed. The same object that says "aligned" on the capture
          surface and "two of four" on a quest card, at rest.
        */}
        <ProgressRing
          completed={taskCount}
          total={taskCount}
          size={96}
          thickness={4}
          label="✓"
        />

        <View style={styles.heading}>
          <Text variant="title" center>
            {quest?.title ?? 'Quest'}
          </Text>
          <Text variant="body" tone="secondary" center>
            {taskCount === 1 ? 'One task, done.' : `All ${taskCount} tasks done.`}
          </Text>
        </View>

        {/* What was brought back, at a size worth looking at. */}
        {submissions.length > 0 ? (
          <View style={styles.evidence}>
            <Text variant="label" uppercase tone="muted">
              What you recorded
            </Text>
            <View style={styles.thumbs}>
              {submissions.map((submission) => (
                <Image
                  key={`${submission.questId}-${submission.taskId}`}
                  source={{ uri: submission.photoUri }}
                  style={styles.thumb}
                  resizeMode="cover"
                  accessibilityLabel="A photograph you recorded during this quest"
                />
              ))}
            </View>
          </View>
        ) : null}

        {/*
          The intention, not a reward. 05-CONTENT-SPEC gives every quest a
          reason it was worth doing, and that reason is what closes it — merit
          has no score to show here and this screen should not invent one.
        */}
        {quest?.intention ? (
          <View style={styles.intention}>
            <Text variant="body" center style={styles.intentionText}>
              {quest.intention}
            </Text>
          </View>
        ) : null}

        <Text variant="caption" tone="muted" center>
          What you saw is part of the record now.
        </Text>

        <View style={styles.actions}>
          <Button
            label="Back to quests"
            block
            onPress={() => router.replace('/(main)/tirtha/quests')}
          />
          <Button
            label="Return to Tīrtha"
            variant="quiet"
            block
            onPress={() => router.replace('/(main)/tirtha')}
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { justifyContent: 'center' },
  container: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  heading: { alignItems: 'center', gap: spacing.xs },
  evidence: { width: '100%', gap: spacing.sm },
  thumbs: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  thumb: {
    width: 96,
    height: 96,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
  intention: {
    borderLeftWidth: 2,
    borderLeftColor: colors.sandstone,
    paddingLeft: spacing.base,
    alignSelf: 'stretch',
  },
  intentionText: { color: colors.sandstoneDeep, textAlign: 'left' },
  actions: { width: '100%', gap: spacing.md, paddingTop: spacing.base },
});
