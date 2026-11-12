'use client';

import Script from 'next/script';
import { createElement, useEffect, useState } from 'react';
import { ExternalLink, Play, ScanLine } from 'lucide-react';

import { MODELS } from '@/lib/generated/models';
import { SCANS, scanEmbedUrl } from '@/lib/generated/scans';

type Locale = 'en' | 'ne';

const COPY = {
  en: {
    modelsTitle: 'Turn it, study it, stand it in your room',
    modelsLede:
      'Our own models, built from photographs and published measurements. They are schematic: the overall heights come from sources, the rest is estimated, and each feature below says what is known.',
    ar: 'View in your space',
    arNote: 'Opens the camera on phones that support AR (Android with Google’s Scene Viewer, iPhone with Quick Look). It starts at real size: step back or pinch.',
    look: 'What to look for',
    sources: 'Sources',
    pick: 'Choose a monument',
    scansTitle: 'Real scans of the places',
    scansLede:
      'Captured by photographers, drone surveyors and university teams, many of them Nepali. They play in Sketchfab’s player, which keeps the creator’s credit and has its own VR mode. Nothing loads from Sketchfab until you press play.',
    play: 'Load the 3D scan',
    by: 'by',
    openLicence: (licence: string) => `${licence}, via Sketchfab`,
    shownOnly: 'Shown in Sketchfab’s player; not offered for download, so not copied here.',
    open: 'Open on Sketchfab',
    captured: 'Captured',
  },
  ne: {
    modelsTitle: 'घुमाउनुहोस्, अध्ययन गर्नुहोस्, आफ्नो कोठामा उभ्याउनुहोस्',
    modelsLede:
      'तस्बिर र प्रकाशित नापबाट बनाइएका हाम्रा आफ्नै मोडेल। यी सरलीकृत हुन्: कुल उचाइ स्रोतबाट, बाँकी अनुमान, र तलको हरेक विशेषताले के थाहा छ भन्छ।',
    ar: 'आफ्नो ठाउँमा हेर्नुहोस्',
    arNote: 'AR समर्थन गर्ने फोनमा क्यामेरा खुल्छ (Android मा Google Scene Viewer, iPhone मा Quick Look)। वास्तविक आकारमा सुरु हुन्छ: पछि सर्नुहोस् वा चिम्टनुहोस्।',
    look: 'के हेर्ने',
    sources: 'स्रोत',
    pick: 'स्मारक रोज्नुहोस्',
    scansTitle: 'ठाउँहरूका वास्तविक स्क्यान',
    scansLede:
      'फोटोग्राफर, ड्रोन सर्वेक्षक र विश्वविद्यालयका टोलीले खिचेका, धेरैजसो नेपालीले। Sketchfab को प्लेयरमा चल्छन्, जसले निर्माताको श्रेय राख्छ र आफ्नै VR मोड दिन्छ। तपाईंले नथिचेसम्म Sketchfab बाट केही लोड हुँदैन।',
    play: '3D स्क्यान खोल्नुहोस्',
    by: 'द्वारा',
    openLicence: (licence: string) => `${licence}, Sketchfab मार्फत`,
    shownOnly: 'Sketchfab को प्लेयरमा मात्र देखाइएको; डाउनलोडका लागि उपलब्ध नभएकाले यहाँ प्रतिलिपि गरिएको छैन।',
    open: 'Sketchfab मा खोल्नुहोस्',
    captured: 'खिचिएको',
  },
} as const;

/** The most detailed model opens first: the courtyard, Nandi, the river and the shrines. */
const DEFAULT_MODEL = 'pashupatinath';
const sentence = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** The model named in the address (#boudhanath), so the app's AR fallback and shared links land on it. */
function initialModel(): string {
  if (typeof window === 'undefined') return MODELS[0].id;
  const hash = window.location.hash.slice(1);
  return MODELS.some((m) => m.id === hash) ? hash : DEFAULT_MODEL;
}

export function ModelStage({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [id, setId] = useState(DEFAULT_MODEL);
  const [focus, setFocus] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setTimeout(() => setId(initialModel()), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const model = MODELS.find((m) => m.id === id) ?? MODELS[0];

  const choose = (next: string) => {
    setId(next);
    setFocus(null);
    window.history.replaceState(null, '', `#${next}`);
  };

  const viewer = createElement(
    'model-viewer',
    {
      key: model.id,
      src: `/models/${model.id}.gltf`,
      alt: model.title,
      'camera-controls': true,
      'touch-action': 'pan-y',
      'auto-rotate': focus == null ? true : undefined,
      'auto-rotate-delay': '2500',
      'rotation-per-second': '10deg',
      'shadow-intensity': '0.9',
      exposure: '1.05',
      'environment-image': 'neutral',
      ar: true,
      'ar-modes': 'webxr scene-viewer quick-look',
      'ar-scale': 'auto',
      'interaction-prompt': 'none',
      'camera-target': focus != null ? model.hotspots[focus].position.map((v) => `${v}m`).join(' ') : 'auto auto auto',
      style: { width: '100%', height: '100%', background: 'transparent' },
    },
    ...model.hotspots.map((spot, i) =>
      createElement(
        'button',
        {
          key: spot.label,
          slot: `hotspot-${i}`,
          'data-position': spot.position.join(' '),
          'data-normal': '0 0 1',
          onClick: () => setFocus(i),
          'aria-label': spot.label,
          className: `flex size-8 items-center justify-center rounded-full border-2 border-white text-sm font-bold shadow ${focus === i ? 'bg-ink text-white' : 'bg-marigold text-on-marigold'}`,
        },
        String(i + 1),
      ),
    ),
    createElement(
      'button',
      {
        key: 'ar',
        slot: 'ar-button',
        className: 'absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg',
      },
      createElement(ScanLine, { className: 'size-4', 'aria-hidden': true }),
      c.ar,
    ),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <Script src="/vendor/model-viewer.min.js" strategy="afterInteractive" />
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_35%,#ffffff,#e6efe8)]">
          {viewer}
        </div>
        <p className="mt-3 text-sm text-ink-muted">{c.arNote}</p>
      </div>

      <div className="space-y-6">
        <label className="block">
          <span className="text-sm font-semibold text-ink-soft">{c.pick}</span>
          <select
            className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-ink"
            value={model.id}
            onChange={(e) => choose(e.target.value)}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.title}</option>
            ))}
          </select>
        </label>
        <div>
          <h3 className="font-semibold text-ink">{c.look}</h3>
          <ol className="mt-2 space-y-1.5">
            {model.hotspots.map((spot, i) => (
              <li key={spot.label}>
                <button
                  type="button"
                  onClick={() => setFocus(i)}
                  className={`flex w-full gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${focus === i ? 'bg-surface-secondary' : 'hover:bg-surface-secondary/60'}`}
                >
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-marigold text-xs font-bold text-on-marigold tabular">{i + 1}</span>
                  <span>
                    <span className="block font-medium text-ink">{spot.label}</span>
                    <span className="block text-sm leading-snug text-ink-soft">{spot.note}</span>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="text-sm">
          <p className="font-semibold text-ink-soft">{c.sources}</p>
          <ul className="mt-1 space-y-1">
            {model.sources.map((s) => (
              <li key={s.url}>
                <a className="text-sandstone-deep underline-offset-4 hover:underline" href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function ScanGallery({ locale }: { locale: Locale }) {
  const c = COPY[locale];
  const [playing, setPlaying] = useState<string | null>(null);
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {SCANS.map((scan) => (
        <li key={scan.id} className="flex flex-col overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="relative aspect-[4/3] bg-ink">
            {playing === scan.id ? (
              <iframe
                title={`${scan.label}, ${c.by} ${scan.creator}`}
                src={scanEmbedUrl(scan.id)}
                allow="autoplay; fullscreen; xr-spatial-tracking"
                allowFullScreen
                className="absolute inset-0 size-full border-0"
              />
            ) : (
              <button type="button" onClick={() => setPlaying(scan.id)} className="group absolute inset-0 block" aria-label={`${c.play}: ${scan.label}`}>
                {/* eslint-disable-next-line @next/next/no-img-element -- a remote Sketchfab thumbnail, shown as is */}
                <img src={scan.thumbnail} alt="" loading="lazy" className="size-full object-cover transition duration-300 group-hover:scale-[1.02] motion-reduce:transition-none" />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="inline-flex items-center gap-2 rounded-full bg-ink/85 px-4 py-2.5 text-sm font-semibold text-white">
                    <Play className="size-4" aria-hidden /> {c.play}
                  </span>
                </span>
                <span className="absolute top-3 left-3 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-medium text-white">{sentence(scan.kind)}</span>
              </button>
            )}
          </div>
          <div className="flex flex-1 flex-col p-5">
            <h3 className="text-lg font-semibold text-ink">{scan.label}</h3>
            <p className="mt-1 leading-relaxed text-ink-soft">{scan.note}</p>
            <p className="mt-3 text-sm text-ink-muted">
              {`“${scan.title}” ${c.by} `}
              <a href={scan.creatorUrl} target="_blank" rel="noreferrer" className="font-medium text-ink underline-offset-4 hover:underline">{scan.creator}</a>
              {scan.captured ? ` · ${c.captured} ${scan.captured}` : ''}
            </p>
            <p className="mt-1 text-xs text-ink-muted">{scan.openLicence ? c.openLicence(scan.licence) : c.shownOnly}</p>
            <a href={scan.viewerUrl} target="_blank" rel="noreferrer" className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-sandstone-deep hover:underline">
              {c.open} <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}

