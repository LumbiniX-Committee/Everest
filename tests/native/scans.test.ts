import { findPlace, findSite, MODELS, SCANS, scanEmbedUrl, scansFor } from '@/data';

/** The real scans shown through Sketchfab's player. */
describe('3D scans', () => {
  it('belong to places the app knows, where they name one', () => {
    for (const scan of SCANS) {
      for (const id of scan.targets) expect(findSite(id) ?? findPlace(id)).toBeDefined();
    }
    // Most open from a place page; the few with no page (Tsarang and Ghemi
    // in Upper Mustang, Bagdwar, the Nag Bahal tap) are reached from their
    // pin on the map and the gallery.
    expect(SCANS.filter((scan) => scan.targets.length === 0).length).toBeLessThanOrEqual(4);
  });

  it('stand on the map inside Nepal', () => {
    for (const scan of SCANS) {
      expect(scan.at.latitude).toBeGreaterThan(26.3);
      expect(scan.at.latitude).toBeLessThan(30.5);
      expect(scan.at.longitude).toBeGreaterThan(80);
      expect(scan.at.longitude).toBeLessThan(88.3);
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
