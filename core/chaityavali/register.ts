/**
 * app/src/chaityavali/register.ts — the register of monuments witnessed.
 *
 * Chaityāvalī is a register of the sites you have given darśana to, with your
 * own captures bound in. It is NOT a collection: no rarity, no completion
 * percentage, no "gotta see 'em all". `days_visited` counts distinct days a site
 * was witnessed — never a streak (breaking it costs nothing).
 *
 * Pure TypeScript over shared types.
 */

import type { ChaityavaliEntry, Timestamp } from '../../shared/types.ts';

const dayOf = (iso: Timestamp): string => iso.slice(0, 10);

interface InternalEntry {
  site_id: string;
  first_witnessed_at: Timestamp;
  days: Set<string>;
  capture_ids: string[];
}

export class ChaityavaliRegister {
  private readonly entries = new Map<string, InternalEntry>();

  /** Record a darśana. Idempotent within a day for the day count. */
  witness(siteId: string, atIso: Timestamp): void {
    const existing = this.entries.get(siteId);
    if (existing) {
      existing.days.add(dayOf(atIso));
    } else {
      this.entries.set(siteId, {
        site_id: siteId,
        first_witnessed_at: atIso,
        days: new Set([dayOf(atIso)]),
        capture_ids: [],
      });
    }
  }

  /** Bind one of the user's own captures to a witnessed site. */
  bindCapture(siteId: string, captureId: string, atIso: Timestamp): void {
    if (!this.entries.has(siteId)) this.witness(siteId, atIso);
    const e = this.entries.get(siteId)!;
    if (!e.capture_ids.includes(captureId)) e.capture_ids.push(captureId);
  }

  has(siteId: string): boolean {
    return this.entries.has(siteId);
  }

  size(): number {
    return this.entries.size;
  }

  list(): ChaityavaliEntry[] {
    return [...this.entries.values()]
      .map((e) => ({
        site_id: e.site_id,
        first_witnessed_at: e.first_witnessed_at,
        days_visited: e.days.size,
        capture_ids: [...e.capture_ids],
      }))
      .sort((a, b) => a.first_witnessed_at.localeCompare(b.first_witnessed_at));
  }
}
