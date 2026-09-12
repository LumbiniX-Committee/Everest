const legacyApi = process.env.NEXT_PUBLIC_API_URL?.trim();
if (legacyApi && /(?:localhost|127\.0\.0\.1|mock-api)/i.test(legacyApi)) {
  console.error('Refusing a production build configured for the local mock custodian API.');
  process.exit(1);
}

if (process.env.SAKSHI_REQUIRE_PRODUCTION_CONFIG === '1') {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key || /your[-_]|example|placeholder/i.test(`${url} ${key}`)) {
    console.error('Production Supabase URL and publishable key are required.');
    process.exit(1);
  }
  try {
    if (new URL(url).protocol !== 'https:') throw new Error('not HTTPS');
  } catch {
    console.error('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL.');
    process.exit(1);
  }
}

console.log('production configuration check passed');
