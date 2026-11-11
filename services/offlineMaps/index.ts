import * as FileSystem from 'expo-file-system/legacy';

import { StorageKeys } from '@/constants';
import { tilesForBounds, type Bounds } from '@/core';
import { MAP_GLYPHS_URL, MAP_TILES_URL } from '@/theme';

import { getJSON, setString } from '../storage';

/**
 * Map areas saved to the phone, for when there is no signal.
 *
 * Online, the map fetches tiles itself exactly as before. Only when a fetch
 * fails does it ask here for a saved copy, so saved packs never slow the
 * normal map down. The basemap, terrain and label fonts are saved; satellite
 * imagery is not, because its providers do not allow keeping it.
 *
 * Downloads stay modest on purpose: OpenFreeMap is a free public service and
 * asks people not to bulk-download, so a pack is one area, up to zoom 14
 * (street level; the map draws closer zooms from those tiles).
 */
const ROOT = `${FileSystem.documentDirectory ?? ''}map-tiles/`;
const BASEMAP_ZOOMS = [6, 14] as const;
const TERRAIN_ZOOMS = [6, 12] as const;
const TERRAIN_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium';
const FONTS = ['Noto Sans Regular', 'Noto Sans Bold'];
/** Basic Latin, Latin extended, punctuation, and Devanagari for local names. */
const GLYPH_RANGES = ['0-255', '256-511', '2304-2559', '8192-8447'];
const PARALLEL = 4;

export type OfflinePack = {
  id: string;
  label: string;
  bounds: Bounds;
  tiles: number;
  /** Tiles that could not be fetched. A pack with failures shows as incomplete. */
  failed: number;
  bytes: number;
  savedAt: string;
};

/** The cache key the map page asks for, e.g. `ofm/14/12074/6878`. Also its file name. */
function fileFor(key: string): string {
  return `${ROOT}${key.replace(/[^A-Za-z0-9-]+/g, '_')}`;
}

let ofmTemplate: Promise<string> | null = null;
/** OpenFreeMap versions its tile paths; the current one comes from its TileJSON. */
function basemapTemplate(): Promise<string> {
  ofmTemplate ??= fetch(MAP_TILES_URL)
    .then((response) => response.json() as Promise<{ tiles?: string[] }>)
    .then((body) => {
      if (!body.tiles?.[0]) throw new Error('no tile template');
      return body.tiles[0];
    })
    .catch((error: unknown) => {
      ofmTemplate = null;
      throw error;
    });
  return ofmTemplate;
}

async function urlFor(key: string): Promise<string> {
  const [kind, ...rest] = key.split('/');
  if (kind === 'ofm') {
    const [z, x, y] = rest;
    return (await basemapTemplate()).replace('{z}', z).replace('{x}', x).replace('{y}', y);
  }
  if (kind === 'dem') return `${TERRAIN_URL}/${rest.join('/')}.png`;
  if (kind === 'glyphs') {
    const [fontstack, range] = rest;
    return MAP_GLYPHS_URL.replace('{fontstack}', encodeURIComponent(fontstack)).replace('{range}', range);
  }
  throw new Error(`unknown tile kind ${kind}`);
}

/** A saved tile as base64 for the map page, or null when this one was never saved. */
export async function readTile(key: string): Promise<string | null> {
  try {
    const file = fileFor(key);
    const info = await FileSystem.getInfoAsync(file);
    if (!info.exists) return null;
    return await FileSystem.readAsStringAsync(file, { encoding: FileSystem.EncodingType.Base64 });
  } catch {
    return null;
  }
}

export function listPacks(): Promise<OfflinePack[]> {
  return getJSON<OfflinePack[]>(StorageKeys.offlineMapPacks, []);
}

/** Every file a pack needs, as cache keys. */
export function keysForArea(bounds: Bounds): string[] {
  const basemap = tilesForBounds(bounds, BASEMAP_ZOOMS[0], BASEMAP_ZOOMS[1]).map((t) => `ofm/${t.z}/${t.x}/${t.y}`);
  const terrain = tilesForBounds(bounds, TERRAIN_ZOOMS[0], TERRAIN_ZOOMS[1]).map((t) => `dem/${t.z}/${t.x}/${t.y}`);
  const glyphs = FONTS.flatMap((font) => GLYPH_RANGES.map((range) => `glyphs/${font}/${range}`));
  return [...basemap, ...terrain, ...glyphs];
}

/**
 * Save an area. Tiles already on the phone are kept, not fetched again, so
 * overlapping packs share them. Reports progress as tiles done of total.
 */
export async function savePack(
  id: string,
  label: string,
  bounds: Bounds,
  onProgress?: (done: number, total: number) => void,
): Promise<OfflinePack> {
  await FileSystem.makeDirectoryAsync(ROOT, { intermediates: true }).catch(() => undefined);
  const keys = keysForArea(bounds);
  let done = 0;
  let failed = 0;
  let bytes = 0;
  let next = 0;

  const worker = async () => {
    while (next < keys.length) {
      const key = keys[next++];
      const file = fileFor(key);
      try {
        const existing = await FileSystem.getInfoAsync(file);
        if (existing.exists) {
          bytes += existing.size ?? 0;
        } else {
          const result = await FileSystem.downloadAsync(await urlFor(key), file);
          if (result.status === 200) {
            const info = await FileSystem.getInfoAsync(file);
            bytes += info.exists ? (info.size ?? 0) : 0;
          } else {
            // 404 and 204 are tiles with nothing in them, such as open ground
            // at low zoom. Not saved, and not a failure.
            await FileSystem.deleteAsync(file, { idempotent: true });
            if (result.status >= 500 || result.status === 429) failed += 1;
          }
        }
      } catch {
        failed += 1;
      }
      done += 1;
      onProgress?.(done, keys.length);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));

  const pack: OfflinePack = { id, label, bounds, tiles: keys.length, failed, bytes, savedAt: new Date().toISOString() };
  const packs = (await listPacks()).filter((existing) => existing.id !== id);
  await setString(StorageKeys.offlineMapPacks, JSON.stringify([...packs, pack]));
  return pack;
}

/**
 * Remove every saved map. Map tiles are a cache of public data, not the
 * visitor's own record, so clearing them loses nothing that cannot be fetched again.
 */
export async function removeAllPacks(): Promise<void> {
  await FileSystem.deleteAsync(ROOT, { idempotent: true });
  await setString(StorageKeys.offlineMapPacks, JSON.stringify([]));
}
