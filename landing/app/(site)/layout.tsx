import { SiteFooter } from '@/components/SiteFooter';
import { SiteHeader } from '@/components/SiteHeader';

/**
 * Chrome for the public site. The custodian dashboard sits outside this group
 * on purpose: it is a tool someone works in, not a page they were navigated to,
 * and a marketing nav across the top of it would be noise.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
      <SiteFooter />
    </>
  );
}
