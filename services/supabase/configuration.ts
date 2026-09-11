/** Pure guard shared by runtime configuration and tests. */
export function hasSupabaseConfiguration(
  candidateUrl: string | undefined,
  candidateKey: string | undefined,
): boolean {
  if (!candidateUrl || !candidateKey) return false;
  if (
    candidateUrl.includes('your-project.supabase.co') ||
    candidateKey.includes('your-publishable-key')
  ) {
    return false;
  }
  return true;
}
