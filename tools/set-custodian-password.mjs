#!/usr/bin/env node
/**
 * Sets a password directly on an existing Supabase Auth user, bypassing the
 * email-based recovery flow entirely.
 *
 * Supabase Dashboard's "Send password recovery" only sends an email with a
 * link; completing it requires a page in the app that catches the recovery
 * token and calls supabase.auth.updateUser({ password }). This project's
 * /login is email+password only and has no such page, so that email dead-
 * ends on a normal page load with nothing changed. This script is the
 * alternative: it sets the password server-side, with no email involved.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node tools/set-custodian-password.mjs sayhi.aaditya@gmail.com saksi12345
 *
 * The account must already exist in auth.users (it does, from earlier
 * magic-link sign-ins this session). This does not touch custodian_
 * memberships — access is unaffected either way.
 */
import { createClient } from '@supabase/supabase-js';

const [, , email, password] = process.argv;
if (!email || !password) {
  console.error('Usage: node tools/set-custodian-password.mjs <email> <password>');
  process.exit(1);
}

const url = (process.env.SUPABASE_URL ?? '').trim();
const serviceRole = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim();
if (!url || !serviceRole) {
  console.error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  process.exit(1);
}
if (serviceRole === process.env.EXPO_PUBLIC_SUPABASE_KEY) {
  console.error('Refusing to use the public app key as an admin credential.');
  process.exit(1);
}

const admin = createClient(url, serviceRole, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error: listError } = await admin.auth.admin.listUsers();
if (listError) throw listError;
const user = data.users.find((u) => u.email === email);
if (!user) {
  console.error(`No account exists yet for ${email}. Sign in once via the app first (even without finishing it), then re-run this.`);
  process.exit(1);
}

const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password });
if (updateError) throw updateError;

console.log(`Password set for ${email}. Sign in at /login with that email and password.`);
