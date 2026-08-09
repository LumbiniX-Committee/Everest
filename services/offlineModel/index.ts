import * as FileSystem from 'expo-file-system/legacy';

export const OFFLINE_MODEL = {
  id: 'qwen3-0.6b-q4-k-m',
  name: 'Qwen3 0.6B Q4_K_M',
  filename: 'Qwen_Qwen3-0.6B-Q4_K_M.gguf',
  // Public Apache-2.0 quantization of Qwen3 hosted on Hugging Face. It is
  // downloaded into app-private storage and never bundled.
  url: 'https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/resolve/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf?download=true',
  expectedBytes: 484_000_000,
  expectedMd5: 'c2eb98e4a2d6ff396fa064b28a012a06',
  // SHA-256 of the release downloaded and verified during implementation.
  // The device also enforces the expected size before activating the file.
  sha256: '9acfc1e001311f34b4252001b626f2e466d592a42065f66571bff3790d4e1b14',
  languages: ['en', 'ne'] as const,
} as const;

export type OfflineModelStatus =
  | { state: 'unsupported' | 'missing' | 'ready'; path?: string; bytes?: number }
  | { state: 'downloading'; progress: number; bytes?: number }
  | { state: 'error'; message: string };

const MODEL_DIR = `${FileSystem.documentDirectory ?? ''}models/`;
const MODEL_PATH = `${MODEL_DIR}${OFFLINE_MODEL.filename}`;
/** Bytes downloaded so far, kept between attempts. */
const PART_PATH = `${MODEL_PATH}.part`;
/** What `createDownloadResumable` needs to ask for the rest of the file. */
const RESUME_PATH = `${MODEL_PATH}.resume`;
/**
 * Written once, after the checksum has been verified.
 *
 * Its existence is the answer to "is this file the model", so the question can
 * be asked without hashing 484 MB to answer it. Deleted with the model.
 */
const VERIFIED_PATH = `${MODEL_PATH}.verified`;

type FileInfo = { exists: boolean; size?: number; md5?: string };

function getInfo(uri: string, md5 = false): Promise<FileInfo> {
  return FileSystem.getInfoAsync(uri, { md5 }) as Promise<FileInfo>;
}

/** Close enough to the published size to be the whole file. */
function sizeLooksRight(info: FileInfo): boolean {
  return !!info.exists && !!info.size && info.size >= OFFLINE_MODEL.expectedBytes * 0.98;
}

// @ts-ignore
function loadNative(): typeof import('llama.rn') | null {
  try {
    // llama.rn is intentionally loaded only at runtime. This keeps Expo Go and
    // web usable; the native module exists only in a development/production
    // build containing the config plugin.
    if (typeof require !== 'function') return null;
    // @ts-ignore
    return require('llama.rn') as typeof import('llama.rn');
  } catch {
    return null;
  }
}

export function offlineRuntimeAvailable(): boolean {
  return loadNative() !== null;
}

/**
 * Is the model installed and is it the model we expect.
 *
 * The checksum is read from the marker rather than recomputed. Hashing was done
 * here on every call, and this is called before *every* Dhamma answer as well as
 * on the settings screen: 484 MB of MD5 to answer a question the marker already
 * answers. The size is still checked each time, which is cheap, so a truncated
 * or replaced file is still caught.
 */
export async function offlineModelStatus(): Promise<OfflineModelStatus> {
  if (!offlineRuntimeAvailable()) return { state: 'unsupported' };
  const info = await getInfo(MODEL_PATH);
  if (!sizeLooksRight(info)) return { state: 'missing' };
  const verified = await getInfo(VERIFIED_PATH);
  if (!verified.exists) {
    // A file of the right size that has never been verified. Verify it now,
    // once, and leave the marker so this does not happen again.
    const hashed = await getInfo(MODEL_PATH, true);
    if (hashed.md5?.toLowerCase() !== OFFLINE_MODEL.expectedMd5) return { state: 'missing' };
    await FileSystem.writeAsStringAsync(VERIFIED_PATH, OFFLINE_MODEL.expectedMd5);
  }
  return { state: 'ready', path: MODEL_PATH, bytes: info.size };
}

export async function downloadOfflineModel(
  onProgress?: (progress: number) => void,
): Promise<string> {
  if (!offlineRuntimeAvailable()) {
    throw new Error('Offline AI requires a Sakshi development build.');
  }
  await FileSystem.makeDirectoryAsync(MODEL_DIR, { intermediates: true });

  /**
   * Picks up where the last attempt stopped.
   *
   * This used to delete the partial file and start again. On the venue's wifi a
   * 484 MB download that drops at 80% then costs its first 387 MB a second time,
   * which is how "it never finishes" happens. `createDownloadResumable` was
   * already being used; it was simply never asked to resume.
   */
  const saved = await getInfo(RESUME_PATH);
  const partial = await getInfo(PART_PATH);
  let resumeToken: string | undefined;
  if (saved.exists && partial.exists) {
    resumeToken = (await FileSystem.readAsStringAsync(RESUME_PATH)).trim() || undefined;
  } else {
    // A part file with no token cannot be continued, and a token with no part
    // file points at nothing. Either way, start clean.
    await FileSystem.deleteAsync(PART_PATH, { idempotent: true });
    await FileSystem.deleteAsync(RESUME_PATH, { idempotent: true });
  }

  const download = FileSystem.createDownloadResumable(
    OFFLINE_MODEL.url,
    PART_PATH,
    {},
    (event) => {
      const progress = event.totalBytesWritten > 0 && event.totalBytesExpectedToWrite > 0
        ? event.totalBytesWritten / event.totalBytesExpectedToWrite
        : 0;
      onProgress?.(progress);
    },
    resumeToken,
  );

  let result;
  try {
    result = resumeToken ? await download.resumeAsync() : await download.downloadAsync();
  } catch (cause) {
    // Keep the bytes and the token so the next attempt continues rather than
    // restarting. The part file is only discarded when it fails verification.
    try {
      const state = await download.savable();
      if (state?.resumeData) await FileSystem.writeAsStringAsync(RESUME_PATH, state.resumeData);
    } catch {
      // No token to keep. The next attempt starts from the beginning, which is
      // the behaviour this whole branch exists to avoid, but it is still correct.
    }
    throw cause;
  }

  if (!result?.uri) throw new Error('The download stopped before the file was complete.');

  // The checksum is worth its cost exactly once, here.
  const info = await getInfo(result.uri, true);
  if (!sizeLooksRight(info) || info.md5?.toLowerCase() !== OFFLINE_MODEL.expectedMd5) {
    await FileSystem.deleteAsync(PART_PATH, { idempotent: true });
    await FileSystem.deleteAsync(RESUME_PATH, { idempotent: true });
    throw new Error('The downloaded file is not the expected model. It has been discarded.');
  }

  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.moveAsync({ from: PART_PATH, to: MODEL_PATH });
  await FileSystem.deleteAsync(RESUME_PATH, { idempotent: true });
  await FileSystem.writeAsStringAsync(VERIFIED_PATH, OFFLINE_MODEL.expectedMd5);
  return MODEL_PATH;
}

export async function deleteOfflineModel(): Promise<void> {
  const native = loadNative();
  if (native) await native.releaseAllLlama().catch(() => undefined);
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.deleteAsync(PART_PATH, { idempotent: true });
  await FileSystem.deleteAsync(RESUME_PATH, { idempotent: true });
  await FileSystem.deleteAsync(VERIFIED_PATH, { idempotent: true });
}

export async function generateOfflineGroundedAnswer(args: {
  question: string;
  language: 'en' | 'ne';
  passages: Array<{ segment_id: string; english: string }>;
}): Promise<string | null> {
  const native = loadNative();
  const status = await offlineModelStatus();
  if (!native || status.state !== 'ready' || !status.path) return null;
  const allowed = args.passages.map((passage) => passage.segment_id);
  const evidence = args.passages
    .slice(0, 3)
    .map((passage) => `[${passage.segment_id}] ${passage.english}`)
    .join('\n');
  const language = args.language === 'ne' ? 'Nepali in Devanagari script' : 'English';
  const context = await native.initLlama({
    model: status.path,
    n_ctx: 2048,
    n_batch: 256,
    n_threads: 4,
    n_gpu_layers: 99,
  });
  try {
    const result = await context.completion({
      messages: [
        {
          role: 'system',
          content: `You are Sākṣī's offline Dhamma companion. Answer in ${language}. Use only the supplied evidence. Be concise and do not invent facts. End with one or more exact evidence citations such as [dn16:6.7]. Never create a citation not present in the evidence.`,
        },
        { role: 'user', content: `Question: ${args.question}\n\nEvidence:\n${evidence}` },
      ],
      jinja: true,
      enable_thinking: false,
      reasoning_format: 'none',
      n_predict: 180,
      temperature: 0.2,
      top_p: 0.9,
    });
    const text = result.text?.trim() ?? '';
    if (!text || !allowed.some((segment) => text.includes(`[${segment}]`))) return null;
    return text;
  } finally {
    await context.release().catch(() => undefined);
  }
}
