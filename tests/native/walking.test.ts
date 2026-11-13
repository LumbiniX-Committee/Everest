import { buildMapHtml } from '@/components/map/mapHtml';
import { nearestModel } from '@/components/map/nearestModel';
import { WALK_DEFINITIONS } from '@/data/demoWalks';
import { WALK_PATHS } from '@/data/generated/walkPaths';
import { demoSites } from '@/data';
import { legLine } from '@/services/location/demoWalk';
import { distanceMeters } from '@/utils';
import { newerRuntime } from '@/utils/version';

/** Metres from a point to the nearest point of a polyline. */
function offPath(p: { latitude: number; longitude: number }, line: [number, number][]): number {
  let best = Infinity;
  for (let i = 1; i < line.length; i += 1) {
    const a = { longitude: line[i - 1][0], latitude: line[i - 1][1] };
    const b = { longitude: line[i][0], latitude: line[i][1] };
    for (let t = 0; t <= 1; t += 0.05) {
      best = Math.min(best, distanceMeters(p, { latitude: a.latitude + (b.latitude - a.latitude) * t, longitude: a.longitude + (b.longitude - a.longitude) * t }));
    }
  }
  return best;
}

describe('the demo walk', () => {
  it('has a mapped footpath for every walking leg', () => {
    for (const walk of WALK_DEFINITIONS) {
      walk.legs.forEach((leg, i) => {
        if ('at' in leg && i > 0 && !('circle' in leg)) {
          const prev = walk.legs[i - 1];
          const same = 'at' in prev && prev.at === leg.at;
          if (!same) expect(WALK_PATHS[`${walk.id}:${i}`]).toBeDefined();
        }
      });
    }
  });

  const site = (id: string) => demoSites.find((candidate) => candidate.id === id)!;
  const ktm = WALK_DEFINITIONS.find((walk) => walk.id === 'kathmandu-durbar-square')!;
  const legIndex = (id: string) => ktm.legs.findIndex((leg) => 'at' in leg && leg.at === id);

  it('keeps to the streets between landmarks in the open', () => {
    // Ashok Vinayak to Kasthamandap: round the buildings, not through them.
    const from = site('ktm-ashok-vinayak').coordinate;
    const line = legLine(WALK_PATHS[`kathmandu-durbar-square:${legIndex('ktm-kasthamandap')}`], from, site('ktm-kasthamandap').coordinate, 25);
    expect(line.length).toBeGreaterThan(3);
    const path = WALK_PATHS[`kathmandu-durbar-square:${legIndex('ktm-kasthamandap')}`];
    for (const point of line.slice(1, -1)) expect(offPath(point, path)).toBeLessThan(1);
  });

  it('crosses directly between palace courtyards rather than round the block', () => {
    const from = site('ktm-panchamukhi-hanuman').coordinate;
    const to = site('ktm-mohan-chowk').coordinate;
    const line = legLine(WALK_PATHS[`kathmandu-durbar-square:${legIndex('ktm-mohan-chowk')}`], from, to, 25);
    expect(line).toEqual([from, to]);
  });

  // The rest cross open squares, or palace courtyards the router cannot see into.
  it('follows mapped paths for half or more of the longer legs', () => {
    let routed = 0;
    let legs = 0;
    for (const walk of WALK_DEFINITIONS) {
      let from: { latitude: number; longitude: number } | null = null;
      walk.legs.forEach((leg, i) => {
        if ('start' in leg) { from = leg.start; return; }
        if (!('at' in leg) || !from) return;
        const target = site(leg.at).coordinate;
        if (distanceMeters(from, target) > 25) {
          legs += 1;
          if (legLine(WALK_PATHS[`${walk.id}:${i}`], from, target, 25).length > 2) routed += 1;
        }
        from = target;
      });
    }
    expect(routed / legs).toBeGreaterThanOrEqual(0.5);
  });
});

describe('the map panel', () => {
  it('opens on the nearest real 3D monument, tilted, in 3D', () => {
    expect(nearestModel({ latitude: 27.6727, longitude: 85.3253 })).toEqual(expect.arrayContaining([expect.any(Number)]));
    const [lng] = nearestModel({ latitude: 27.6727, longitude: 85.3253 });
    expect(lng).toBeGreaterThan(85.3); // Patan, not Lumbini
    const html = buildMapHtml({ avatar: true, openIn3d: true });
    expect(html).toContain("window.sakshiSetMapMode('3d')");
    expect(html).toContain("id: 'sakshi-monuments'");
  });

  it('folds its credits into an (i) rather than a banner', () => {
    const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
    expect(html).toContain('"compact":true');
    expect(html).toContain('maplibregl-compact-show');
  });
});

describe('updates', () => {
  it('asks for a new APK only when the published runtime is newer', () => {
    expect(newerRuntime('1.1.0', '1.0.0')).toBe(true);
    expect(newerRuntime('1.10.0', '1.9.0')).toBe(true);
    expect(newerRuntime('1.0.0', '1.0.0')).toBe(false);
    expect(newerRuntime('0.9.0', '1.0.0')).toBe(false);
  });
});

describe('info points on our models', () => {
  it('stand on the model they describe and show in the 3D map', () => {
    const { MODEL_INFO } = require('@/data/modelInfo') as typeof import('@/data/modelInfo');
    const { MAP_SCANS } = require('@/data/mapScans') as typeof import('@/data/mapScans');
    expect(MODEL_INFO.length).toBeGreaterThan(0);
    for (const point of MODEL_INFO) {
      const model = MAP_SCANS.find((scan) => scan.id === point.modelId);
      expect(model?.modelled).toBe(true);
      expect(distanceMeters(point, model!)).toBeLessThan(15);
      expect(point.body.length).toBeGreaterThan(40);
    }
    const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
    expect(html).toContain('sakshi-info-pin');
    expect(html).toContain('Info points on the models: OMX Lab');
    expect(html).not.toContain('innerHTML = p.');
  });
});
