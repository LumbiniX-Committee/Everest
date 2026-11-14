/**
 * Local place search: instant, offline, forgiving.
 *
 * Built once from everything the app carries (heritage sites, open-data places,
 * essentials, treks) and queried on every keystroke, so it must stay cheap on a
 * low-end phone. All folding and tokenising happens when the index is built;
 * a query folds one short string and walks precomputed words.
 *
 * Matching is forgiving in three ways, because visitors type names they have
 * only heard: diacritics and common transliteration doublings are folded away
 * ("Sākṣī" = "saksi" = "sakshi"), well-known aliases are indexed beside the
 * official name ("monkey temple"), and short typos are tolerated with a bounded
 * edit distance that grows with word length.
 *
 * Pure and framework-free; `services/search` assembles the documents.
 */
import { haversine } from '../../shared/geo.ts';

import { SEARCH_ALIASES, type AliasRule } from './aliases.ts';

export type SearchKind = 'heritage' | 'place' | 'essential' | 'trek';

export type SearchDoc = {
  /** Unique across kinds, e.g. `site:maya-devi`. */
  key: string;
  kind: SearchKind;
  name: string;
  nameNepali?: string | null;
  /** Extra names: other spellings, a trek a stop belongs to. */
  aliases?: readonly string[];
  /** One line under the name. */
  detail?: string | null;
  coordinate?: { latitude: number; longitude: number } | null;
  /** Small editorial nudge, such as a primary heritage site; a few either way. */
  boost?: number;
};

type IndexedName = {
  folded: string;
  compact: string;
  words: string[];
  /** Each token's place in the index vocabulary, so a word is scored once per query, not once per name. */
  tokenIds: number[];
  /** 1 for the official name, slightly less for aliases. */
  weight: number;
};

type IndexedDoc = { doc: SearchDoc; names: IndexedName[] };

export type SearchIndex = { docs: IndexedDoc[]; vocabulary: string[] };

export type SearchHit = { doc: SearchDoc; score: number; distanceM: number | null };

/** Kind order in lists, and the nudge a kind gets when scores are close. */
export const KIND_ORDER: readonly SearchKind[] = ['heritage', 'place', 'essential', 'trek'];
const KIND_BOOST: Record<SearchKind, number> = { heritage: 12, trek: 6, place: 4, essential: 0 };

/** Below this a candidate is noise, not a match. */
const MIN_SCORE = 35;

/**
 * Lower-case, strip diacritics and punctuation, and fold the spelling
 * variations Nepali names pick up in Latin script: aspirates (bh, kh, th),
 * sh/s, doubled vowels and w/v. Devanagari passes through unchanged apart from
 * joiners, so a Nepali query still matches a Nepali name.
 */
export function fold(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[̀-ͯ‌‍]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, '')
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, ' ')
    .trim();
  return base
    .replace(/sh/g, 's')
    .replace(/([bcdgjkpt])h/g, '$1')
    .replace(/aa/g, 'a')
    .replace(/ee|ii/g, 'i')
    .replace(/oo|uu/g, 'u')
    .replace(/w/g, 'v')
    .replace(/z/g, 'j')
    .replace(/\s+/g, ' ');
}

function indexName(value: string, weight: number): IndexedName | null {
  const folded = fold(value);
  if (!folded) return null;
  return { folded, compact: folded.replace(/ /g, ''), words: folded.split(' '), tokenIds: [], weight };
}

/** Build the index once. Roughly linear in the number of names. */
export function buildSearchIndex(docs: readonly SearchDoc[], rules: readonly AliasRule[] = SEARCH_ALIASES): SearchIndex {
  const foldedRules = rules.map((rule) => ({ match: fold(rule.match), aliases: rule.aliases }));
  const vocabulary: string[] = [];
  const ids = new Map<string, number>();
  const idOf = (token: string) => {
    let id = ids.get(token);
    if (id === undefined) {
      id = vocabulary.length;
      vocabulary.push(token);
      ids.set(token, id);
    }
    return id;
  };
  return {
    vocabulary,
    docs: docs.map((doc) => {
      const official = fold(doc.name);
      const officialWords = official.split(' ').length;
      // A nickname belongs to the place itself, not to every shop named after it,
      // and fits a bare name ("Swayambhunath") better than a longer one ("Swayambhu Museum").
      const ruled =
        doc.kind === 'essential'
          ? []
          : foldedRules
              .filter((rule) => official.includes(rule.match))
              .flatMap((rule) => {
                const weight = 0.92 - 0.02 * Math.max(0, officialWords - rule.match.split(' ').length);
                return rule.aliases.map((alias) => indexName(alias, weight));
              });
      const names = [
        indexName(doc.name, 1),
        doc.nameNepali ? indexName(doc.nameNepali, 1) : null,
        ...(doc.aliases ?? []).map((alias) => indexName(alias, 0.92)),
        ...ruled,
      ].filter((name): name is IndexedName => name !== null);
      // An alias identical to the name adds nothing but work.
      const unique = names.filter((name, i) => names.findIndex((other) => other.folded === name.folded) === i);
      for (const name of unique) name.tokenIds = name.words.map(idOf);
      return { doc, names: unique };
    }),
  };
}

/** Typos allowed for a word of this length: none for short words, where one edit changes the word. */
export function allowedEdits(length: number): number {
  if (length < 4) return 0;
  if (length < 7) return 1;
  return 2;
}

/**
 * Optimal string alignment distance (Damerau–Levenshtein with adjacent swaps),
 * giving up as soon as it must exceed `max`. Returns max + 1 when it does.
 */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  if (a === b) return 0;
  const cols = b.length + 1;
  if (rowBuffers[0].length < cols) rowBuffers = [0, 1, 2].map(() => new Int32Array(cols * 2)) as typeof rowBuffers;
  // Three rolling rows, reused across calls: no allocation per keystroke.
  let [prevPrev, prev, current] = rowBuffers;
  for (let j = 0; j < cols; j += 1) prev[j] = j;
  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    let rowMin = i;
    for (let j = 1; j < cols; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      let value = Math.min(prev[j] + 1, current[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a.charCodeAt(i - 1) === b.charCodeAt(j - 2) && a.charCodeAt(i - 2) === b.charCodeAt(j - 1)) {
        value = Math.min(value, prevPrev[j - 2] + 1);
      }
      current[j] = value;
      if (value < rowMin) rowMin = value;
    }
    if (rowMin > max) return max + 1;
    [prevPrev, prev, current] = [prev, current, prevPrev];
  }
  return prev[cols - 1];
}

let rowBuffers: [Int32Array, Int32Array, Int32Array] = [new Int32Array(64), new Int32Array(64), new Int32Array(64)];

/** How well one typed word matches one indexed word, 0 to 1. */
function tokenScore(query: string, token: string, isLast: boolean): number {
  if (query === token) return 1;
  // The word still being typed matches anything it starts.
  if (token.startsWith(query)) return isLast ? 0.9 : 0.8;
  if (query.length >= 3 && token.includes(query)) return 0.55;
  const max = allowedEdits(query.length);
  if (max === 0) return 0;
  // Typos are rarely in the first letter; requiring it keeps the edit-distance work small.
  if (query[0] !== token[0] && query.length < 6) return 0;
  const whole = editDistance(query, token, max);
  // Mid-word with a typo: compare against the start of the word too.
  const partial = isLast && token.length > query.length ? editDistance(query, token.slice(0, query.length), max) : max + 1;
  const best = Math.min(whole, partial);
  if (best > max) return 0;
  return (best === whole ? 0.75 : 0.65) - 0.12 * best;
}

function nameScore(
  query: string,
  queryTokens: readonly string[],
  queryCompact: string,
  tokenScores: readonly Float32Array[],
  name: IndexedName,
): number {
  if (name.folded === query) return 100;
  // A shorter name that starts with the query is more likely the one meant.
  if (name.folded.startsWith(query)) return 90 - Math.min(6, name.words.length - queryTokens.length);
  let total = 0;
  for (let q = 0; q < queryTokens.length; q += 1) {
    let best = 0;
    const scores = tokenScores[q];
    for (const id of name.tokenIds) {
      const score = scores[id];
      if (score > best) best = score;
      if (best === 1) break;
    }
    if (best === 0) {
      total = -1;
      break;
    }
    total += best;
  }
  if (total > 0) {
    const firstWord = name.words[0].startsWith(queryTokens[0]) ? 5 : 0;
    // Each unmatched word in a long name is a little less likely to be the one meant.
    const extraWords = Math.max(0, name.words.length - queryTokens.length);
    return 40 + 45 * (total / queryTokens.length) + firstWord - extraWords;
  }
  // "swayambhu nath" for "Swayambhunath", "monkeytemple" for "monkey temple".
  // (A one-word query against a one-word name was already compared above.)
  if (queryCompact.length >= 4 && queryCompact[0] === name.compact[0] && (queryTokens.length > 1 || name.words.length > 1)) {
    if (name.compact.startsWith(queryCompact)) return 80;
    const max = allowedEdits(queryCompact.length);
    const prefix = name.compact.slice(0, queryCompact.length);
    const distance = Math.min(editDistance(queryCompact, name.compact, max), editDistance(queryCompact, prefix, max));
    if (distance <= max) return 60 - 8 * distance;
  }
  return 0;
}

export type SearchOptions = {
  /** Where the visitor is, to prefer what is near. Never sent anywhere. */
  near?: { latitude: number; longitude: number } | null;
  limit?: number;
};

const metres = (a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }) =>
  haversine({ lat: a.latitude, lon: a.longitude }, { lat: b.latitude, lon: b.longitude });

/**
 * Rank every document against a query: match quality first (exact, prefix,
 * word, fuzzy), then kind (heritage first), then nearness when a position is
 * known. Distance only breaks near-ties; a far exact match still beats a near
 * fuzzy one.
 */
export function searchIndex(index: SearchIndex, rawQuery: string, options: SearchOptions = {}): SearchHit[] {
  const query = fold(rawQuery);
  if (!query) return [];
  const queryTokens = query.split(' ');
  const queryCompact = query.replace(/ /g, '');
  const near = options.near ?? null;
  // Every distinct word in the index scored once against each typed word.
  const tokenScores = queryTokens.map((token, q) => {
    const isLast = q === queryTokens.length - 1;
    const scores = new Float32Array(index.vocabulary.length);
    for (let v = 0; v < index.vocabulary.length; v += 1) scores[v] = tokenScore(token, index.vocabulary[v], isLast);
    return scores;
  });
  const hits: SearchHit[] = [];
  for (const { doc, names } of index.docs) {
    let best = 0;
    for (const name of names) {
      const score = nameScore(query, queryTokens, queryCompact, tokenScores, name) * name.weight;
      if (score > best) best = score;
      if (best >= 100) break;
    }
    if (best < MIN_SCORE) continue;
    const distanceM = near && doc.coordinate ? metres(near, doc.coordinate) : null;
    // Up to 10 for nearness, fading over about 100 km.
    const nearness = distanceM == null ? 0 : Math.max(0, 10 - 5 * Math.log10(1 + distanceM / 1000));
    hits.push({ doc, distanceM, score: best + KIND_BOOST[doc.kind] + (doc.boost ?? 0) + nearness });
  }
  hits.sort((a, b) => b.score - a.score || (a.distanceM ?? Infinity) - (b.distanceM ?? Infinity) || a.doc.name.localeCompare(b.doc.name));
  return options.limit ? hits.slice(0, options.limit) : hits;
}

export type SearchGroup = { kind: SearchKind; hits: SearchHit[] };

/** Group ranked hits by kind, heritage first, each group capped. */
export function groupHits(hits: readonly SearchHit[], perGroup: Partial<Record<SearchKind, number>> = {}): SearchGroup[] {
  return KIND_ORDER.map((kind) => ({
    kind,
    hits: hits.filter((hit) => hit.doc.kind === kind).slice(0, perGroup[kind] ?? 8),
  })).filter((group) => group.hits.length > 0);
}

export type RemotePlace = { id: string; name: string; coordinate: { latitude: number; longitude: number } };

/**
 * Drop OpenStreetMap results that are things already listed from our own data:
 * the same name (folded, or one containing the other) within 1 km, or anything
 * within 40 m of a listed item. Our own entry carries more, so it wins.
 */
export function dedupeRemote<T extends RemotePlace>(remote: readonly T[], local: readonly SearchDoc[]): T[] {
  const located = local.filter((doc): doc is SearchDoc & { coordinate: NonNullable<SearchDoc['coordinate']> } => Boolean(doc.coordinate));
  const seen = new Set<string>();
  return remote.filter((place) => {
    const name = fold(place.name);
    const key = `${name}@${place.coordinate.latitude.toFixed(3)},${place.coordinate.longitude.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return !located.some((doc) => {
      const distance = metres(place.coordinate, doc.coordinate);
      if (distance <= 40) return true;
      if (distance > 1000) return false;
      const other = fold(doc.name);
      return other === name || (name.length >= 4 && other.includes(name)) || (other.length >= 4 && name.includes(other));
    });
  });
}

export type RecentSearch = { key: string; kind: SearchKind | 'osm'; name: string; detail: string | null; coordinate: { latitude: number; longitude: number } | null };

/** Newest first, one entry per item, at most `limit`. */
export function addRecent(list: readonly RecentSearch[], item: RecentSearch, limit = 8): RecentSearch[] {
  return [item, ...list.filter((entry) => entry.key !== item.key)].slice(0, limit);
}
