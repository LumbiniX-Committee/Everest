import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState, ErrorState, LoadingState, ScreenHeader } from '@/components/common';
import { Button, Card, Chip, Screen, Text } from '@/components/ui';
import { findSite } from '@/data';
import { getString, setString } from '@/services/storage';
import { StorageKeys } from '@/constants';
import { colors, radii, spacing } from '@/theme';
import {
  acknowledgeReport,
  fetchDashboard,
  fetchReports,
  isConfigured,
  type ConditionReport,
  type DashboardStats,
  type ReportStatus,
} from '@/services/custodian';

/**
 * The mobile half of the custodian dashboard (landing/app/custodian) — §4 of
 * the strategy doc: "let a caretaker acknowledge a report from their phone.
 * Closes the loop visibly."
 *
 * Reached from Settings, not the tab bar. A custodian is not one of the three
 * visitor surfaces, and "no complex auth" per the strategy doc means exactly
 * that: a remembered name attached to what this device acknowledges, not an
 * account.
 */

const STATUS_LABEL: Record<ReportStatus, string> = {
  open: 'Open',
  corroborated: 'Corroborated',
  acknowledged: 'Acknowledged',
  in_progress: 'In progress',
  resolved: 'Resolved',
};

const STATUS_TONE: Record<ReportStatus, 'open' | 'seeking' | 'resolved'> = {
  open: 'open',
  corroborated: 'open',
  acknowledged: 'seeking',
  in_progress: 'seeking',
  resolved: 'resolved',
};

function siteLabel(siteId: string): string {
  return findSite(siteId)?.name ?? siteId;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusDotColor(tone: 'open' | 'seeking' | 'resolved'): string {
  if (tone === 'open') return colors.openCondition;
  if (tone === 'seeking') return colors.alignmentSeeking;
  return colors.resolved;
}

function ReportCard({
  report,
  custodianId,
  onChanged,
}: {
  report: ConditionReport;
  custodianId: string;
  onChanged: () => void;
}) {
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState<ReportStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(status: 'acknowledged' | 'in_progress' | 'resolved') {
    setBusy(status);
    setError(null);
    try {
      await acknowledgeReport({ reportId: report.id, status, note, custodianId });
      onChanged();
    } catch {
      setError('Could not reach the server. Try again once connected.');
    } finally {
      setBusy(null);
    }
  }

  const canAct = report.status !== 'resolved';

  return (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.dot, { backgroundColor: statusDotColor(STATUS_TONE[report.status]) }]} />
        <Text variant="label" tone={STATUS_TONE[report.status]} uppercase>
          {STATUS_LABEL[report.status]}
        </Text>
        <Text variant="label" tone="muted" style={styles.dateRight}>
          {formatDate(report.created_at)}
        </Text>
      </View>

      <Text variant="heading" style={styles.siteName}>{siteLabel(report.site_id)}</Text>
      <Text variant="body" tone="secondary">
        {report.category}{report.subtype ? ` · ${report.subtype}` : ''} · severity {report.severity}
      </Text>
      <Text variant="label" tone="muted" style={styles.meta}>
        {report.corroborations} corroboration{report.corroborations === 1 ? '' : 's'}
      </Text>
      {report.note ? <Text variant="body" tone="secondary" style={styles.note}>"{report.note}"</Text> : null}
      {report.custodian_note ? (
        <Text variant="label" tone="muted" style={styles.note}>Custodian note: {report.custodian_note}</Text>
      ) : null}

      {canAct ? (
        <View style={styles.actionBlock}>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Note (optional)"
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
          <View style={styles.actionRow}>
            <Button label="Acknowledge" variant="secondary" loading={busy === 'acknowledged'} disabled={busy !== null} onPress={() => act('acknowledged')} />
            <Button label="In progress" variant="secondary" loading={busy === 'in_progress'} disabled={busy !== null} onPress={() => act('in_progress')} />
            <Button label="Resolved" variant="secondary" loading={busy === 'resolved'} disabled={busy !== null} onPress={() => act('resolved')} />
          </View>
          {error ? <Text variant="label" tone="secondary">{error}</Text> : null}
        </View>
      ) : (
        <Text variant="label" tone="muted" style={styles.meta}>
          {report.acknowledged_at ? `Closed ${formatDate(report.acknowledged_at)}` : 'Closed'}
        </Text>
      )}
    </Card>
  );
}

export function CustodianScreen() {
  const configured = isConfigured();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [reports, setReports] = useState<ConditionReport[]>([]);
  const [statusFilter, setStatusFilter] = useState<ReportStatus | ''>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [custodianId, setCustodianId] = useState('');

  useEffect(() => {
    getString(StorageKeys.custodianName).then((v) => { if (v) setCustodianId(v); });
  }, []);

  useEffect(() => {
    if (custodianId) setString(StorageKeys.custodianName, custodianId);
  }, [custodianId]);

  const load = useCallback(async () => {
    if (!configured) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [d, r] = await Promise.all([
        fetchDashboard(),
        fetchReports({ status: statusFilter || undefined }),
      ]);
      setStats(d);
      setReports(r);
    } catch {
      setError('Could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, configured]);

  useEffect(() => { load(); }, [load]);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [reports],
  );

  if (!configured) {
    return (
      <Screen>
        <ScreenHeader eyebrow="Sākṣī" title="Custodian" />
        <EmptyState
          title="No API configured"
          body="This build has no EXPO_PUBLIC_API_URL set, so there is nothing to load reports from."
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Sākṣī" title="Custodian" subtitle="Reports from visitors, waiting on a caretaker to act." />

      <View style={styles.identity}>
        <Text variant="label" tone="muted">Acting as</Text>
        <TextInput
          value={custodianId}
          onChangeText={setCustodianId}
          placeholder="Your name or office"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {stats ? (
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Text variant="label" tone="muted">Coverage</Text>
            <Text variant="title">{stats.coverage_pct}%</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text variant="label" tone="muted">Median ack time</Text>
            <Text variant="title">{stats.median_ack_hours != null ? `${stats.median_ack_hours}h` : '—'}</Text>
          </Card>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters} contentContainerStyle={styles.filtersContent}>
        <Chip label="All" selected={statusFilter === ''} onPress={() => setStatusFilter('')} />
        {(Object.keys(STATUS_LABEL) as ReportStatus[]).map((s) => (
          <Chip key={s} label={STATUS_LABEL[s]} selected={statusFilter === s} onPress={() => setStatusFilter(s)} />
        ))}
      </ScrollView>

      {error ? (
        <ErrorState title="Could not load reports" body={error} onRetry={load} />
      ) : loading ? (
        <LoadingState label="Reading the record" />
      ) : sorted.length === 0 ? (
        <EmptyState title="Nothing here" body="No reports match this filter." />
      ) : (
        sorted.map((r) => (
          <ReportCard key={r.id} report={r} custodianId={custodianId} onChanged={load} />
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: { marginTop: spacing.base, gap: spacing.xs },
  input: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    color: colors.textPrimary,
  },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  statCard: { flex: 1, gap: spacing.xxs },
  filters: { marginTop: spacing.lg },
  filtersContent: { gap: spacing.sm, paddingRight: spacing.gutter },
  card: { marginTop: spacing.base, gap: spacing.xxs },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dateRight: { marginLeft: 'auto' },
  siteName: { marginTop: spacing.xs },
  meta: { marginTop: spacing.xxs },
  note: { marginTop: spacing.sm, fontStyle: 'italic' },
  actionBlock: { marginTop: spacing.base, gap: spacing.sm },
  actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  dot: { width: 6, height: 6, borderRadius: radii.full },
});
