import type { ReactNode } from 'react';

import { AppStateProvider } from './app-state';
import { PermissionsProvider } from './permissions';
import { PracticeProvider } from './practice';
import { PreferencesProvider } from './preferences';
import { ArrivalProvider } from './arrival';
import { QuestsProvider } from './quests';

export { AppStateProvider, useAppState } from './app-state';
export { PermissionsProvider, usePermissions, usePermission } from './permissions';
export { PracticeProvider, usePractice } from './practice';
export { QuestsProvider, useQuests } from './quests';
export { PreferencesProvider, usePreferences } from './preferences';
export { ArrivalProvider, useArrival } from './arrival';

/**
 * Single mounting point for app-wide state, so the root layout composes one
 * element instead of a nesting pyramid that grows with every new provider.
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppStateProvider>
      <PreferencesProvider>
        <PermissionsProvider>
          <PracticeProvider>
            <QuestsProvider>
              <ArrivalProvider>{children}</ArrivalProvider>
            </QuestsProvider>
          </PracticeProvider>
        </PermissionsProvider>
      </PreferencesProvider>
    </AppStateProvider>
  );
}
