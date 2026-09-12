import { redirect } from 'next/navigation';

/**
 * The true root has no content of its own: the public site lives under
 * `[locale]`. A bare-domain visit picks English rather than guessing, the
 * same default `DEFAULT_LOCALE` in `lib/i18n.ts` names.
 */
export default function RootPage() {
  redirect('/en');
}
