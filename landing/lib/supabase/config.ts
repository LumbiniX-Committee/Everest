export function supabaseUrl(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/$/, '');
}

export function supabasePublishableKey(): string {
  return (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
}

export function isSupabaseConfigured(): boolean {
  const url = supabaseUrl();
  const key = supabasePublishableKey();
  return Boolean(
    url
      && key
      && !url.includes('your-project.supabase.co')
      && !key.includes('your-publishable-key'),
  );
}

export function requireSupabaseConfig(): { url: string; key: string } {
  if (!isSupabaseConfigured()) {
    throw new Error(
      'Supabase is not configured for the portal. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }
  return { url: supabaseUrl(), key: supabasePublishableKey() };
}
