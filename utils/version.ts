/** "1.2.0" > "1.10.0" is false; compare the numbers, not the text. */
export function newerRuntime(published: string, installed: string): boolean {
  const a = published.split('.').map(Number);
  const b = installed.split('.').map(Number);
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    if (d !== 0) return d > 0;
  }
  return false;
}
