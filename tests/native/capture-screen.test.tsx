import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

const mockTakePicture = jest.fn(() => Promise.resolve({ uri: 'cache://capture.jpg' }));
const mockInsertObservation = jest.fn((_observation: unknown) => Promise.resolve());
const mockCreditObservation = jest.fn(() => Promise.resolve());
const mockReplace = jest.fn();
const mockEvents: string[] = [];
let mockInterfaceLanguage: 'en' | 'ne' = 'en';

jest.mock('expo-camera', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    CameraView: React.forwardRef(function TestCamera(_props: unknown, ref: React.Ref<unknown>) {
      React.useImperativeHandle(ref, () => ({ takePictureAsync: mockTakePicture }));
      return React.createElement(View, { testID: 'camera' });
    }),
  };
});
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'file://documents/',
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: false })),
  copyAsync: jest.fn(() => {
    mockEvents.push('copy');
    return Promise.resolve();
  }),
}));
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), replace: mockReplace }),
}));
jest.mock('@/data', () => ({
  findVantage: (() => {
    const vantage = {
      id: 'vantage-a',
      siteId: 'site-a',
      coordinate: { latitude: 27.67, longitude: 85.32 },
      bearing: 90,
      pitch: 0,
    };
    return () => vantage;
  })(),
  findSite: (() => {
    const site = { id: 'site-a', name: 'Site A', photography: 'allowed' };
    return () => site;
  })(),
  historicalImagesForSite: () => [],
  nowImageForSite: () => undefined,
}));
jest.mock('@/hooks', () => ({
  useAlignment: () => ({
    phase: 'locked',
    progress: 1,
    coordinate: { latitude: 27.6701, longitude: 85.3201 },
    heading: 91,
    pitch: 1,
    distanceM: 2,
    bearingDeltaDeg: 1,
    alignScore: 0.98,
    gpsAccuracyM: 3,
  }),
}));
jest.mock('@/services', () => ({
  camera: { getCaptureOptions: () => ({ quality: 0.8 }) },
  database: {
    listObservations: jest.fn(() => Promise.resolve([])),
    insertObservation: (observation: unknown) => {
      mockEvents.push('local-insert');
      return mockInsertObservation(observation);
    },
  },
}));
jest.mock('@/store', () => ({
  usePermission: () => ({
    state: { status: 'granted' },
    request: jest.fn(),
    openSettings: jest.fn(),
  }),
  usePreferences: () => ({
    preferences: { photoQuality: 0.8, interfaceLanguage: mockInterfaceLanguage },
  }),
  useQuests: () => ({
    creditVantageObservation: () => {
      mockEvents.push('quest-credit');
      return mockCreditObservation();
    },
  }),
}));
jest.mock('@/components/thennow', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { ThenNowCompare: () => React.createElement(View, { testID: 'then-now-review' }) };
});
jest.mock('@/components/common', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { EmptyState: () => React.createElement(View) };
});
jest.mock('@/components/reticle', () => {
  const React = require('react');
  const { View } = require('react-native');
  return { Reticle: () => React.createElement(View, { testID: 'reticle' }) };
});
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    Button: ({ label, onPress, accessibilityHint }: { label: string; onPress?: () => void; accessibilityHint?: string }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: 'button', accessibilityLabel: label, accessibilityHint, onPress },
        React.createElement(Text, null, label),
      ),
    Divider: () => React.createElement(View),
    MetaRow: ({ label, value }: { label: string; value: string }) =>
      React.createElement(Text, null, `${label}: ${value}`),
    Screen: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    Text: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
  };
});
jest.mock('@/theme', () => ({
  colors: {},
  layers: { reticle: 1 },
  radii: {},
  spacing: {},
}));

import { CaptureScreen } from '@/features/sakshi/CaptureScreen';

describe('CaptureScreen', () => {
  beforeEach(() => {
    mockEvents.length = 0;
    mockInterfaceLanguage = 'en';
  });

  it('reviews a frame before writing locally, then navigates only after persistence', async () => {
    const screen = await render(<CaptureScreen vantageId="vantage-a" />);

    await fireEvent.press(screen.getByLabelText('Record aligned observation'));
    await screen.findByText("Review today's frame");

    expect(mockInsertObservation).not.toHaveBeenCalled();
    screen.getByTestId('then-now-review');

    await fireEvent.press(screen.getByLabelText('Submit observation'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

    expect(mockEvents).toEqual(['copy', 'local-insert', 'quest-credit']);
    expect(mockInsertObservation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.stringMatching(/^obs-/),
        photoUri: expect.stringMatching(/^file:\/\/documents\/observations\//),
        synced: false,
        gateMode: 'aligned',
      }),
    );
  });

  it('renders and submits the same review journey in Nepali', async () => {
    mockInterfaceLanguage = 'ne';
    const screen = await render(<CaptureScreen vantageId="vantage-a" />);

    await fireEvent.press(screen.getByLabelText('मिलाइएको अवलोकन अभिलेख गर्नुहोस्'));
    await screen.findByText('आजको फ्रेम समीक्षा गर्नुहोस्');
    screen.getByText('पेश गरिने तथ्याङ्क');

    await fireEvent.press(screen.getByLabelText('अवलोकन पेश गर्नुहोस्'));
    await waitFor(() => expect(mockReplace).toHaveBeenCalledTimes(1));

    expect(mockEvents).toEqual(['copy', 'local-insert', 'quest-credit']);
  });
});
