import { formatVisitorCopy, visitorCopy } from '@/i18n/visitor';

describe('visitor copy', () => {
  it('requires and interpolates translated placeholders', () => {
    expect(
      formatVisitorCopy('en', 'capture.previousNote', { date: '10 September 2026' }),
    ).toContain('10 September 2026');
    expect(
      formatVisitorCopy('ne', 'capture.photographyTitle', { status: 'restricted' }),
    ).toBe('यहाँ फोटोग्राफी restricted छ');
  });

  it('keeps source lookup language-specific', () => {
    expect(visitorCopy('en', 'capture.submit')).toBe('Submit observation');
    expect(visitorCopy('ne', 'capture.submit')).toBe('अवलोकन पेश गर्नुहोस्');
  });
});
