import Image from 'next/image';

import type { ExplorerSite } from '@/lib/generated/explorer';

const COPY = {
  en: {
    depth: ['Glance', 'Story', 'Scholar'],
    sources: (n: number) => `${n} sources`,
    alt: 'The white Maya Devi Temple reflected in the Puskarini pond at Lumbini, with the Ashokan Pillar to its left.',
    credit: 'Photo: Dhrubapaudel, CC BY-SA 4.0, via Wikimedia Commons',
    previewLabel: 'What the app shows here, at Glance depth',
  },
  ne: {
    depth: ['झलक', 'कथा', 'विद्वत्'],
    sources: (n: number) => `${n} स्रोत`,
    alt: 'लुम्बिनीको पुष्करिणी पोखरीमा प्रतिबिम्बित सेतो मायादेवी मन्दिर, बायाँपट्टि अशोक स्तम्भसहित।',
    credit: 'तस्बिर: Dhrubapaudel, CC BY-SA 4.0, विकिमिडिया कमन्स',
    previewLabel: 'यहाँ एपले झलक गहिराइमा देखाउने कुरा',
  },
};

/**
 * The hero's picture: a real place, credited, and what the app says about it.
 *
 * The overlay is the app's own Glance text for Maya Devi Temple, from the same
 * seed data the phone ships with, not a mock-up line written for the page.
 */
export function HeroPlace({ site, locale }: { site: ExplorerSite; locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  return (
    <figure className="relative">
      <div className="overflow-hidden rounded-[2rem] border border-line shadow-xl shadow-ink/10">
        <Image
          src="/photos/maya-devi-puskarini.jpg"
          alt={c.alt}
          width={1920}
          height={1438}
          priority
          sizes="(min-width: 1024px) 560px, 100vw"
          className="aspect-[4/4.2] w-full object-cover object-[55%_45%] sm:aspect-[4/4.4]"
        />
      </div>

      <div
        role="group"
        aria-label={c.previewLabel}
        className="relative -mt-24 mx-4 rounded-2xl border border-line bg-surface/95 p-5 shadow-lg backdrop-blur-sm sm:absolute sm:-bottom-10 sm:-left-8 sm:mx-0 sm:mt-0 sm:w-80"
      >
        <p className="text-xs font-semibold tracking-widest text-sandstone-deep uppercase">{site.zone}</p>
        <p className="mt-1 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
          {locale === 'ne' && site.nameNe ? site.nameNe : site.name}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-1 text-center text-sm">
          {c.depth.map((label, i) => (
            <span
              key={label}
              className={i === 0 ? 'rounded-lg border border-line bg-surface py-1.5 font-semibold text-ink' : 'py-1.5 text-ink-muted'}
            >
              {label}
            </span>
          ))}
        </div>
        <p className="mt-3 leading-relaxed text-ink-soft">{site.lede}</p>
        <p className="mt-3 text-xs text-ink-muted">{c.sources(site.sources.length)}</p>
      </div>

      <figcaption className="mt-3 text-right text-xs text-ink-muted sm:mt-3 sm:pl-80">{c.credit}</figcaption>
    </figure>
  );
}
