import * as FileSystem from 'expo-file-system';

import type { QuestReview, QuestReviewVerdict, QuestTask } from '@/types';

/**
 * A second pair of eyes on a quest submission.
 *
 * It advises. It does not adjudicate, and it cannot mark a task complete or
 * refuse one — the caller does that, always.
 *
 * That is not caution for its own sake. This app's product is a conservation
 * record built from first-hand evidence, and a model that ruled on whether an
 * observation is true would be asserting something it cannot ground. The spec
 * calls hallucinated scripture in Lumbini catastrophic (§6); a hallucinated
 * *finding* entering the record is the same failure wearing different clothes.
 * So the reviewer says what it can see, the person decides, and what it said is
 * stored as an opinion with the model's name against it.
 *
 * `unavailable` is a normal outcome rather than an error. Lumbini has patchy
 * signal, the app is offline-first, and a quest completes with or without this.
 */

/**
 * Vision model, verified rather than assumed: `gemma4:31b` was tested against
 * this endpoint and correctly read a generated test image. The text model the
 * Dhamma engine uses (`gpt-oss:120b`) has no vision and returns an error for
 * image content, and `qwen3.5` requires a paid tier on this account.
 */
const VISION_MODEL = process.env.EXPO_PUBLIC_VISION_MODEL ?? 'gemma4:31b';

const ENDPOINT =
  process.env.EXPO_PUBLIC_LLM_ENDPOINT ?? 'https://ollama.com/v1/chat/completions';

/**
 * Read from the environment, with no fallback literal.
 *
 * EXPO_PUBLIC_ variables are inlined into the bundle, so anyone with the APK
 * can read this — that is a property of doing vision review from the device at
 * all, not of this file. It is acceptable only because the key is scoped to a
 * demo account and rotatable. A key that must stay secret belongs behind a
 * server the app calls, not in the client.
 */
const API_KEY = process.env.EXPO_PUBLIC_LLM_API_KEY ?? '';

/** Past this, a person waiting on a phone has already moved on. */
const TIMEOUT_MS = 20_000;

export function isConfigured(): boolean {
  return API_KEY.length > 0;
}

function unavailable(comment: string): QuestReview {
  return { verdict: 'unavailable', comment, reviewedAt: new Date().toISOString() };
}

/**
 * The instruction given to the reviewer.
 *
 * Written to make hedging the easy answer rather than a failure. A model asked
 * to judge will judge; a model told that "unsure" is a respected outcome will
 * use it, and an unsure review costs a person nothing while a confident wrong
 * one costs them their own certainty about what they saw.
 */
function buildPrompt(task: QuestTask): string {
  return [
    'You are helping someone surveying heritage monuments at Lumbini, Nepal.',
    'They photographed something for this task:',
    `  Task: ${task.title}`,
    `  What it asks for: ${task.expectation ?? task.description}`,
    '',
    'Say whether the photograph plausibly shows that. You are advising, not',
    'deciding — they were there and you were not, so where the image is unclear,',
    'poorly lit, or ambiguous, answer UNSURE. That is a good answer, not a',
    'failure. Never guess at what is out of frame.',
    '',
    'Reply as exactly two lines:',
    'VERDICT: RIGHT or WRONG or UNSURE',
    'COMMENT: one sentence, under 25 words, describing only what you can see.',
  ].join('\n');
}

function parseVerdict(text: string): { verdict: QuestReviewVerdict; comment: string } {
  const verdictLine = /VERDICT:\s*(RIGHT|WRONG|UNSURE)/i.exec(text);
  const commentLine = /COMMENT:\s*(.+)/i.exec(text);

  const raw = verdictLine?.[1]?.toUpperCase();
  const verdict: QuestReviewVerdict =
    raw === 'RIGHT' ? 'looks-right' : raw === 'WRONG' ? 'looks-wrong' : 'unsure';

  return {
    verdict,
    // An unparseable reply is not a verdict. Falling back to the raw text would
    // put a model's stray reasoning in front of someone as though it were one.
    comment: commentLine?.[1]?.trim() ?? 'The reviewer did not answer clearly.',
  };
}

export async function reviewPhoto(task: QuestTask, photoUri: string): Promise<QuestReview> {
  if (!isConfigured()) {
    return unavailable('Photo review is not configured on this build.');
  }

  let base64: string;
  try {
    base64 = await FileSystem.readAsStringAsync(photoUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
  } catch {
    return unavailable('The photograph could not be read from this device.');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 120,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: buildPrompt(task) },
              { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${base64}` } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) return unavailable(`The reviewer could not be reached (${res.status}).`);

    const json = await res.json();
    const text: string | undefined = json?.choices?.[0]?.message?.content;
    if (!text) return unavailable('The reviewer returned nothing.');

    const { verdict, comment } = parseVerdict(text);
    return { verdict, comment, model: VISION_MODEL, reviewedAt: new Date().toISOString() };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return unavailable(
      aborted ? 'The reviewer took too long to answer.' : 'No connection to the reviewer.',
    );
  } finally {
    clearTimeout(timer);
  }
}
