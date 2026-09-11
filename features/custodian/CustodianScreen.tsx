import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ScreenHeader } from '@/components/common';
import { Button, Card, Screen, Text } from '@/components/ui';
import { application } from '@/services';
import { spacing } from '@/theme';

/**
 * Custodian work is privileged and belongs in the responsive web portal.
 *
 * Keeping a second report client here would also require a second Supabase
 * session beside the visitor's anonymous evidence-author session. Linking to
 * the portal avoids silently changing who owns queued observations.
 */
export function CustodianScreen() {
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setOpening(true);
    setError(null);
    try {
      await application.openCustodianPortal();
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Could not open the portal.');
    } finally {
      setOpening(false);
    }
  }

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Sākṣī"
        title="Custodian portal"
        subtitle="Secure report triage for the institutions responsible for each site."
      />
      <Card style={styles.card}>
        <Text variant="heading">One protected record</Text>
        <Text variant="body" tone="secondary">
          The portal works on phones and computers. Email sign-in and site assignments
          keep one custodian from reading another site's evidence.
        </Text>
        <Text variant="body" tone="secondary">
          Your visitor session stays on this device, so queued photographs keep their
          original author and continue syncing normally.
        </Text>
        <View style={styles.action}>
          <Button label="Open secure portal" onPress={openPortal} loading={opening} />
        </View>
        {error ? <Text variant="label" tone="secondary">{error}</Text> : null}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  action: { alignItems: 'flex-start' },
});
