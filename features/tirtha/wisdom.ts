import { getAllChunks } from '@/core/dhamma/bilara';
import type { HeritageSite } from '@/types';

/**
 * Site-facing wisdom helpers.
 *
 * The depth policy itself lives in `core/wisdom` because `services/arrival`
 * needs it too, and a service must not reach into a feature. Re-exported here
 * so screens have one import.
 */
export { depthFor, type WisdomDepth } from '@/core';

export type ScriptureReference = {
  /** Sutta uid, e.g. `dn14`. */
  uid: string;
  titleEn: string;
  titlePi: string;
  /** `dn`, `mn`, `sn` … shown so a reader can find it in a printed canon too. */
  collection: string;
  translator: string;
  licence: string;
  /** How much of it the app actually holds. */
  segmentCount: number;
};

/**
 * The canonical texts a site rests on, named — not quoted.
 *
 * The first version of this quoted a passage per sutta, and it was wrong in a
 * way worth recording so it is not tried again the same way.
 *
 * Picking *the* relevant passage out of a 200-chunk sutta is a relevance
 * problem, and neither obvious heuristic solves it. Taking the longest chunk
 * put Vipassī's reflections under the Maya Devi Temple. Retrieving against the
 * site's own summary did no better, because a summary written in the vocabulary
 * of excavation — brick chambers, marker stone, ASI survey — shares almost no
 * terms with sutta prose. The passages are certainly there: `dn16:5.8` is the
 * four places a faithful person should see, `mn123:7` is the birth account. A
 * query that already knows what it is looking for finds them; one built from
 * the site does not.
 *
 * So the site names its texts and offers to ask them, rather than printing a
 * confidently-chosen paragraph. A wrong passage under a monument is worse than
 * no passage: it reads as the text saying something about this place, which is
 * exactly the authority the Dhamma pillar is careful not to borrow falsely.
 *
 * What is shown is still verified — the title, collection and translator come
 * from the corpus itself, so a reference only appears when the app genuinely
 * holds the text and can answer from it. A sutta the corpus lacks is omitted
 * rather than named, because naming it would promise a citation nobody can
 * check.
 */
export function scriptureForSite(site: HeritageSite): ScriptureReference[] {
  const uids = site.dhammaLinks ?? [];
  if (uids.length === 0) return [];

  const chunks = getAllChunks();

  return uids.flatMap((uid) => {
    const forUid = chunks.filter((chunk) => chunk.uid === uid);
    if (forUid.length === 0) return [];

    const first = forUid[0];
    return [{
      uid,
      titleEn: first.title_en,
      titlePi: first.title_pi,
      collection: first.collection.toUpperCase(),
      translator: first.translator,
      licence: first.license,
      segmentCount: forUid.length,
    }];
  });
}
