import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Button, Icon, Text } from '@/components/ui';
import { SiteVisual } from '@/components/site';
import { nearbyQuestAreas, isVantageTask, type QuestArea } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { database } from '@/services';
import { colors, radii, spacing } from '@/theme';
import type { Coordinate, QuestSubmission, QuestWithProgress } from '@/types';
import { formatDistance } from '@/utils';

export type QuestAreaCollectionProps = {
  coordinate: Coordinate | null;
  quests: QuestWithProgress[];
  onCapture: (questId: string, taskId: string) => void;
  onWitness: (targetId: string) => void;
  onGuide: (area: QuestArea) => void;
  onMemories: () => void;
};

/** Area discovery stays separate from exact monument arrival. */
export function QuestAreaCollection({ coordinate, quests, onCapture, onWitness, onGuide, onMemories }: QuestAreaCollectionProps) {
  const ui = useVisitorLiteralCopy();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<QuestSubmission[]>([]);
  useFocusEffect(useCallback(() => {
    let live = true;
    void database.listAllQuestSubmissions().then((rows) => { if (live) setSubmissions(rows); }).catch(() => undefined);
    return () => { live = false; };
  }, []));
  const areas = nearbyQuestAreas(coordinate, quests);
  return <View style={styles.body}>
    <Button label="My memories" icon="image-multiple-outline" variant="secondary" onPress={onMemories} />
    {!coordinate ? <Text tone="secondary">Allow location or start a demo walk to discover nearby activities.</Text> : null}
    {coordinate && areas.length === 0 ? <Text tone="secondary">No bundled heritage activities within 5 km.</Text> : null}
    {areas.map((area, index) => {
      const open = expanded === area.id;
      const activities = area.quests.flatMap((quest) => quest.tasks
        .filter((task) => task.evidence === 'photo' && task.type === 'observation')
        .map((task) => ({ quest, task })));
      const completed = activities.filter(({ quest, task }) => quest.progress.completedTasks.includes(task.id)).length;
      return <View key={area.id} style={styles.area}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityLabel={`${area.name}, ${activities.length} ${ui('activities')}`} onPress={() => setExpanded(open ? null : area.id)}>
          {area.siteIds[0] ? <SiteVisual siteId={area.siteIds[0]} height={132} /> : <View style={styles.cover}><Icon name="city-variant-outline" size={56} /></View>}
          <View style={styles.row}>
            <View style={styles.copy}>
              <Text variant="caption" tone="sandstone">{index === 0 ? 'NEAREST · ' : ''}{formatDistance(area.distanceM)}</Text>
              <Text variant="heading">{area.name}</Text>
              <Text variant="caption" tone="secondary">{completed}/{activities.length} done · {open ? 'Tap to collapse' : 'Tap to explore'}</Text>
            </View>
            <Icon name={open ? 'chevron-up' : 'chevron-down'} />
          </View>
        </Pressable>
        <View style={styles.guide}><Button label="Guide me" icon="directions" variant="secondary" onPress={() => onGuide(area)} /></View>
        {open ? <View style={styles.activities}>
          {activities.length === 0 ? <Text tone="secondary">Activities for this area are being prepared.</Text> : null}
          {activities.map(({ quest, task }) => {
            const done = quest.progress.completedTasks.includes(task.id);
            const memory = submissions.find((s) => s.questId === quest.id && s.taskId === task.id);
            const vantage = isVantageTask(task);
            return <View key={`${quest.id}-${task.id}`} style={[styles.activity, done && styles.done]}>
              <Text variant="heading">{done ? '✓ ' : ''}{task.title}</Text>
              {memory?.photoUri ? <Image source={{ uri: memory.photoUri }} style={styles.photo} /> : null}
              {done ? <Text variant="caption" tone="sandstone">Completed{memory ? ' · Saved in memories' : ''}</Text> : <>
                <Text tone="secondary">{task.description}</Text>
                {task.safetyNote ? <Text variant="caption" tone="muted">{task.safetyNote}</Text> : null}
              </>}
              {memory?.note ? <Text tone="secondary" translate={false}>{memory.note}</Text> : null}
              {!done ? <Button label={vantage ? 'Capture vantage' : 'Capture memory'} icon={vantage ? 'crosshairs' : 'camera-outline'} onPress={() => vantage && task.targetId ? onWitness(task.targetId) : onCapture(quest.id, task.id)} /> : null}
            </View>;
          })}
        </View> : null}
      </View>;
    })}
  </View>;
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingBottom: spacing.lg },
  area: { borderRadius: radii.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  cover: { height: 132, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceSecondary },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  copy: { flex: 1, gap: spacing.xs }, guide: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  activities: { gap: spacing.md, padding: spacing.md, paddingTop: 0 },
  activity: { padding: spacing.md, gap: spacing.sm, borderRadius: radii.md, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  done: { borderColor: colors.resolved }, photo: { width: '100%', height: 160, borderRadius: radii.md },
});
