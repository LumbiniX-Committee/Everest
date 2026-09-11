import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

let mockInterfaceLanguage: 'en' | 'ne' = 'en';

jest.mock('@/store', () => ({
  usePreferences: () => ({
    preferences: { interfaceLanguage: mockInterfaceLanguage },
  }),
}));

jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    BottomSheet: ({ visible, children, title, subtitle }: {
      visible: boolean;
      children: React.ReactNode;
      title: string;
      subtitle?: string;
    }) => visible
      ? React.createElement(
          View,
          null,
          React.createElement(Text, null, title),
          subtitle ? React.createElement(Text, null, subtitle) : null,
          children,
        )
      : null,
    Button: ({ label, onPress }: { label: string; onPress?: () => void }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: 'button', accessibilityLabel: label, onPress },
        React.createElement(Text, null, label),
      ),
    Chip: ({ label, onPress }: { label: string; onPress?: () => void }) =>
      React.createElement(
        Pressable,
        { accessibilityRole: 'button', accessibilityLabel: label, onPress },
        React.createElement(Text, null, label),
      ),
    Text: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
  };
});

import { ConditionSheet } from '@/components/observation/ConditionSheet';

describe.each([
  {
    language: 'en' as const,
    category: 'Structural',
    subtype: 'New crack',
    severity: 'Concerning',
    noteLabel: 'Optional note',
    record: 'Record what you saw',
  },
  {
    language: 'ne' as const,
    category: 'संरचनात्मक',
    subtype: 'नयाँ चिरा',
    severity: 'चिन्ताजनक',
    noteLabel: 'वैकल्पिक टिप्पणी',
    record: 'देखेको कुरा अभिलेख गर्नुहोस्',
  },
])('ConditionSheet $language journey', ({ language, category, subtype, severity, noteLabel, record }) => {
  it('renders translated choices and submits canonical evidence values', async () => {
    mockInterfaceLanguage = language;
    const onSubmit = jest.fn();
    const screen = await render(
      <ConditionSheet visible onClose={jest.fn()} onSubmit={onSubmit} />,
    );

    await fireEvent.press(screen.getByLabelText(category));
    await fireEvent.press(screen.getByLabelText(subtype));
    await fireEvent.press(screen.getByLabelText(severity));
    await fireEvent.changeText(screen.getByLabelText(noteLabel), '  visitor note  ');
    await fireEvent.press(screen.getByLabelText(record));

    expect(onSubmit).toHaveBeenCalledWith({
      category: 'structural',
      subtype: 'New crack',
      severity: 'concerning',
      note: 'visitor note',
      aiAssisted: undefined,
    });
  });
});
