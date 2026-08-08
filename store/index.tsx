import type { ReactNode } from 'react';

import { AppStateProvider } from './app-state';
import { PermissionsProvider } from './permissions';
import { PracticeProvider } from './practice';
import { QuestsProvider } from './quests';

export { AppStateProvider, useAppState } from './app-state';
export { PermissionsProvider, usePermissions, usePermission } from './permissions';
export { PracticeProvider, usePractice } from './practice';
export { QuestsProvider, useQuests } from './quests';

/**
 * Single mounting point for app-wide state, so the root layout composes one
 * element instead of a nesting pyramid that grows with every new provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <PermissionsProvider>
        <PracticeProvider>
          <QuestsProvider>{children}</QuestsProvider>
        </PracticeProvider>
      </PermissionsProvider>
    </AppStateProvider>
  );
}
