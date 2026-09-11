import { createContext, useContext, type ReactNode } from 'react';

import type { InterfaceLanguage } from '@/types';

const InterfaceLanguageContext = createContext<InterfaceLanguage>('en');

export function InterfaceLanguageProvider({
  language,
  children,
}: {
  language: InterfaceLanguage;
  children: ReactNode;
}) {
  return (
    <InterfaceLanguageContext.Provider value={language}>
      {children}
    </InterfaceLanguageContext.Provider>
  );
}

export function useInterfaceLanguage(): InterfaceLanguage {
  return useContext(InterfaceLanguageContext);
}
