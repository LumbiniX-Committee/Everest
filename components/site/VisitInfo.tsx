import { StyleSheet, View } from 'react-native';

import { MetaRow, Text } from '@/components/ui';
import { feeAmount, FEES_SOURCE } from '@/data';
import { usePreferences } from '@/store';
import { spacing } from '@/theme';
import type { EntryFee } from '@/types';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';

/** Rupees, written the way the gate signs write them. */
const rupees = (amount: number) => `NPR ${amount.toLocaleString('en-US')}`;

const WHEELCHAIR: Record<string, string> = {
  yes: 'Step-free access',
  limited: 'Partly step-free',
  no: 'Not step-free',
};

/**
 * Practical facts for planning a visit. Unknown is said plainly, never guessed:
 * a wrong opening time sends someone to a locked gate.
 */
export function VisitInfo({ fee, hours, wheelchair }: { fee?: EntryFee; hours?: string | null; wheelchair?: string | null }) {
  const { preferences } = usePreferences();
  const ui = useVisitorLiteralCopy();
  const visitor = preferences.visitorType;

  return (
    <View style={styles.wrap}>
      <Text variant="heading">Plan your visit</Text>
      <MetaRow
        label={ui('Entry fee')}
        mono={false}
        value={
          fee
            ? feeAmount(fee, visitor) === 0
              ? ui('Free')
              : rupees(feeAmount(fee, visitor))
            : ui('Not known')
        }
      />
      {fee && visitor !== 'nepali' ? (
        <Text variant="caption" tone="secondary">
          {[
            ui('Foreign visitor rate.'),
            `${ui('SAARC')} ${rupees(fee.saarc)}`,
            `${ui('Nepali visitors')} ${fee.nepali === 0 ? ui('Free') : rupees(fee.nepali)}`,
          ].join(' · ')}.`}
        </Text>
      ) : null}
      {fee?.note ? (
        <Text variant="caption" tone="secondary" translate={false}>
          {fee.note}
        </Text>
      ) : null}
      {fee ? (
        <Text variant="caption" tone="muted">
          {`${ui('Nepal Tourism Board, checked')} ${FEES_SOURCE.lastChecked}. ${ui('Confirm at the gate.')}`}
        </Text>
      ) : null}
      <MetaRow label={ui('Opening hours')} mono={false} value={hours ?? ui('Not known')} />
      <MetaRow label={ui('Access')} mono={false} value={wheelchair && WHEELCHAIR[wheelchair] ? ui(WHEELCHAIR[wheelchair]) : ui('Not known')} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
});
