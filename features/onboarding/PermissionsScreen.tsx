import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Text } from '@/components/ui';
import { permissions as permissionService } from '@/services';
import { useAppState, usePermissions } from '@/store';
import { colors, spacing } from '@/theme';
import type { PermissionKind, PermissionState } from '@/types';

import { OnboardingFrame } from './OnboardingFrame';

const ORDER: PermissionKind[] = ['location', 'camera', 'motion'];

/**
 * Permissions primer.
 *
 * Nothing is requested on arrival. Each permission is asked for individually,
 * only after its reason is on screen, and only when the user taps.
 *
 * Every refusal is a valid ending. "Enter Lumbini" is enabled from the first
 * frame and never gated on a grant — a person who declines all three still gets
 * a working app, which is stated on screen rather than discovered later.
 */
export function PermissionsScreen() {
  const router = useRouter();
  const { states, request, openSettings } = usePermissions();
  const { completeOnboarding } = useAppState();
  const [pending, setPending] = useState<PermissionKind | null>(null);

  const onRequest = async (kind: PermissionKind) => {
    setPending(kind);
    try {
      await request(kind);
    } finally {
      setPending(null);
    }
  };

  const onEnter = async () => {
    await completeOnboarding();
    router.replace('/(main)/tirtha');
  };

  return (
    <OnboardingFrame
      stepKey="permissions"
      footer={
        <>
          <Button label="Enter Lumbini" block onPress={onEnter} />
          <Text variant="caption" tone="muted" center>
            You can change any of these later, in your device settings.
          </Text>
        </>
      }
    >
      <View style={styles.wrap}>
        <View style={styles.intro}>
          <Text variant="title">Three permissions</Text>
          <Text variant="body" tone="secondary">
            Each one is asked for only when you tap it. Sākṣī works without any of them — you will
            just have less of it.
          </Text>
        </View>

        <View style={styles.list}>
          {ORDER.map((kind) => (
            <PermissionCard
              key={kind}
              kind={kind}
              state={states[kind]}
              busy={pending === kind}
              onRequest={() => onRequest(kind)}
              onOpenSettings={openSettings}
            />
          ))}
        </View>
      </View>
    </OnboardingFrame>
  );
}

function PermissionCard({
  kind,
  state,
  busy,
  onRequest,
  onOpenSettings,
}: {
  kind: PermissionKind;
  state: PermissionState;
  busy: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}) {
  const copy = permissionService.PERMISSION_COPY[kind];

  return (
    <Card>
      <View style={styles.cardHead}>
        <Text variant="heading">{copy.title}</Text>
        <StatusMark state={state} />
      </View>

      <Text variant="body" tone="secondary" style={styles.reason}>
        {copy.reason}
      </Text>

      <Divider />

      <View style={styles.cardFoot}>
        <PermissionAction
          state={state}
          busy={busy}
          withoutIt={copy.withoutIt}
          onRequest={onRequest}
          onOpenSettings={onOpenSettings}
        />
      </View>
    </Card>
  );
}

/**
 * The action changes with the status, because offering the wrong one strands
 * people: a "Grant" button on a blocked permission opens no dialog and looks
 * broken, so blocked states get a route to Settings instead.
 */
function PermissionAction({
  state,
  busy,
  withoutIt,
  onRequest,
  onOpenSettings,
}: {
  state: PermissionState;
  busy: boolean;
  withoutIt: string;
  onRequest: () => void;
  onOpenSettings: () => void;
}) {
  switch (state.status) {
    case 'granted':
      return (
        <Text variant="caption" tone="resolved">
          Granted.
        </Text>
      );

    case 'blocked':
      return (
        <View style={styles.actionColumn}>
          <Text variant="caption" tone="secondary">
            {withoutIt} To change this, your device settings are the only route.
          </Text>
          <Button label="Open settings" variant="secondary" onPress={onOpenSettings} />
        </View>
      );

    case 'denied':
      return (
        <View style={styles.actionColumn}>
          <Text variant="caption" tone="secondary">
            {withoutIt}
          </Text>
          <Button label="Ask again" variant="secondary" loading={busy} onPress={onRequest} />
        </View>
      );

    case 'unavailable':
      return (
        <Text variant="caption" tone="muted">
          This device does not have it. {withoutIt}
        </Text>
      );

    case 'undetermined':
    default:
      return <Button label="Allow" variant="secondary" loading={busy} onPress={onRequest} />;
  }
}

function StatusMark({ state }: { state: PermissionState }) {
  const color =
    state.status === 'granted'
      ? colors.resolved
      : state.status === 'blocked'
        ? colors.openCondition
        : state.status === 'denied'
          ? colors.alignmentSeeking
          : colors.border;

  return <View style={[styles.statusDot, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xl },
  intro: { gap: spacing.md },
  list: { gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  reason: { marginTop: spacing.xs, marginBottom: spacing.md },
  cardFoot: { paddingTop: spacing.md },
  actionColumn: { gap: spacing.md, alignItems: 'flex-start' },
});
