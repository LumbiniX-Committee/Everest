import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';

import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Card, Icon, Screen, Text, type IconName } from '@/components/ui';
import { reportBoard, type BoardItem, type ReportBoard } from '@/core';
import { findSite } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { database, reportStatus, sync } from '@/services';
import { usePlan, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';

const STEP_LABEL: Record<BoardItem['step'], string> = {
  waiting: 'Waiting to send',
  received: 'Received',
  acknowledged: 'Acknowledged',
  in_progress: 'Being worked on',
  resolved: 'Resolved',
};

const STEP_ICON: Record<BoardItem['step'], IconName> = {
  waiting: 'cloud-upload-outline',
  received: 'inbox-arrow-down-outline',
  acknowledged: 'eye-check-outline',
  in_progress: 'progress-wrench',
  resolved: 'check-circle-outline',
};

type Snapshot = {
  visits: database.SiteVisit[];
  photos: number;
  pending: number;
  board: ReportBoard;
  heardAt: string | null;
};

const day = (iso: string) => iso.slice(0, 10);

/**
 * The visitor's own record, in one place: where they have been, what they
 * photographed, and every report they filed at the step it has really reached.
 *
 * Everything here is read from this phone first, so it works offline; the
 * report steps are the last copy heard from the server, dated, and refreshed
 * when there is a connection. Nothing is estimated: a count is what is stored.
 */
export function MeScreen() {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const { completedQuests } = useQuests();
  const { gatingOn, isPro, daysLeft } = usePlan();
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  const load = useCallback(async (refresh: boolean) => {
    const [visits, photos, pending, reports, cached] = await Promise.all([
      database.listSiteVisits(),
      database.countObservations(),
      sync.pendingCount(),
      database.listConditionReports(),
      reportStatus.cachedTimelines(),
    ]);
    const timelines = refresh ? await reportStatus.refreshTimelines() : cached;
    setSnapshot({
      visits,
      photos,
      pending,
      board: reportBoard(reports, timelines.byReport),
      heardAt: timelines.fetchedAt,
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Show the stored copy at once, then whatever the server says.
      void load(false).then(() => load(true));
    }, [load]),
  );

  if (!snapshot) return <LoadingState label="Opening your record" />;
  const { visits, photos, pending, board, heardAt } = snapshot;
  const empty = visits.length === 0 && photos === 0 && board.items.length === 0;
  const plan = !gatingOn ? 'Every feature is open' : isPro ? `Pro · ${daysLeft ?? 0} ${ui('days left')}` : 'Free';

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Sākṣī" title="Your record" subtitle="Kept on this phone. Nothing here is estimated." />

      <View style={styles.stats}>
        <Stat icon="map-marker-check-outline" value={visits.length} label="Places visited" />
        <Stat icon="camera-outline" value={photos} label="Photos taken" />
        <Stat icon="flag-outline" value={board.open} label="Reports open" />
        <Stat icon="flag-checkered" value={completedQuests.length} label="Quests done" />
      </View>

      {pending > 0 ? (
        <Card style={styles.notice}>
          <Icon name="cloud-upload-outline" size={20} color={colors.accent} />
          <Text variant="body" style={styles.flex}>
            {`${pending} ${ui('records are waiting to send. They go when you are back online.')}`}
          </Text>
        </Card>
      ) : null}

      {empty ? (
        <Card style={styles.emptyCard}>
          <Text variant="heading">Nothing recorded yet</Text>
          <Text variant="body" tone="secondary">
            Visit a place, take a photo from a marked viewpoint, or report a problem, and it appears here.
          </Text>
          <Button label="Open the guide map" icon="compass-outline" onPress={() => router.push('/(main)/tirtha/map')} />
        </Card>
      ) : null}

      {board.items.length ? (
        <View style={styles.section}>
          <Text variant="title">Your reports</Text>
          <Text variant="caption" tone="muted">
            {heardAt ? `${ui('Steps last checked')} ${day(heardAt)}` : ui('Steps not checked yet. They update when you are online.')}
          </Text>
          {board.items.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/visit/observation', params: { observationId: item.observationId } })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={[styles.rowIcon, item.step === 'resolved' && styles.rowIconDone]}>
                <Icon name={STEP_ICON[item.step]} size={20} color={item.step === 'resolved' ? colors.onPrimary : colors.primary} />
              </View>
              <View style={styles.flex}>
                <Text variant="bodyStrong" translate={false}>
                  {findSite(item.siteId)?.name ?? item.siteId}
                </Text>
                <Text variant="caption" tone="secondary">
                  {`${ui(STEP_LABEL[item.step])} · ${day(item.stepAt)}`}
                </Text>
                {item.note ? (
                  <Text variant="caption" tone="muted" translate={false}>
                    {`“${item.note}”`}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-right" size={22} color={colors.textMuted} />
            </Pressable>
          ))}
        </View>
      ) : null}

      {visits.length ? (
        <View style={styles.section}>
          <Text variant="title">Places you have been</Text>
          {visits.slice(0, 30).map((visit) => {
            const site = findSite(visit.siteId);
            return (
              <Pressable
                key={visit.siteId}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/(main)/tirtha/site/[siteId]', params: { siteId: visit.siteId } })}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={styles.flex}>
                  <Text variant="bodyStrong" translate={false}>
                    {site?.name ?? visit.siteId}
                  </Text>
                  <Text variant="caption" tone="secondary">
                    {visit.visitCount > 1
                      ? `${ui('First')} ${day(visit.firstVisitedAt)} · ${ui('last')} ${day(visit.lastVisitedAt)}`
                      : day(visit.firstVisitedAt)}
                  </Text>
                </View>
                <Icon name="chevron-right" size={22} color={colors.textMuted} />
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.section}>
        <Text variant="title">Plan and data</Text>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(main)/settings/plans')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Icon name="star-outline" size={20} color={colors.primary} />
          <Text variant="body" style={styles.flex}>
            {ui(plan)}
          </Text>
          <Icon name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={() => router.push('/(main)/settings/privacy')} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
          <Icon name="shield-account-outline" size={20} color={colors.primary} />
          <Text variant="body" style={styles.flex}>
            Export or delete your data
          </Text>
          <Icon name="chevron-right" size={22} color={colors.textMuted} />
        </Pressable>
      </View>
    </Screen>
  );
}

function Stat({ icon, value, label }: { icon: IconName; value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Icon name={icon} size={20} color={colors.primary} />
      <Text variant="title" translate={false}>
        {String(value)}
      </Text>
      <Text variant="caption" tone="secondary">
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  stat: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xxs,
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  emptyCard: { gap: spacing.sm, marginTop: spacing.md },
  section: { gap: spacing.sm, marginTop: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceSelected },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  rowIconDone: { backgroundColor: colors.primary },
  flex: { flex: 1 },
});
