import { findPlace, findSite, MODELS, SCANS, scanEmbedUrl, scansFor } from '@/data';

/** The real scans shown through Sketchfab's player. */
describe('3D scans', () => {
  it('belong to places the app knows', () => {
    for (const scan of SCANS) {
      expect(scan.targets.length).toBeGreaterThan(0);
      for (const id of scan.targets) expect(findSite(id) ?? findPlace(id)).toBeDefined();
    }
  });

  it('call a licence open only when it is Creative Commons', () => {
    for (const scan of SCANS) expect(scan.openLicence).toBe(/^CC /.test(scan.licence));
  });

  it('credit a creator and link back to the original', () => {
    for (const scan of SCANS) {
      expect(scan.creator.length).toBeGreaterThan(0);
      expect(scan.viewerUrl).toMatch(/^https:\/\/sketchfab\.com\//);
    }
  });

  it('ask the player not to track', () => {
    expect(scanEmbedUrl(SCANS[0].id)).toContain('dnt=1');
  });

  it('reach the three major places and the monuments with models', () => {
    for (const id of ['maya-devi-temple', 'wd-Q12946982', 'kathmandu-durbar-square']) expect(scansFor(id).length).toBeGreaterThan(0);
    expect(MODELS.length).toBeGreaterThanOrEqual(13);
  });
});
