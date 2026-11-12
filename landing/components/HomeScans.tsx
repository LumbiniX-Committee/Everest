'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Play } from 'lucide-react';

import { SCANS, scanEmbedUrl } from '@/lib/generated/scans';

type Locale = 'en' | 'ne';

/*
 * Real scans on the home page, light enough not to cost the page anything:
 * one large still and a short list. Sketchfab's player (several megabytes, and
 * a third party) loads only when someone presses play, and the connection is
 * warmed when they point at the button, not before.
 */

/** The whole Swayambhu hill first, then a spread of places and kinds of capture. */
const FEATURED = [
  '5dabfc2162fa44b4b415caf9358faddb', // Swayambhu hill, drone survey
  '0db5beb3c6cb45f2b6c3fb63cc342044', // Kal Bhairav
  'e28fe3fbf3a14c4f8aa83316382d8dc4', // Krishna Mandir, Patan
  '4cdd98a88d3740ccb55c7510725bd98c', // Maya Devi Temple
  '1faa2c27977041ad8877c88abecc8d24', // Tsarang, Mustang
];
const PICKS = FEATURED.map((id) => SCANS.find((s) => s.id === id)).filter((s): s is (typeof SCANS)[number] => Boolean(s));

const COPY = {
  en: {
    title: 'Nepal, scanned in 3D',
    lede: 'Drone surveys and photogrammetry by Nepali surveyors, university teams and photographers. Each plays in Sketchfab’s player with its creator’s credit, and nothing loads until you press play.',
    play: 'Load the 3D scan',
    by: 'by',
    all: (n: number) => `All ${n} scans, and our models in AR`,
    map: 'In the app, a 3D badge on the map marks each one.',
    shownOnly: 'Shown in Sketchfab’s player, not copied',
  },
  ne: {
    title: 'नेपाल, 3D मा स्क्यान गरिएको',
    lede: 'नेपाली सर्वेक्षक, विश्वविद्यालयका टोली र फोटोग्राफरले गरेका ड्रोन सर्वेक्षण र फोटोग्रामेट्री। हरेक निर्माताको श्रेयसहित Sketchfab को प्लेयरमा चल्छ, र तपाईंले नथिचेसम्म केही लोड हुँदैन।',
    play: '3D स्क्यान खोल्नुहोस्',
    by: 'द्वारा',
    all: (n: number) => `सबै ${n} स्क्यान, र AR मा हाम्रा मोडेल`,
    map: 'एपको नक्सामा, हरेक स्क्यानको ठाउँमा 3D चिन्ह हुन्छ।',
    shownOnly: 'Sketchfab को प्लेयरमा मात्र देखाइएको, प्रतिलिपि गरिएको छैन',
  },
} as const;

function preconnectSketchfab() {
  for (const href of ['https://sketchfab.com', 'https://static.sketchfab.com', 'https://media.sketchfab.com']) {
    if (document.head.querySelector(`link[rel="preconnect"][href="${href}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = href;
    link.crossOrigin = '';
    document.head.appendChild(link);
  }
}

export function HomeScans({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [id, setId] = useState(PICKS[0]?.id);
  const [playing, setPlaying] = useState(false);
  const scan = PICKS.find((s) => s.id === id) ?? PICKS[0];
  if (!scan) return null;

  return (
    <section aria-labelledby="scans-title" className="px-6 py-20 sm:py-28">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-ink sm:aspect-[16/10]">
          {playing ? (
            <iframe
              title={`${scan.label}, ${c.by} ${scan.creator}`}
              src={scanEmbedUrl(scan.id)}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
              className="absolute inset-0 size-full border-0"
            />
          ) : (
            <button
              type="button"
              onClick={() => setPlaying(true)}
              onPointerEnter={preconnectSketchfab}
              onFocus={preconnectSketchfab}
              aria-label={`${c.play}: ${scan.label}`}
              className="group absolute inset-0 block text-left focus-visible:outline-3 focus-visible:-outline-offset-4 focus-visible:outline-marigold"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- a remote Sketchfab still, shown as is */}
              <img
                key={scan.id}
                src={scan.poster}
                alt=""
                loading="lazy"
                decoding="async"
                className="size-full object-cover transition duration-500 ease-out group-hover:scale-[1.015] motion-reduce:transition-none"
              />
              <span className="absolute inset-0 grid place-items-center">
                <span className="inline-flex min-h-12 items-center gap-2 rounded-full bg-ink/90 px-5 text-base font-semibold text-ground transition group-hover:bg-ink motion-reduce:transition-none">
                  <Play className="size-4" aria-hidden /> {c.play}
                </span>
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-ink/80 px-5 py-3 text-sm text-ground">
                <span className="font-semibold">{scan.label}</span>
                <span className="text-ground/80">{` · ${scan.kind} ${c.by} ${scan.creator}`}</span>
              </span>
            </button>
          )}
        </div>

        <div>
          <h2 id="scans-title" className="font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold tracking-tight text-ink sm:text-5xl">
            {c.title}
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-ink-soft">{c.lede}</p>

          <ul className="mt-8 space-y-1">
            {PICKS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => {
                    setId(s.id);
                    setPlaying(false);
                  }}
                  aria-pressed={s.id === scan.id}
                  className={`flex w-full items-center gap-4 rounded-2xl p-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-sakshi motion-reduce:transition-none ${
                    s.id === scan.id ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/60'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- a remote Sketchfab thumbnail, shown as is */}
                  <img src={s.thumbnail} alt="" loading="lazy" decoding="async" width={80} height={60} className="h-15 w-20 shrink-0 rounded-xl bg-ink object-cover" />
                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">{s.label}</span>
                    <span className="block truncate text-sm text-ink-muted">
                      {s.creator} · {s.openLicence ? s.licence : c.shownOnly}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <Link
            href={`/${locale}/3d`}
            className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-full bg-ink px-6 font-semibold text-ground transition hover:bg-ink/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sakshi motion-reduce:transition-none"
          >
            {c.all(SCANS.length)} <ArrowRight className="size-4" aria-hidden />
          </Link>
          <p className="mt-4 text-sm text-ink-muted">{c.map}</p>
        </div>
      </div>
    </section>
  );
}
