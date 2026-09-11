import React from 'react';
import { render } from '@testing-library/react-native';

import { Text } from '@/components/ui/Text';
import { InterfaceLanguageProvider } from '@/i18n/context';

describe('visitor interface text boundary', () => {
  it('renders registered interface copy in Nepali', async () => {
    const screen = await render(
      <InterfaceLanguageProvider language="ne">
        <Text>Open secure portal</Text>
      </InterfaceLanguageProvider>,
    );

    screen.getByText('सुरक्षित पोर्टल खोल्नुहोस्');
  });

  it('preserves authored evidence when translation is disabled', async () => {
    const screen = await render(
      <InterfaceLanguageProvider language="ne">
        <Text translate={false}>Source</Text>
      </InterfaceLanguageProvider>,
    );

    screen.getByText('Source');
  });
});
