/**
 * What a new password must be. Shared by the form (to say so before sending)
 * and the route (which decides). Length matters most; the rest stops the
 * commonest weak choices without a pile of composition rules.
 */
export const MIN_PASSWORD_LENGTH = 12;

export type PasswordCheck = { ok: boolean; problems: string[] };

export function checkNewPassword(next: string, current: string, email: string | null): PasswordCheck {
  const problems: string[] = [];
  if (next.length < MIN_PASSWORD_LENGTH) problems.push(`At least ${MIN_PASSWORD_LENGTH} characters.`);
  if (next.length > 128) problems.push('No more than 128 characters.');
  if (!/[A-Za-z]/.test(next) || !/[0-9]/.test(next)) problems.push('Mix letters and at least one number.');
  if (next && next === current) problems.push('Different from your current password.');
  const local = email?.split('@')[0]?.toLowerCase();
  if (local && local.length >= 4 && next.toLowerCase().includes(local)) problems.push('Not containing your email name.');
  if (/^(.)\1+$/.test(next) || /^(password|saksi|sakshi)/i.test(next)) problems.push('Not a common or repeated pattern.');
  return { ok: problems.length === 0, problems };
}
