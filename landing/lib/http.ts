export function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

export function safeDays(value: string | null): 30 | 90 | 365 {
  if (value === '30') return 30;
  if (value === '365') return 365;
  return 90;
}

export function safeIsoDate(value: string | null, fallback: Date): string {
  if (!value) return fallback.toISOString();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback.toISOString() : date.toISOString();
}
