import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Divider, Text } from '@/components/ui';
import { notifications, permissions as permissionService } from '@/services';
import { useAppState, usePermissions } from '@/store';
import { colors, spacing } from '@/theme';
import type { PermissionKind, PermissionState } from '@/types';

import { OnboardingFrame } from './OnboardingFrame';

const ORDER: PermissionKind[] = ['location', 'camera', 'motion'];

type PermissionCopy = { title: string; reason: string; withoutIt: string };

/**
 * Notifications are asked for here, beside location, and not in Settings.
 *
 * They are not a `PermissionKind`: expo-notifications is loaded lazily by its
 * own service and is absent in Expo Go, so it never joined the three the
 * permissions store tracks. The consequence was that the only place that asked
 * was Settings → Arrivals, which most people never open — so `presentArrival`
 * checked for permission nobody had been offered, returned quietly, and the
 * arrival banner simply never existed. Asking here, next to the location
 * permission that makes arrivals possible at all, is what makes the feature
 * reach anyone.
 */
const NOTIFICATION_COPY: PermissionCopy = {
  title: 'Notifications',
  reason:
    'So Sākṣī can tell you when you have reached one of the precincts, with the phone in your pocket. One quiet banner on arrival — never a sound, and never anything else.',
  withoutIt: 'Without it, arrivals are only shown while the app is open.',
};

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
    router.replace('/(main)/tirtha/map');
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
          <Text variant="title">Four permissions</Text>
          <Text variant="body" tone="secondary">
            Each one is asked for only when you tap it. Sākṣī works without any of them — you will
            just have less of it.
          </Text>
        </View>

        <View style={styles.list}>
          {ORDER.map((kind) => (
            <PermissionCard
              key={kind}
              copy={permissionService.PERMISSION_COPY[kind]}
              state={states[kind]}
              busy={pending === kind}
              onRequest={() => onRequest(kind)}
              onOpenSettings={openSettings}
            />
          ))}
          <NotificationCard onOpenSettings={openSettings} />
        </View>
      </View>
    </OnboardingFrame>
  );
}

/**
 * Notifications, tracked here rather than in the permissions store.
 *
 * Local state because the notifications service owns its own permission and is
 * absent on hosts that cannot load expo-notifications — `isSupported` is what
 * turns this into an honest "not on this device" rather than a button that
 * opens no dialog.
 */
function NotificationCard({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [status, setStatus] = useState<PermissionState['status']>(
    notifications.isSupported ? 'undetermined' : 'unavailable',
  );
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!notifications.isSupported) return;
    if (await notifications.hasPermission()) setStatus('granted');
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onRequest = async () => {
    setBusy(true);
    try {
      const granted = await notifications.requestPermission();
      // `denied` rather than `blocked`: the platform will not say which, and
      // offering "Ask again" on a permanently blocked permission is the lesser
      // wrong — it opens nothing, whereas sending someone to Settings they did
      // not need is a longer detour.
      setStatus(granted ? 'granted' : 'denied');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PermissionCard
      copy={NOTIFICATION_COPY}
      state={{ kind: 'location', status, canAskAgain: status !== 'granted' }}
      busy={busy}
      onRequest={() => void onRequest()}
      onOpenSettings={onOpenSettings}
    />
  );
}

function PermissionCard({
  copy,
  state,
  busy,
  onRequest,
  onOpenSettings,
}: {
  copy: PermissionCopy;
  state: PermissionState;
  busy: boolean;
  onRequest: () => void;
  onOpenSettings: () => void;
}) {
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
