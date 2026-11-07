import { renderHook } from '@testing-library/react-native';

import type { Coordinate } from '@/types';

/**
 * One 20 m site on a line of longitude, so a coordinate's latitude offset is
 * its distance in metres. Keeps the hook's wiring under test while the
 * geometry stays readable.
 */
const M_PER_DEG = 111_195;
const SITE = { id: 'stone', name: 'Marker Stone', summary: 'Where it began.' };
const fixAt = (metres: number): Coordinate => ({ latitude: metres / M_PER_DEG, longitude: 0 });

const mockPresent = jest.fn(() => Promise.resolve());

jest.mock('@/store', () => ({
  usePreferences: () => ({ preferences: { wisdomTier: 'medium' } }),
}));
jest.mock('@/data', () => ({ findSite: () => SITE }));
jest.mock('@/services', () => ({
  notifications: { presentArrival: (...args: unknown[]) => mockPresent(...(args as [])) },
  arrival: {
    nearestSite: () => null,
    presenceCandidates: (c: Coordinate | null) =>
      c ? [{ id: SITE.id, distanceM: Math.abs(c.latitude) * M_PER_DEG, reachM: 20 }] : [],
    hasSomethingToSay: () => true,
  },
}));

import { resetSiteAnnouncements, useSiteArrival } from '@/hooks/useSiteArrival';

type Props = { coordinate: Coordinate | null; accuracyM: number | null };

function walk(initial: Props) {
  return renderHook(
    ({ coordinate, accuracyM }: Props) => useSiteArrival(coordinate, { accuracyM }),
    { initialProps: initial },
  );
}

describe('useSiteArrival', () => {
  beforeEach(() => resetSiteAnnouncements());

  it('holds a visit through boundary jitter and announces it once', async () => {
    const hook = await walk({ coordinate: fixAt(40), accuracyM: 6 });
    expect(hook.result.current.atSiteId).toBeNull();

    for (const d of [18, 24, 19, 27, 17]) {
      await hook.rerender({ coordinate: fixAt(d), accuracyM: 6 });
      expect(hook.result.current.atSiteId).toBe('stone');
    }
    expect(mockPresent).toHaveBeenCalledTimes(1);

    await hook.rerender({ coordinate: fixAt(35), accuracyM: 6 });
    expect(hook.result.current.atSiteId).toBeNull();

    // A return inside the re-announce floor is a continuation, not a new arrival.
    await hook.rerender({ coordinate: fixAt(10), accuracyM: 6 });
    expect(hook.result.current.atSiteId).toBe('stone');
    expect(mockPresent).toHaveBeenCalledTimes(1);
  });

  it('does not claim an arrival from a coarse network fix', async () => {
    const hook = await walk({ coordinate: fixAt(5), accuracyM: 120 });
    expect(hook.result.current.atSiteId).toBeNull();
    expect(mockPresent).not.toHaveBeenCalled();
  });
});
