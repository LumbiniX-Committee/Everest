import { useInterfaceLanguage } from './context';
import { visitorLiteralCopy } from './literals';

/** Localizes legacy interface copy for non-Text native properties. */
export function useVisitorLiteralCopy(): (value: string) => string {
  const language = useInterfaceLanguage();
  return (value) => visitorLiteralCopy(language, value);
}
