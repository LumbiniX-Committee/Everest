import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

jest.mock('@/components/common', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return { ScreenHeader: ({ title, subtitle }: { title: string; subtitle: string }) => React.createElement(Text, null, `${title} | ${subtitle}`) };
});
jest.mock('@/components/ui', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');
  return {
    Screen: ({ children }: { children: React.ReactNode }) => React.createElement(View, null, children),
    Text: ({ children }: { children: React.ReactNode }) => React.createElement(Text, null, children),
    Button: ({ label, onPress }: { label: string; onPress: () => void }) =>
      React.createElement(Pressable, { onPress, accessibilityRole: 'button', accessibilityLabel: label }, React.createElement(Text, null, label)),
  };
});
jest.mock('@/features/settings/components', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return {
    SettingsSection: ({ title, children }: { title: string; children: React.ReactNode }) =>
      React.createElement(View, null, React.createElement(Text, null, title), children),
  };
});

import { OWNER } from '@/constants/owner';
import { OmxLabScreen } from '@/features/settings/OmxLabScreen';

describe('Settings → About O.M.X Lab', () => {
  it('names the company, its details and how to reach it', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    const screen = await render(<OmxLabScreen />);
    expect(screen.getByText('About O.M.X Lab | The company that makes and runs Sākṣī')).toBeTruthy();
    expect(screen.getByLabelText('O.M.X Lab Private Limited')).toBeTruthy(); // the logo
    expect(screen.getByText(OWNER.registrationNo)).toBeTruthy();
    expect(screen.getByText(OWNER.pan)).toBeTruthy();
    expect(screen.getByText('Bharatpur-2, Chitwan, Nepal')).toBeTruthy();
    await fireEvent.press(screen.getByLabelText('Email O.M.X Lab'));
    expect(open).toHaveBeenCalledWith('mailto:hello@omxlab.com.np');
  });

  it('matches what the website says', () => {
    const site = require('fs').readFileSync(require('path').join(__dirname, '../../landing/lib/site.ts'), 'utf8') as string;
    for (const value of [OWNER.legalName, OWNER.email, OWNER.registrationNo, OWNER.pan]) expect(site).toContain(value);
  });
});
