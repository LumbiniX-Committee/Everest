import { demoQuests } from '@/data';
import { checkSiteReferences } from '@/services/integrity';

/**
 * Recovers the validation seed/quests.json + tools/validate-seed.mjs used to
 * provide before that pipeline was retired as dead (nothing imported its
 * generated output; data/demo/quests.ts is the quest data that actually
 * ships). Runs against the shipped demoQuests directly rather than a JSON
 * file nothing reads.
 */
describe('demoQuests integrity', () => {
  it('has unique quest ids', () => {
    const ids = demoQuests.map((quest) => quest.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every quest at least one task', () => {
    for (const quest of demoQuests) {
      expect(quest.tasks.length).toBeGreaterThan(0);
    }
  });

  it('resolves every task targetId to a real site or vantage', () => {
    expect(checkSiteReferences()).toEqual([]);
  });
});
