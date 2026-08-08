import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui';
import { colors, radii, spacing } from '@/theme';

export type TimelineEntry = {
  id: string;
  /** Displayed as given: "249 BCE", "1896", "March 1975". Never parsed. */
  date: string;
  title: string;
  detail?: string;
  /**
   * Marks an entry the person themselves created — their own observation in a
   * series that otherwise belongs to the record. Drawn filled rather than
   * hollow so their contribution is visible without being loud.
   */
  own?: boolean;
  /** Attribution line, where the entry rests on a source. */
  attribution?: string;
};

export type TimelineProps = {
  entries: TimelineEntry[];
  /**
   * Oldest first by default, which is how a site's history reads. Time series
   * pass 'desc' — a returning observer wants their last visit at the top.
   */
  order?: 'asc' | 'desc';
};

/**
 * A dated sequence on a rail.
 *
 * Serves both a site's history and a vantage's observation series, because they
 * are the same shape: dated events, some sourced, some the person's own. Using
 * one component keeps §46's promise that the app has a single way of speaking
 * about time.
 *
 * Dates are strings, not Dates. Half the entries here are "c. 3rd century BCE",
 * which no date type represents and no formatter should be asked to guess at.
 */
export function Timeline({ entries, order = 'asc' }: TimelineProps) {
  const ordered = order === 'asc' ? entries : [...entries].reverse();

  return (
    <View style={styles.wrap}>
      {ordered.map((entry, index) => {
        const last = index === ordered.length - 1;
        return (
          <View key={entry.id} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.node, entry.own ? styles.nodeOwn : styles.nodeRecord]} />
              {!last ? <View style={styles.line} /> : null}
            </View>

            <View style={[styles.body, last && styles.bodyLast]}>
              <Text variant="mono" tone="muted">
                {entry.date}
              </Text>
              <Text variant="body" style={styles.title}>
                {entry.title}
              </Text>
              {entry.detail ? (
                <Text variant="caption" tone="secondary">
                  {entry.detail}
                </Text>
              ) : null}
              {entry.attribution ? (
                <Text variant="caption" tone="muted" style={styles.attribution}>
                  {entry.attribution}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const NODE = 9;

const styles = StyleSheet.create({
  wrap: { paddingVertical: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.base },
  rail: { alignItems: 'center', width: NODE },
  node: {
    width: NODE,
    height: NODE,
    borderRadius: radii.full,
    marginTop: 5,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  /** Hollow: part of the documented record. */
  nodeRecord: { backgroundColor: colors.background, borderColor: colors.sandstone },
  /** Filled: the person's own observation. */
  nodeOwn: { backgroundColor: colors.sandstoneDeep, borderColor: colors.sandstoneDeep },
  line: { flex: 1, width: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border },
  body: { flex: 1, paddingBottom: spacing.lg, gap: spacing.xxs },
  bodyLast: { paddingBottom: 0 },
  title: { marginTop: spacing.xxs },
  attribution: { marginTop: spacing.xs },
});
