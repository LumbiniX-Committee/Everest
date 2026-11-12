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

  it('leave out a model whose site is only known roughly', () => {
    // Swayambhunath's coordinate is 27.715, 85.29: good to a hundred metres, not ten.
    expect(placements.map((p) => p.id)).not.toContain('swayambhunath');
  });

  it('are left out where three.js is not loaded', () => {
    expect(buildMapHtml({ fullscreen: false, interactive: false })).not.toContain("id: 'sakshi-monuments'");
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
