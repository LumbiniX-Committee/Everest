import * as FileSystem from 'expo-file-system/legacy';

export const OFFLINE_MODEL = {
  id: 'qwen3-0.6b-q4-k-m',
  name: 'Qwen3 0.6B Q4_K_M',
  filename: 'Qwen_Qwen3-0.6B-Q4_K_M.gguf',
  // Public Apache-2.0 quantization of Qwen3 hosted on Hugging Face. It is
  // downloaded into app-private storage and never bundled.
  url: 'https://huggingface.co/bartowski/Qwen_Qwen3-0.6B-GGUF/resolve/main/Qwen_Qwen3-0.6B-Q4_K_M.gguf?download=true',
  expectedBytes: 484_000_000,
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

type FileInfo = { exists: boolean; size?: number; md5?: string };

function getInfo(uri: string): Promise<FileInfo> {
  return FileSystem.getInfoAsync(uri, { md5: true }) as Promise<FileInfo>;
}

function loadNative(): typeof import('llama.rn') | null {
  try {
    // llama.rn is intentionally loaded only at runtime. This keeps Expo Go and
    // web usable; the native module exists only in a development/production
    // build containing the config plugin.
    if (typeof require !== 'function') return null;
    return require('llama.rn') as typeof import('llama.rn');
  } catch {
    return null;
  }
}

export function offlineRuntimeAvailable(): boolean {
  return loadNative() !== null;
}

export async function offlineModelStatus(): Promise<OfflineModelStatus> {
  if (!offlineRuntimeAvailable()) return { state: 'unsupported' };
  const info = await getInfo(MODEL_PATH);
  if (!info.exists || !info.size || info.size < OFFLINE_MODEL.expectedBytes * 0.98) {
    return { state: 'missing' };
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
  const partPath = `${MODEL_PATH}.part`;
  await FileSystem.deleteAsync(partPath, { idempotent: true });
  const download = FileSystem.createDownloadResumable(
    OFFLINE_MODEL.url,
    partPath,
    {},
    (event) => {
      const progress = event.totalBytesWritten > 0 && event.totalBytesExpectedToWrite > 0
        ? event.totalBytesWritten / event.totalBytesExpectedToWrite
        : 0;
      onProgress?.(progress);
    },
  );
  const result = await download.downloadAsync();
  if (!result?.uri) throw new Error('Offline model download did not complete.');
  const info = await getInfo(result.uri);
  if (!info.exists || !info.size || info.size < OFFLINE_MODEL.expectedBytes * 0.98) {
    await FileSystem.deleteAsync(partPath, { idempotent: true });
    throw new Error('Downloaded offline model is incomplete.');
  }
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.moveAsync({ from: partPath, to: MODEL_PATH });
  return MODEL_PATH;
}

export async function deleteOfflineModel(): Promise<void> {
  const native = loadNative();
  if (native) await native.releaseAllLlama().catch(() => undefined);
  await FileSystem.deleteAsync(MODEL_PATH, { idempotent: true });
  await FileSystem.deleteAsync(`${MODEL_PATH}.part`, { idempotent: true });
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
