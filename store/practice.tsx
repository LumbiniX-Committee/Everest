import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { database } from '@/services';
import {
  DAILY_PRACTICE_LIMIT,
  type MeritEvent,
  type MeritKind,
  type PracticeSummary,
} from '@/types';

/**
 * Puṇya — recognition of practice.
 *
 * Read §11 and §27 before changing anything here.
 *
 * THE RULE THAT MATTERS: the daily limit stops *recognition*, never *recording*.
 * A person who has reached their limit can still witness, still photograph,
 * still file a condition report — all of it saves exactly as before. What stops
 * is the app telling them they have done well.
 *
 * Getting this backwards would be the worst bug in the product. Conservation
 * data is the reason the app exists; a wellbeing feature must never be able to
 * refuse it. The limit exists to remove the incentive to grind, not to cap what
 * a site can have observed about it in a day.
 */

type RecogniseInput = {
  kind: MeritKind;
  siteId?: string;
  observationId?: string;
};

type PracticeContextValue = {
  /** False until the first read comes back. */
  hydrated: boolean;
  summary: PracticeSummary;
  events: MeritEvent[];
  /**
   * Records recognition for an act that has already been saved elsewhere.
   *
   * Returns the event when one was created, or null when it was not — either
   * because the day is complete or because this act was already recognised.
   * Callers show the acknowledgement only on a non-null return, so nothing is
   * congratulated twice.
   */
  recognise: (input: RecogniseInput) => Promise<MeritEvent | null>;
  refresh: () => Promise<void>;
};

const emptySummary: PracticeSummary = {
  todayCount: 0,
  dayComplete: false,
  totalCount: 0,
  sitesWitnessed: 0,
};

const PracticeContext = createContext<PracticeContextValue | null>(null);

/**
 * Midnight this morning, local time, as an absolute instant.
 *
 * Local rather than UTC because "today" means the observer's day. In Nepal
 * (UTC+05:45) a UTC boundary would roll over at a quarter to six in the
 * morning, ending someone's practice while they are still out walking.
 */
function startOfLocalDay(): string {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

export function PracticeProvider({ children }: { children: ReactNode }) {
  const [hydrated, setHydrated] = useState(false);
  const [events, setEvents] = useState<MeritEvent[]>([]);
  const [summary, setSummary] = useState<PracticeSummary>(emptySummary);

  const refresh = useCallback(async () => {
    try {
      const dayStart = startOfLocalDay();
      const [allEvents, todayCount, sitesWitnessed, began] = await Promise.all([
        database.listMeritEvents(),
        database.countMeritEvents(dayStart),
        database.countSitesWitnessed(),
        database.firstMeritAt(),
      ]);

      setEvents(allEvents);
      setSummary({
        todayCount,
        dayComplete: todayCount >= DAILY_PRACTICE_LIMIT,
        totalCount: allEvents.length,
        sitesWitnessed,
        practiceBegan: began ?? undefined,
      });
    } catch {
      // A read failure leaves the previous summary standing. Showing zero to
      // someone who has been observing all week would be a lie about their own
      // record, which is worse than showing a slightly stale count.
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recognise = useCallback(
    async ({ kind, siteId, observationId }: RecogniseInput) => {
      // Recomputed here rather than read from state: the app may have been open
      // across midnight, and a stale boundary would either deny a new day's
      // first recognition or extend yesterday's allowance into today.
      const dayStart = startOfLocalDay();
      const todayCount = await database.countMeritEvents(dayStart);
      if (todayCount >= DAILY_PRACTICE_LIMIT) {
        await refresh();
        return null;
      }

      const event: MeritEvent = {
        id: `merit-${Date.now()}`,
        kind,
        occurredAt: new Date().toISOString(),
        siteId,
        observationId,
        acknowledgement: acknowledgements[kind],
      };

      const created = await database.insertMeritEvent(event);
      await refresh();
      return created ? event : null;
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ hydrated, summary, events, recognise, refresh }),
    [hydrated, summary, events, recognise, refresh],
  );

  return <PracticeContext.Provider value={value}>{children}</PracticeContext.Provider>;
}

export function usePractice(): PracticeContextValue {
  const value = useContext(PracticeContext);
  if (!value) throw new Error('usePractice must be used inside <PracticeProvider>');
  return value;
}

/**
 * What is said, once, at the moment of recognition.
 *
 * Statements of fact about what happened, not praise. "Recorded" rather than
 * "Great work" — the app is a witness to the person's attention, not an
 * audience for it.
 */
const acknowledgements: Record<MeritKind, string> = {
  witness: 'A frame recorded from a fixed point. The series is one longer.',
  observation: 'What you saw is now part of the record.',
  resurvey: 'You returned. That is what makes the series worth having.',
  study: 'Read through to the sources.',
  reflection: 'Sat with the question.',
};
