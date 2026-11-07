jest.mock('@/store', () => ({ usePreferences: () => ({ preferences: { alignmentTolerance: 'standard' } }), usePermission: () => ({ state: { status: 'granted' } }) }));
jest.mock('@/services', () => ({ location: { isDemoMode: () => false } }));

import { computeAlignment } from '@/hooks/useAlignment';
import { alignmentHint } from '@/utils/alignmentHint';

const VANTAGE = {
  id: 'v',
  siteId: 's',
  label: 'Test',
  coordinate: { latitude: 27.4696, longitude: 83.2758 },
  bearing: 0,
  pitch: 0,
  positionToleranceM: 8,
  bearingToleranceDeg: 12,
} as never;

// Standing on the mark, facing the view, phone level, with a good fix.
const onTheMark = { vantage: VANTAGE, coordinate: { latitude: 27.4696, longitude: 83.2758 }, gpsAccuracyM: 4, heading: 1, pitch: 0 };

describe('close-up precision', () => {
  it('locks on the mark with a trustworthy compass', () => {
    expect(computeAlignment({ ...onTheMark, headingQuality: 'good' }).phase).toBe('locked');
  });

  it('never locks with a compass the phone itself calls unreliable', () => {
    const state = computeAlignment({ ...onTheMark, headingQuality: 'poor' });
    expect(state.phase).toBe('seeking');
    expect(state.blockedBy).toBe('heading');
  });

  it('reports the tolerance actually used, after the visitor setting', () => {
    expect(computeAlignment({ ...onTheMark, toleranceFactor: 1.4 }).tolPosM).toBeCloseTo(11.2);
  });

  it('never quotes a distance finer than the GPS can tell', () => {
    const near = computeAlignment({ ...onTheMark, coordinate: { latitude: 27.4696 + 3 / 111_195, longitude: 83.2758 }, gpsAccuracyM: 6, headingQuality: 'good' });
    expect(alignmentHint(near)).not.toMatch(/\d+\.\d+ m/);
    const far = computeAlignment({ ...onTheMark, coordinate: { latitude: 27.4696 + 30 / 111_195, longitude: 83.2758 }, gpsAccuracyM: 6, headingQuality: 'good' });
    expect(alignmentHint(far)).toMatch(/Walk about 30 m toward the mark/);
  });
});
