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
