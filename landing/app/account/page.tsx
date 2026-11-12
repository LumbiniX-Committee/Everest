import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';
import { getAuthenticatedUser } from '@/lib/auth';

// Per request: it reads the signed-in session, and must never be prerendered at build.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Your account · Sākṣī', robots: { index: false, follow: false } };

/** Change password, for anyone signed in to the website: custodians and admins alike. */
export default async function AccountPage() {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login?next=/account');
  return (
    <main className="mx-auto max-w-xl px-6 py-14">
      <Link href="/custodian" className="text-sm font-medium text-sandstone-deep hover:underline">← Back to the portal</Link>
      <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl font-semibold text-ink">Your account</h1>
      <p className="mt-2 text-ink-soft">{`Signed in as ${user.email ?? 'this account'}.`}</p>
      <section className="mt-8 rounded-xl border border-line bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Change password</h2>
        <div className="mt-4">
          <ChangePasswordForm email={user.email ?? null} />
        </div>
      </section>
    </main>
  );
}
