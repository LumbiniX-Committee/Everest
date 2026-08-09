import { StyleSheet } from 'react-native';
import { LoadingState, ScreenHeader } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { usePermissions } from '@/store';
import { spacing } from '@/theme';
import { canPrompt, needsSettings, type PermissionKind, type PermissionState } from '@/types';

import { SettingsSection } from './components';

const DETAIL: Record<PermissionKind, { label: string; why: string }> = {
  camera: {
    label: 'Camera',
    why: 'Required. Without it the witness view cannot compare today against the historical frame.',
  },
  location: {
    label: 'Location',
    why: 'Finds nearby sites and guides you to a fixed viewpoint. The app works without it, but you navigate by hand.',
  },
  motion: {
    label: 'Motion',
    why: 'Aligns the device against a vantage. Without it the reticle cannot report a lock.',
  },
};

const STATUS_TEXT: Record<PermissionState['status'], string> = {
  granted: 'Granted',
  denied: 'Not granted',
  blocked: 'Blocked in system settings',
  undetermined: 'Not yet asked',
  unavailable: 'Not available on this device',
};

/**
 * Permission status, and the one action that will actually change it.
 *
 * The denied/blocked distinction from types/permissions.ts is the whole point
 * of this screen: a "Grant" button on a blocked permission opens nothing, so
 * blocked gets a route to system Settings instead.
 */
export function PermissionsScreen() {
  const { hydrated, states, request, openSettings } = usePermissions();

  if (!hydrated) {
    return <LoadingState label="Checking permissions" />;
  }

  return (
    <Screen scroll>
      <ScreenHeader
        eyebrow="Settings"
        title="Permissions"
        subtitle="What the app has been allowed to use, and what that changes."
      />

      {(Object.keys(DETAIL) as PermissionKind[]).map((kind) => {
        const state = states[kind];
        const { label, why } = DETAIL[kind];

        return (
          <SettingsSection key={kind} title={label} footnote={why}>
            <Text variant="body" tone={state.status === 'granted' ? 'resolved' : 'secondary'} style={styles.status}>
              {STATUS_TEXT[state.status]}
            </Text>

            {canPrompt(state) ? (
              <Button label={`Grant ${label.toLowerCase()}`} variant="secondary" block onPress={() => void request(kind)} />
            ) : null}

            {needsSettings(state) ? (
              <Button
                label="Open system settings"
                variant="secondary"
                block
                accessibilityHint="The app can no longer ask for this. Only system settings can change it."
                onPress={() => void openSettings()}
              />
            ) : null}
          </SettingsSection>
        );
      })}

      <Text variant="caption" tone="muted">
        Changes made in system settings are picked up when you return. The app re-checks on
        foreground.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { paddingHorizontal: spacing.base, paddingVertical: spacing.md },
});
