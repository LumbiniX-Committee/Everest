import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/common';
import { Button, Card, Screen, Text } from '@/components/ui';
import { leaderboard } from '@/services';
import { colors, radii, spacing } from '@/theme';
import type { LeaderboardEntry, LeaderboardRange } from '@/services/leaderboard';

/**
 * The global leaderboard.
 *
 * This screen ranks people, which the rest of the app deliberately does not do,
 * and it is worth being clear about what it is counting so the two ideas stay
 * separate in the reader's head as well as in the schema.
 *
 * It counts **contributions** — observations filed, conditions reported, quest
 * evidence brought back — all of which had to be uploaded to exist. It does not
 * count puṇya. Merit remains on the device, unranked and unsynced, and nothing
 * here reads it.
 *
 * Two decisions follow from that and are visible in the design:
 *
 *   * Days active is shown beside points, because the daily cap means a high
 *     score is a record of returning rather than of one long afternoon. That is
 *     the behaviour worth surfacing.
 *   * There is no rank number for anyone but you. Positions past the top few
 *     are noise, and printing "#47" turns a contribution record into a
 *     standing to defend.
 */
export function LeaderboardScreen() {
  const [range, setRange] = useState<LeaderboardRange>('all');
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [handle, setHandleValue] = useState('');
  const [savingHandle, setSavingHandle] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  const load = useCallback(async (which: LeaderboardRange) => {
    setError(null);
    try {
      setEntries(await leaderboard.fetchLeaderboard(which));
    } catch {
      setError('The board could not be reached. Your own record is safe on this device.');
      setEntries(null);
    }
  }, []);

  useEffect(() => {
    void load(range);
  }, [load, range]);

  useEffect(() => {
    void leaderboard.getHandle().then((existing) => {
      if (existing) setHandleValue(existing);
    });
  }, []);

  const saveHandle = async () => {
    setSavingHandle(true);
    setHandleError(null);
    try {
      await leaderboard.setHandle(handle);
      await load(range);
    } catch (e) {
      setHandleError(e instanceof Error ? e.message : 'That name could not be saved.');
    } finally {
      setSavingHandle(false);
    }
  };

  const you = entries?.find((entry) => entry.isYou);
  const yourRank = you ? (entries?.indexOf(you) ?? -1) + 1 : null;

  return (
    <Screen>
      <ScreenHeader
        title="Guardians"
        subtitle="Ranked by what has been contributed to the record, not by puṇya, which stays yours and is never ranked."
      />

      <View style={styles.tabs}>
        <Button
          label="This week"
          variant={range === 'week' ? 'primary' : 'quiet'}
          onPress={() => setRange('week')}
        />
        <Button
          label="All time"
          variant={range === 'all' ? 'primary' : 'quiet'}
          onPress={() => setRange('all')}
        />
      </View>

      {error ? (
        <ErrorState title="Board unavailable" body={error} onRetry={() => void load(range)} />
      ) : entries == null ? (
        <LoadingState label="Reading the board" />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Nobody has contributed yet"
          body="File an observation or a condition report and you will be the first name here."
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load(range).finally(() => setRefreshing(false));
              }}
            />
          }
        >
          {entries.map((entry, index) => (
            <View
              key={entry.deviceId}
              style={[styles.row, entry.isYou && styles.rowYou]}
            >
              {/* Only the top three carry a numeral. Below that a position is
                  noise, and naming it invites defending it. */}
              <Text variant="body" tone="muted" style={styles.position}>
                {index < 3 ? String(index + 1) : '·'}
              </Text>

              <View style={styles.who}>
                <Text variant="body">
                  {entry.handle}
                  {entry.isYou ? '  (you)' : ''}
                </Text>
                <Text variant="caption" tone="muted">
                  {entry.activeDays === 1 ? '1 day active' : `${entry.activeDays} days active`}
                </Text>
              </View>

              <Text variant="body" style={styles.points}>
                {range === 'week' ? entry.pointsWeek : entry.points}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Card>
        <View style={styles.handleBlock}>
          <Text variant="heading">Your name here</Text>
          <Text variant="body" tone="secondary">
            {you
              ? `You are ${yourRank === 1 ? 'first' : `in position ${yourRank}`} with ${
                  range === 'week' ? you.pointsWeek : you.points
                } points.`
              : 'You have not contributed yet, so you are not on the board.'}
          </Text>
          <TextInput
            value={handle}
            onChangeText={setHandleValue}
            placeholder="Choose a name"
            placeholderTextColor={colors.textMuted}
            maxLength={32}
            style={styles.input}
            accessibilityLabel="Your name on the leaderboard"
          />
          {handleError ? (
            <Text variant="caption" tone="open">
              {handleError}
            </Text>
          ) : null}
          <Button
            label={savingHandle ? 'Saving…' : 'Save name'}
            variant="secondary"
            disabled={!handle.trim() || savingHandle}
            loading={savingHandle}
            onPress={() => void saveHandle()}
          />
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', gap: spacing.sm, paddingBottom: spacing.md },
  list: { gap: spacing.xs, paddingBottom: spacing.lg },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.md,
  },
  rowYou: { backgroundColor: colors.surfaceSecondary },
  position: { width: 20, textAlign: 'center' },
  who: { flex: 1, gap: 2 },
  points: { fontVariant: ['tabular-nums'] },
  handleBlock: { gap: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    minHeight: 44,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
});
