const GOOGLE_TRANSLATE_ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';
const REQUEST_TIMEOUT_MS = 5000;

export function hasGoogleTranslation() {
  return Boolean(process.env.GOOGLE_TRANSLATE_API_KEY);
}

/**
 * Server-only Google Cloud Translation REST client. The key is deliberately
 * read from a non-EXPO_PUBLIC variable so it can never be bundled into the
 * browser or mobile app.
 */
export async function translateText(text, source, target) {
  if (!text?.trim() || source === target || !hasGoogleTranslation()) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(
      `${GOOGLE_TRANSLATE_ENDPOINT}?key=${encodeURIComponent(process.env.GOOGLE_TRANSLATE_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source, target, format: 'text' }),
        signal: controller.signal,
      },
    );
    if (!response.ok) return null;
    const payload = await response.json();
    const translated = payload.data?.translations?.[0]?.translatedText;
    return typeof translated === 'string' && translated.trim() ? translated.trim() : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Translate prose while keeping the exact source citation IDs untouched. */
export async function translateAnswer(answer, citations, target) {
  if (!answer || target === 'en' || !hasGoogleTranslation()) {
    return { text: answer, used: false };
  }

  const citationIds = (citations ?? []).map((citation) => citation.segment_id).filter(Boolean);
  const prose = answer.replace(/\[[^\]]+\]/g, '').trim();
  const translated = await translateText(prose, 'en', target);
  if (!translated) return { text: answer, used: false };

  const suffix = citationIds.length ? ` ${citationIds.map((id) => `[${id}]`).join(' ')}` : '';
  return { text: `${translated}${suffix}`, used: true };
}

export async function translateFields(fields, source, target) {
  if (source === target || !hasGoogleTranslation()) return { fields, used: false };
  const output = { ...fields };
  let used = false;
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'string' || !value.trim()) continue;
    const translated = await translateText(value, source, target);
    if (translated) {
      output[key] = translated;
      used = true;
    }
  }
  return { fields: output, used };
}
