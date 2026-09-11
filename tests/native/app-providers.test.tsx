import React from 'react';
import { Text, View } from 'react-native';
import { render, within } from '@testing-library/react-native';

function mockProvider(testID: string) {
  return function TestProvider({ children }: { children: React.ReactNode }) {
    return <View testID={testID}>{children}</View>;
  };
}

jest.mock('@/store/app-state', () => ({
  AppStateProvider: mockProvider('app-state-provider'),
  useAppState: jest.fn(),
}));
jest.mock('@/store/preferences', () => ({
  PreferencesProvider: mockProvider('preferences-provider'),
  usePreferences: jest.fn(),
}));
jest.mock('@/store/permissions', () => ({
  PermissionsProvider: mockProvider('permissions-provider'),
  usePermissions: jest.fn(),
  usePermission: jest.fn(),
}));
jest.mock('@/store/practice', () => ({
  PracticeProvider: mockProvider('practice-provider'),
  usePractice: jest.fn(),
}));
jest.mock('@/store/quests', () => ({
  QuestsProvider: mockProvider('quests-provider'),
  useQuests: jest.fn(),
}));
jest.mock('@/store/arrival', () => ({
  ArrivalProvider: mockProvider('arrival-provider'),
  useArrival: jest.fn(),
}));

import { AppProviders } from '@/store';

describe('AppProviders', () => {
  it('mounts every application provider around the route tree', async () => {
    const screen = await render(
      <AppProviders>
        <Text>route content</Text>
      </AppProviders>,
    );

    const appState = screen.getByTestId('app-state-provider');
    const preferences = within(appState).getByTestId('preferences-provider');
    const permissions = within(preferences).getByTestId('permissions-provider');
    const practice = within(permissions).getByTestId('practice-provider');
    const quests = within(practice).getByTestId('quests-provider');
    const arrival = within(quests).getByTestId('arrival-provider');

    within(arrival).getByText('route content');
  });
});
