// Creates Pro activation codes. Server-only: needs the service role key, so never
// run this from the app. Only hashes are stored, so copy the printed codes now.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/issue-codes.mjs --count 5 --days 30 --note "May batch"
import { createHash, randomInt } from 'node:crypto';
import { parseArgs } from 'node:util';

import { createClient } from '@supabase/supabase-js';

const { values } = parseArgs({
  options: {
    count: { type: 'string', default: '1' },
    days: { type: 'string', default: '30' },
    note: { type: 'string' },
    'valid-days': { type: 'string', default: '180' },
  },
});

const url = (process.env.SUPABASE_URL ?? '').trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!url || !serviceRole) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

// No 0/O or 1/I, so a code read aloud or copied by hand stays unambiguous.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const group = (n) => Array.from({ length: n }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
const count = Number(values.count);
const days = Number(values.days);
if (!Number.isInteger(count) || count < 1 || count > 500 || !Number.isInteger(days) || days < 1) {
  console.error('--count must be 1-500 and --days a positive whole number.');
  process.exit(1);
}

const codes = Array.from({ length: count }, () => `SAKSI-${group(4)}-${group(4)}-${group(4)}`);
const validUntil = new Date(Date.now() + Number(values['valid-days']) * 86_400_000).toISOString();
const rows = codes.map((code) => ({
  code_hash: createHash('sha256').update(code.replaceAll('-', '')).digest('hex'),
  duration_days: days,
  valid_until: validUntil,
  note: values.note ?? null,
}));

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });
const { error } = await supabase.from('activation_codes').insert(rows);
if (error) {
  console.error('Could not create codes:', error.message);
  process.exit(1);
}

console.log(`${count} code(s), ${days} days each, redeemable until ${validUntil.slice(0, 10)}:\n`);
for (const code of codes) console.log(code);
