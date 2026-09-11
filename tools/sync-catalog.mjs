/**
 * Mirrors the bundled site/vantage catalogue into Supabase.
 *
 * Dry-run is the default because the seed files are the authored source of
 * truth and a catalog deployment is an external mutation. Pass --apply only
 * after reviewing the printed counts and setting server-only credentials:
 * SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createClient } from '@supabase/supabase-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sites = JSON.parse(readFileSync(join(root, 'seed', 'sites.json'), 'utf8'));
const vantages = JSON.parse(readFileSync(join(root, 'seed', 'vantages.json'), 'utf8'));
const apply = process.argv.includes('--apply');

const siteRows = sites.map((site) => ({
  id: site.id,
  name_en: site.name.en,
  name_ne: site.name.ne ?? null,
  region_id: site.region ?? 'lumbini',
  active: true,
  updated_at: new Date().toISOString(),
}));
const vantageRows = vantages.map((vantage) => ({
  id: vantage.id,
  site_id: vantage.site_id,
  active: vantage.active !== false,
  updated_at: new Date().toISOString(),
}));

console.log(`catalog: ${siteRows.length} sites, ${vantageRows.length} vantages`);
if (!apply) {
  console.log('dry run only; pass --apply with server-only Supabase credentials to write');
  process.exit(0);
}

const url = (process.env.SUPABASE_URL ?? '').trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!url || !serviceRole) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.');
  process.exit(1);
}
if (serviceRole === process.env.EXPO_PUBLIC_SUPABASE_KEY) {
  console.error('Refusing to use the public app key as a catalog administration credential.');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const siteResult = await supabase.from('monitored_sites').upsert(siteRows, { onConflict: 'id' });
if (siteResult.error) throw siteResult.error;
const vantageResult = await supabase.from('monitored_vantages').upsert(vantageRows, { onConflict: 'id' });
if (vantageResult.error) throw vantageResult.error;
console.log('catalog applied; no absent row was deleted or deactivated');
