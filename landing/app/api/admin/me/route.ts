import { getAuthenticatedUser } from '@/lib/auth';
import { adminRoute } from '@/lib/admin-http';

/** Who is signed in to the console, for its sidebar. */
export async function GET() {
  return adminRoute('Could not read the account.', async () => {
    const user = await getAuthenticatedUser();
    return { email: user?.email ?? null, lastSignInAt: user?.last_sign_in_at ?? null };
  });
}
