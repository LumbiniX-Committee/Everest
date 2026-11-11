import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Card, Screen, Text } from '@/components/ui';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePlan, usePreferences } from '@/store';
import { spacing } from '@/theme';

import { PlanComparison } from './PlanComparison';
import { RedeemCode } from './RedeemCode';

export function PlansScreen() {
  const { preferences } = usePreferences();
  const { gatingOn, isPro, daysLeft } = usePlan();
  const ui = useVisitorLiteralCopy();

  return (
    <Screen scroll>
      <ScreenHeader title="Your plan" subtitle={gatingOn ? 'Free covers the essentials. Pro adds depth for your whole trip.' : undefined} />
      <View style={styles.body}>
        {!gatingOn ? (
          <Card>
            <Text variant="bodyStrong">All features are open during this early release.</Text>
          </Card>
        ) : isPro ? (
          <Card>
            <Text variant="bodyStrong">Pro is active</Text>
            {daysLeft != null ? (
              <Text variant="body" tone="secondary">
                {daysLeft} {ui('days left')}
              </Text>
            ) : null}
          </Card>
        ) : null}
        {gatingOn ? (
          <>
            <PlanComparison visitor={preferences.visitorType} />
            <RedeemCode />
            <Text variant="caption" tone="muted">
              Payment in the app is not available yet. Your records and saved photographs stay yours on any plan.
            </Text>
          </>
        ) : (
          // Store builds: no prices and no code box, which would read as
          // selling digital features outside the store's billing.
          <Text variant="body" tone="secondary">
            Offline maps, 3D views, close-up guidance, audio and the reflection companion are all included.
          </Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingBottom: spacing.xl },
});
