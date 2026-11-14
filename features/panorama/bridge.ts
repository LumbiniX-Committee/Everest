import type { PanoramaPageConfig } from './panoramaHtml';

/** Messages between the screen and the viewer page; see panoramaHtml.ts. */
export type PanoramaCommand =
  | { type: 'look'; az: number; el: number }
  | { type: 'motion'; on: boolean }
  | { type: 'focus'; id: string | null }
  | { type: 'labels'; titles: Record<string, string> };

export type PanoramaEvent =
  | { type: 'ready' }
  | { type: 'loaded' }
  | { type: 'error'; reason?: string }
  | { type: 'hotspot'; id: string }
  | { type: 'view'; az: number; el: number };

export type PanoramaViewHandle = { send: (command: PanoramaCommand) => void };

export type PanoramaViewProps = { config: PanoramaPageConfig; onEvent: (event: PanoramaEvent) => void };

export function parsePanoramaEvent(data: unknown): PanoramaEvent | null {
  try {
    const message = typeof data === 'string' ? JSON.parse(data) : data;
    return message && typeof message.type === 'string' ? (message as PanoramaEvent) : null;
  } catch {
    return null;
  }
}
