import { StyleSheet, View } from 'react-native';

import { Card, Icon, Text } from '@/components/ui';
import { priceFor, type VisitorType } from '@/core';
import { useImagery } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { colors, spacing } from '@/theme';

const FREE = ['Map, search and walking directions', 'Site basics, fees and hours', 'Take photographs and keep your own record'];
const PRO = ['3D monument views', 'Step-by-step close-up guidance', 'Audio narration', 'Reflection companion'];

/**
 * Promised for Pro but not yet working. Listed apart, so nobody pays for them
 * believing they exist. Satellite joins the Pro list only once an imagery
 * provider has actually answered, not merely because a key is set.
 */
const COMING_LABELS = ['Offline maps and guides', 'Satellite map'] as const;

function Row({ label, icon }: { label: string; icon: 'check' | 'star-four-points-outline' }) {
  return (
    <View style={styles.row}>
      <Icon name={icon} size={18} color={colors.primary} />
      <Text variant="body" style={styles.rowText}>
        {label}
      </Text>
    </View>
  );
}

/** The same comparison in onboarding and Settings, so the two can't disagree. */
export function PlanComparison({ visitor }: { visitor: VisitorType }) {
  const ui = useVisitorLiteralCopy();
  const imagery = useImagery();
  const COMING = COMING_LABELS.map((label) => ({ label, ready: label === 'Satellite map' && imagery != null }));
  const price = priceFor(visitor);
  const priceText = price.currency === 'NPR' ? 'NPR 1,000 a month' : 'USD 20 a month';

  return (
    <View style={styles.wrap}>
      <Card style={styles.card}>
        <Text variant="heading">Free</Text>
        {FREE.map((label) => (
          <Row key={label} label={label} icon="check" />
        ))}
      </Card>
      <Card style={styles.card}>
        <View style={styles.proHead}>
          <Text variant="heading">Pro</Text>
          <Text variant="bodyStrong" tone="sandstone">
            {priceText}
          </Text>
        </View>
        <Text variant="caption" tone="secondary">
          Everything in Free, and:
        </Text>
        {PRO.map((label) => (
          <Row key={label} label={label} icon="star-four-points-outline" />
        ))}
        {COMING.filter((item) => item.ready).map((item) => (
          <Row key={item.label} label={item.label} icon="star-four-points-outline" />
        ))}
        {COMING.some((item) => !item.ready) ? (
          <Text variant="caption" tone="muted">
            {`${ui('Coming soon')}: ${COMING.filter((item) => !item.ready).map((item) => ui(item.label)).join(', ')}`}
          </Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: { gap: spacing.sm },
  proHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  rowText: { flex: 1 },
});
