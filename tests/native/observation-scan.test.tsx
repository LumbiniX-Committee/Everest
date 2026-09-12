import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockScan = jest.fn(() => Promise.resolve({
  status: 'ok' as const,
  detections: [],
  inferenceMs: 24,
  model: { name: 'Test YOLO', version: '1', classes: ['crack'], mAP50: 0.8, runtime: 'onnx' as const },
}));
const mockModel = { name: 'Test YOLO' };

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: jest.fn(), push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    Button: ({ label, onPress }: { label: string; onPress?: () => void }) => React.createElement(
      Pressable,
      { accessibilityRole: 'button', accessibilityLabel: label, onPress },
      React.createElement(Text, null, label),
    ),
    Chip: ({ label }: { label: string }) => React.createElement(Text, null, label),
    Divider: () => React.createElement(View),
    Icon: () => React.createElement(View),
    MetaRow: ({ label, value }: { label: string; value: string }) => React.createElement(Text, null, `${label}: ${value}`),
    Screen: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    Text: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
  };
});

jest.mock('@/components', () => ({ TimeSeriesScrubber: () => null }));
jest.mock('@/components/common', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    EmptyState: () => React.createElement(View),
    LoadingState: ({ label }: { label: string }) => React.createElement(Text, { testID: 'loading' }, label),
  };
});
jest.mock('@/components/observation', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    ConditionSheet: () => null,
    YoloVisionOverlay: () => null,
    PathologySummaryCard: () => React.createElement(View, { testID: 'scan-summary' }),
  };
});
jest.mock('@/components/practice', () => ({ MeritAcknowledgement: () => null }));
jest.mock('@/core/vision/candidate', () => ({ detectorMessage: () => null }));
jest.mock('@/data', () => ({
  findSite: () => ({ id: 'site-a', name: 'Site A' }),
  findVantage: () => ({
    id: 'vantage-a',
    label: 'North view',
    positionToleranceM: 10,
    bearingToleranceDeg: 10,
  }),
}));
jest.mock('@/i18n/condition', () => ({
  conditionCategoryCopy: (_language: string, value: string) => value,
  conditionSeverityCopy: (_language: string, value: string) => value,
  conditionSubtypeCopy: (_language: string, value: string) => value,
}));
jest.mock('@/i18n/visitor', () => ({
  visitorCopy: (_language: string, key: string) => key,
  formatVisitorCopy: (_language: string, key: string) => key,
}));
jest.mock('@/services', () => ({
  database: {
    getObservation: () => Promise.resolve({
      id: 'observation-a',
      vantageId: 'vantage-a',
      siteId: 'site-a',
      capturedAt: '2026-09-13T00:00:00.000Z',
      photoUri: 'file://observation.jpg',
      coordinate: { latitude: 27.67, longitude: 85.32 },
      bearing: 90,
      pitch: 0,
      positionErrorM: 2,
      bearingErrorDeg: 1,
      alignScore: 0.98,
      gpsAccuracyM: 3,
      gateMode: 'aligned',
      assessment: 'unreviewed',
      synced: false,
    }),
    listConditionReports: () => Promise.resolve([]),
    listObservations: () => Promise.resolve([]),
  },
}));
jest.mock('@/services/ai/yoloEngine', () => ({
  // A new wrapper on every render reproduces the real hook's identity changes
  // while keeping the scan function itself stable.
  useDamageDetector: () => ({
    status: 'ready',
    model: mockModel,
    scanning: false,
    reason: null,
    scan: mockScan,
  }),
  scanToSuggestion: () => null,
}));
jest.mock('@/store', () => ({
  usePractice: () => ({ recognise: jest.fn(), summary: { dayComplete: false } }),
  usePreferences: () => ({ preferences: { interfaceLanguage: 'en' } }),
  useQuests: () => ({ creditConditionReport: jest.fn() }),
}));
jest.mock('@/theme', () => ({ colors: {}, radii: {}, spacing: {} }));
jest.mock('@/utils', () => ({
  formatBearing: () => '90°',
  formatCoordinate: () => '27.67, 85.32',
  formatDelta: () => '1°',
  formatDistance: () => '2 m',
  formatTimestamp: () => '13 Sep 2026',
}));

import { ObservationScreen } from '@/features/sakshi/ObservationScreen';

describe('ObservationScreen damage scan', () => {
  it('finishes the automatic scan when detector wrapper identity changes', async () => {
    const screen = await render(<ObservationScreen observationId="observation-a" />);

    await screen.findByTestId('scan-summary');
    await waitFor(() => expect(mockScan).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('observation.scanning')).toBeNull();
  });
});
