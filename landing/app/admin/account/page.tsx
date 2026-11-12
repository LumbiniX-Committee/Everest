'use client';

import { ChangePasswordForm } from '@/components/admin/ChangePasswordForm';
import { Forbidden, Loading, PageHeader, Panel } from '@/components/admin/ui';
import { useAdminData } from '@/components/admin/useAdminData';
import { relative } from '@/lib/adminApi';

export default function AdminAccountPage() {
  const { data, forbidden } = useAdminData<{ email: string | null; lastSignInAt: string | null }>('/api/admin/me');
  if (forbidden) return <Forbidden />;
  return (
    <div className="space-y-6">
      <PageHeader title="Account" description="Your sign-in for this console." />
      {!data ? (
        <Loading />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          <Panel title="Signed in as">
            <p className="text-lg font-medium break-all text-ink">{data.email}</p>
            <p className="mt-1 text-sm text-ink-muted">{`Last sign-in ${relative(data.lastSignInAt)}`}</p>
            <form action="/auth/signout" method="post" className="mt-5">
              <button className="text-sm font-semibold text-robe hover:underline">Sign out of this browser</button>
            </form>
          </Panel>
          <Panel title="Change password" description="You stay signed in here. Other browsers keep their session until it expires.">
            <ChangePasswordForm email={data.email} />
          </Panel>
        </div>
      )}
    </div>
  );
}
