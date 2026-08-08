import { StyleSheet, View } from 'react-native';

import { MetaRow } from '@/components/ui';
import { spacing } from '@/theme';
import { formatBearing, formatDelta, formatDistance } from '@/utils';
import type { AlignmentState, Vantage } from '@/types';

/**
 * The numeric half of alignment. The reticle says "warmer / colder"; this says
 * exactly how far off, in units an observer can act on.
 *
 * Deliberately plain and always mono — this is instrument output, and rounding
 * it into friendly language would hide the precision the record depends on.
 */
export function AlignmentReadout({
  alignment,
  vantage,
}: {
  alignment: AlignmentState;
  vantage: Vantage;
}) {
  const locked = alignment.phase === 'locked';

  return (
    <View style={styles.block}>
      <MetaRow
        label="Distance"
        value={formatDistance(alignment.distanceM)}
        tone={locked ? 'locked' : 'primary'}
      />
      <MetaRow
        label="Turn"
        value={formatDelta(alignment.bearingDeltaDeg)}
        tone={locked ? 'locked' : 'seeking'}
      />
      <MetaRow label="Target bearing" value={formatBearing(vantage.bearing)} tone="secondary" />
      <MetaRow
        label="Tilt"
        value={formatDelta(alignment.pitchDeltaDeg)}
        tone={locked ? 'locked' : 'secondary'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.xxs },
});
