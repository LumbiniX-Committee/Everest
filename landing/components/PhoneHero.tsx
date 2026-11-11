import Image from 'next/image';
import { BadgeCheck, MapPin, WifiOff } from 'lucide-react';

import type { ExplorerSite } from '@/lib/generated/explorer';

const COPY = {
  en: {
    here: 'You are here',
    depth: ['Glance', 'Story', 'Scholar'],
    sources: (n: number) => `${n} sources`,
    offline: 'Works offline',
    cited: 'Every fact cited',
    alt: 'The white Maya Devi Temple reflected in the Puskarini pond at Lumbini.',
    credit: 'Photo: Dhrubapaudel, CC BY-SA 4.0, via Wikimedia Commons',
    label: 'The Sākṣī app at Maya Devi Temple, at Glance depth',
  },
  ne: {
    here: 'तपाईं यहाँ हुनुहुन्छ',
    depth: ['झलक', 'कथा', 'विद्वत्'],
    sources: (n: number) => `${n} स्रोत`,
    offline: 'अफलाइन चल्छ',
    cited: 'हरेक तथ्यको स्रोत',
    alt: 'लुम्बिनीको पुष्करिणी पोखरीमा प्रतिबिम्बित सेतो मायादेवी मन्दिर।',
    credit: 'तस्बिर: Dhrubapaudel, CC BY-SA 4.0, विकिमिडिया कमन्स',
    label: 'मायादेवी मन्दिरमा साक्षी एप, झलक गहिराइमा',
  },
};

/**
 * A phone at Maya Devi Temple, showing what the app shows there.
 *
 * Built from the app's own seed text and a credited photograph rather than a
 * screenshot, so it stays sharp at any size and never drifts from the data.
 */
export function PhoneHero({ site, locale }: { site: ExplorerSite; locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  return (
    <figure className="relative mx-auto w-full max-w-[22rem]">
      <div
        role="img"
        aria-label={c.label}
        className="relative rounded-[3rem] border border-ink/10 bg-ink p-2.5 shadow-2xl shadow-ink/30"
      >
        <div className="overflow-hidden rounded-[2.4rem] bg-ground">
          <div className="relative">
            <Image
              src="/photos/maya-devi-puskarini.jpg"
              alt={c.alt}
              width={1920}
              height={1438}
              priority
              sizes="352px"
              className="aspect-[4/3.4] w-full object-cover object-[50%_40%]"
            />
            <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-semibold text-ground backdrop-blur">
              <MapPin className="size-3.5" aria-hidden />
              {c.here}
            </span>
          </div>
          <div className="-mt-6 rounded-t-3xl bg-surface p-5">
            <p className="text-[11px] font-semibold tracking-widest text-sandstone-deep uppercase">{site.zone}</p>
            <p className="mt-0.5 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
              {locale === 'ne' && site.nameNe ? site.nameNe : site.name}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-1 text-center text-xs">
              {c.depth.map((label, i) => (
                <span key={label} className={i === 0 ? 'rounded-lg bg-surface py-1.5 font-semibold text-ink shadow-sm' : 'py-1.5 text-ink-muted'}>
                  {label}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">{site.lede}</p>
            <p className="mt-3 text-[11px] text-ink-muted">{c.sources(site.sources.length)}</p>
          </div>
        </div>
      </div>

      {/* Two quiet facts, floating at the edges. */}
      <span className="float-slow absolute top-24 -left-6 hidden items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 py-3 text-sm font-semibold text-ink shadow-xl sm:inline-flex">
        <BadgeCheck className="size-5 text-sandstone" aria-hidden />
        {c.cited}
      </span>
      <span className="float-slower absolute -right-10 -bottom-2 hidden items-center gap-2 rounded-2xl border border-line bg-surface/95 px-4 py-3 text-sm font-semibold text-ink shadow-xl sm:inline-flex">
        <WifiOff className="size-5 text-marigold" aria-hidden />
        {c.offline}
      </span>

      <figcaption className="mt-4 text-center text-xs text-ink-muted">{c.credit}</figcaption>
    </figure>
  );
}
