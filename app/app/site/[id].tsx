/**
 * Route wrapper — /site/[id]. Loads the site detail bundle and renders
 * SiteDetailScreen with an en/ne toggle held in local state.
 */

import { useEffect, useState } from 'react';
import type { SiteDetailResponse, Language } from '../../../shared/types.ts';
import { SiteDetailScreen } from '../../src/screens/SiteDetailScreen';
import { api } from '../../src/api/client';
import { useLocalSearchParams } from 'expo-router';

export default function SiteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [detail, setDetail] = useState<SiteDetailResponse | null>(null);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    if (id) api.siteDetail(id).then(setDetail);
  }, [id]);

  if (!detail) return null; // A: render a loading state
  return (
    <SiteDetailScreen
      detail={detail}
      lang={lang}
      onToggleLang={() => setLang((l) => (l === 'en' ? 'ne' : 'en'))}
    />
  );
}
