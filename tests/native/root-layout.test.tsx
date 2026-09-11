import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  const Stack = ({ children }: { children: React.ReactNode }) =>
    React.createElement(View, { testID: 'root-stack' }, children);
  Stack.Screen = ({ name }: { name: string }) => React.createElement(Text, null, name);
  return { Stack, useRouter: () => ({ push: jest.fn() }) };
});
jest.mock('expo-status-bar', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { StatusBar: () => React.createElement(View, { testID: 'status-bar' }) };
});
jest.mock('react-native-gesture-handler', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    GestureHandlerRootView: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'gesture-root' }, children),
  };
});
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    SafeAreaProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'safe-area-provider' }, children),
  };
});
jest.mock('@/store', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    AppProviders: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, { testID: 'app-providers' }, children),
    useAppState: () => ({ hydrated: true }),
    usePreferences: () => ({
      hydrated: true,
      preferences: { colorTheme: 'white' },
    }),
  };
});
jest.mock('../../services/index', () => ({
  __esModule: true,
  notifications: { subscribeToArrivalTaps: jest.fn(() => jest.fn()) },
}));
jest.mock('../../services/sync', () => ({ syncPendingObservations: jest.fn() }));
jest.mock('@/theme', () => ({
  colors: { background: '#fff' },
  useAppFonts: () => ({ ready: true }),
}));

import RootLayout from '@/app/_layout';

describe('RootLayout', () => {
  it('boots the hydrated provider tree and releases the splash screen', async () => {
    const screen = await render(<RootLayout />);

    screen.getByTestId('gesture-root');
    screen.getByTestId('safe-area-provider');
    screen.getByTestId('app-providers');
    screen.getByTestId('root-stack');
    screen.getByText('(main)');

    await waitFor(() => expect(screen.getByTestId('root-stack')).toBeTruthy());
  });
});
