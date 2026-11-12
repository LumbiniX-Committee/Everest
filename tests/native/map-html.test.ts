import { buildMapHtml } from '@/components/map/mapHtml';

/** Every inline script the map page runs, so a typo in the template fails here, not on a phone. */
function scripts(html: string): string[] {
  return [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);
}

describe('map page', () => {
  it.each([
    { fullscreen: true, interactive: true, avatar: true },
    { fullscreen: false, interactive: false, avatar: false },
  ])('parses with %o', (options) => {
    const html = buildMapHtml(options);
    const own = scripts(html).filter((code) => code.includes('sakshiSetMapMode'));
    expect(own).toHaveLength(1);
    expect(() => new Function(own[0])).not.toThrow();
  });

  it('takes imagery at run time, never a key baked into the page', () => {
    const html = buildMapHtml({ fullscreen: true, interactive: true });
    expect(html).toContain('window.sakshiSetImagery');
    expect(html).toContain('window.sakshiSetWaypoints');
    expect(html).not.toMatch(/AIza|maptiler\.com\/tiles/);
  });
});

describe('map page without the figure', () => {
  it('still draws a route, waypoints and your position', () => {
    const html = buildMapHtml({ fullscreen: false, interactive: false, avatar: false });
    for (const hook of ['sakshiSetRoute', 'sakshiSetWaypoints', 'sakshiSetPose', 'sakshiFitLine']) {
      expect(html).toContain(`window.${hook}`);
    }
  });
});

describe('the walking figure', () => {
  it('credits Renderpeople on the map wherever the figure can be drawn', () => {
    expect(buildMapHtml({ fullscreen: true, interactive: true, avatar: true })).toContain('Walking figure: <a');
    expect(buildMapHtml({ fullscreen: false, interactive: false, avatar: false })).not.toContain('Renderpeople');
  });
});

describe('monument models on the map', () => {
  const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
  const placements = JSON.parse(html.match(/var PLACEMENTS = (\[.*?\]);/)![1]) as { id: string }[];

  it('stand our own models at their sites, with the town stepping aside', () => {
    expect(html).toContain("id: 'sakshi-monuments'");
    expect(html).toContain('sakshiModelZones');
    expect(placements.map((p) => p.id)).toEqual(expect.arrayContaining(['kasthamandap', 'peace-pagoda-lumbini', 'ashokan-pillar']));
    expect(html).toContain('3D monuments: schematic models, not surveys');
  });

  it('stand Swayambhunath where OpenStreetMap draws it, not at its rounded record', () => {
    const swayambhu = placements.find((p) => p.id === 'swayambhunath') as unknown as { latitude: number; longitude: number };
    expect(swayambhu.latitude).toBeCloseTo(27.714931, 5);
    expect(swayambhu.longitude).toBeCloseTo(85.290391, 5);
  });

  it('are left out where three.js is not loaded', () => {
    expect(buildMapHtml({ fullscreen: false, interactive: false })).not.toContain("id: 'sakshi-monuments'");
  });
});

describe('real 3D scans on the map', () => {
  it('pin every scan spot, and say which scan a tap opens', () => {
    const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
    expect(html).toContain("id:'scan-pin'");
    expect(html).toContain("post({ type:'scan'");
    // The whole-hill drone survey of Swayambhu is the first scan at its pin.
    expect(html).toContain('5dabfc2162fa44b4b415caf9358faddb');
  });

  it('leave the small map without them', () => {
    expect(buildMapHtml({ fullscreen: false, interactive: false })).not.toContain("id:'scan-pin'");
  });
});

describe('real scans standing on the map', () => {
  const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
  const placements = JSON.parse(html.match(/var PLACEMENTS = (\[.*?\]);/)![1]) as { id: string; scan: boolean; file: string }[];

  it('load the openly licensed scans from the website, credited by creator', () => {
    const scans = placements.filter((p) => p.scan).map((p) => p.file);
    expect(scans).toEqual(expect.arrayContaining(['scans/yetkha-bahal.glb', 'scans/keshar-mahal.glb']));
    expect(html).toContain('3D scans on the map: Airlift Technology, Bhugol Tour');
  });
});

describe('walking view', () => {
  it('is offered on the full map and ends when the map is dragged', () => {
    const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
    expect(html).toContain('window.sakshiSetWalkView');
    expect(html).toContain("post({ type: 'walk-view'");
    expect(html).toContain('window.sakshiTownCheck');
  });
});

describe('the 3D town', () => {
  it('replaces the plain boxes in 3D mode when the figure (and so three.js) is loaded', () => {
    const html = buildMapHtml({ fullscreen: true, interactive: true, avatar: true });
    expect(html).toContain("id: 'sakshi-town'");
    expect(html).toContain('sakshiTownRefresh');
    const own = scripts(html).filter((code) => code.includes('sakshiSetMapMode'));
    expect(() => new Function(own[0])).not.toThrow();
  });

  it('is left out where three.js is not loaded', () => {
    expect(buildMapHtml({ fullscreen: false, interactive: false })).not.toContain("id: 'sakshi-town'");
  });
});
