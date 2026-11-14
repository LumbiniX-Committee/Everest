import { StorageKeys } from '@/constants';
import { addRecent, buildSearchIndex, type RecentSearch, type SearchDoc, type SearchIndex } from '@/core/search';
import { demoSites, ESSENTIALS, PLACES, TREKS } from '@/data';
import { getJSON, setJSON } from '@/services/storage';

export {
  dedupeRemote,
  groupHits,
  searchIndex,
  type RecentSearch,
  type SearchDoc,
  type SearchGroup,
  type SearchHit,
  type SearchKind,
} from '@/core/search';

/** Everything the app carries, as search documents. */
export function localSearchDocs(): SearchDoc[] {
  const docs: SearchDoc[] = [];
  for (const site of demoSites) {
    docs.push({
      key: `site:${site.id}`,
      kind: 'heritage',
      name: site.name,
      nameNepali: site.nameNepali ?? null,
      aliases: site.namePali ? [site.namePali] : undefined,
      detail: site.summary,
      coordinate: site.coordinate,
      // Primary sites first among equals; a monument inside a square after the square.
      boost: site.tier === 1 ? 4 : site.parentSiteId ? 0 : 2,
    });
  }
  for (const place of PLACES) {
    docs.push({
      key: `place:${place.id}`,
      kind: 'place',
      name: place.name,
      nameNepali: place.nameNepali,
      detail: place.description,
      coordinate: place.coordinate,
    });
  }
  for (const item of ESSENTIALS) {
    docs.push({
      key: `essential:${item.id}`,
      kind: 'essential',
      name: item.name,
      detail: item.address,
      coordinate: item.coordinate,
    });
  }
  for (const trek of TREKS) {
    docs.push({ key: `trek:${trek.id}`, kind: 'trek', name: trek.name, nameNepali: trek.nameNepali, detail: trek.region, coordinate: trek.stops[0]?.coordinate ?? null });
    // A stop finds its trek: "Namche" is how most people look for Everest.
    for (const stop of trek.stops) {
      docs.push({ key: `trek:${trek.id}:${stop.id}`, kind: 'trek', name: stop.name, aliases: [trek.name], detail: trek.name, coordinate: stop.coordinate, boost: -2 });
    }
  }
  return docs;
}

let cached: { index: SearchIndex; docs: SearchDoc[] } | null = null;

/**
 * The search index over the app's own data, built on first use and kept: the
 * data is bundled, so it never changes while the app runs.
 */
export function localSearch(): { index: SearchIndex; docs: SearchDoc[] } {
  if (!cached) {
    const docs = localSearchDocs();
    cached = { docs, index: buildSearchIndex(docs) };
  }
  return cached;
}

/** The trek id in a `trek:` key, with or without a stop. */
export function trekIdOf(key: string): string | null {
  return key.startsWith('trek:') ? key.split(':')[1] ?? null : null;
}

const RECENT_LIMIT = 8;

/** What the visitor last chose from search, newest first. Kept on this phone only. */
export function recentSearches(): Promise<RecentSearch[]> {
  return getJSON<RecentSearch[]>(StorageKeys.searchRecent, []);
}

export async function rememberSearch(item: RecentSearch): Promise<RecentSearch[]> {
  const next = addRecent(await recentSearches(), item, RECENT_LIMIT);
  await setJSON(StorageKeys.searchRecent, next);
  return next;
}

export async function clearRecentSearches(): Promise<void> {
  await setJSON(StorageKeys.searchRecent, []);
}
