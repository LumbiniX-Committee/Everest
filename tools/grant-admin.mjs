// Makes an existing account a platform admin, so it can open /admin on the
// website. Server-only: needs the service role key, which is the point: no
// browser can make itself an admin.
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node tools/grant-admin.mjs <email> [note]
//
// The account must already exist (sign in once at /login, or add the user in
// the Supabase dashboard under Authentication).
import { createClient } from '@supabase/supabase-js';

const [, , email, note] = process.argv;
if (!email) {
  console.error('Usage: node tools/grant-admin.mjs <email> [note]');
  process.exit(1);
}
const url = (process.env.SUPABASE_URL ?? '').trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!url || !serviceRole) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const supabase = createClient(url, serviceRole, { auth: { persistSession: false } });

let user = null;
for (let page = 1; !user; page += 1) {
  const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
  if (error) {
    console.error('Could not list accounts:', error.message);
    process.exit(1);
  }
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email.toLowerCase()) ?? null;
  if (data.users.length < 200) break;
}
if (!user) {
  console.error(`No account with the email ${email}. Sign in once at /login first.`);
  process.exit(1);
}

const { error } = await supabase.from('platform_admins').upsert({ user_id: user.id, note: note ?? null });
if (error) {
  console.error('Could not grant admin:', error.message);
  process.exit(1);
}
console.log(`${email} is a platform admin. Open /admin on the website.`);
