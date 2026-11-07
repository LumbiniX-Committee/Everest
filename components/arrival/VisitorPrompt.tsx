import { StyleSheet, View } from 'react-native';

import { Button, Card, Text } from '@/components/ui';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import { VISITOR_TYPE_OPTIONS } from '@/types';

/** Asks once, for people who installed before visitor type existed. */
export function VisitorPrompt() {
  const { preferences, update } = usePreferences();
  if (preferences.visitorType !== 'unset') return null;

  return (
    <Card style={styles.card}>
      <Text variant="heading">Who is visiting?</Text>
      <Text variant="body" tone="secondary">
        Entry fees and prices differ in Nepal. This shows you the right ones.
      </Text>
      <View style={styles.row}>
        {VISITOR_TYPE_OPTIONS.map((option) => (
          <Button key={option.value} label={option.label} variant="secondary" onPress={() => void update('visitorType', option.value)} />
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
