const strict = !process.env.EAS_BUILD_PROFILE || process.env.EAS_BUILD_PROFILE === 'production';
if (!strict) {
  console.log(`release configuration check skipped for EAS profile ${process.env.EAS_BUILD_PROFILE}`);
  process.exit(0);
}

const api = process.env.EXPO_PUBLIC_API_URL?.trim();
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_KEY?.trim();
const portalUrl = process.env.EXPO_PUBLIC_PORTAL_URL?.trim();
const invalidEndpoint = /(?:localhost|127\.0\.0\.1|192\.168\.|10\.0\.2\.2|mock-api|railway\.app|your-|example|placeholder)/i;

if (api && invalidEndpoint.test(api)) {
  console.error('Release configuration points to the local-only mock API.');
  process.exit(1);
}
if (!supabaseUrl || !supabaseKey || invalidEndpoint.test(`${supabaseUrl} ${supabaseKey}`)) {
  console.error('A real Supabase URL and publishable key are required for a production build.');
  process.exit(1);
}
if (!portalUrl || invalidEndpoint.test(portalUrl)) {
  console.error('A real custodian portal URL is required for a production build.');
  process.exit(1);
}
try {
  if (new URL(supabaseUrl).protocol !== 'https:' || new URL(portalUrl).protocol !== 'https:') throw new Error('HTTPS required');
} catch {
  console.error('Production Supabase and portal URLs must be valid HTTPS URLs.');
  process.exit(1);
}
console.log('production app configuration passed');
