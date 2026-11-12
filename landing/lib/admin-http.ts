// Server code by way of '@/lib/admin', which carries the 'server-only' marker.
import { getAdminAccess } from '@/lib/admin';
import { jsonError } from '@/lib/http';

/** The error response for anyone who is not an admin, or null to carry on. */
export async function refuseNonAdmin(): Promise<Response | null> {
  const access = await getAdminAccess();
  if (access.kind === 'signed_out') return jsonError('Authentication required.', 401);
  if (access.kind === 'forbidden') return jsonError('This account is not a platform admin.', 403);
  return null;
}
