'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Compass, Crosshair, Layers, Loader2, MapPin, Quote, ScrollText } from 'lucide-react';
import 'maplibre-gl/dist/maplibre-gl.css';

import { SITES, type ExplorerSite } from '@/lib/generated/explorer';

/** Kept in step with scripts/copy-map-worker.mjs, which stages this file. */
const WORKER_FILE = 'maplibre-gl-worker.mjs';

/**
 * The map explorer — the site's centrepiece, and the closest thing the web can
 * be to the app's front door.
 *
 * Everything here is the app's real data, generated from `seed/` rather than
 * retyped: fifteen sites with their true coordinates, their sourced facts,
 * their timelines, and the count of established viewpoints at each. A visitor
 * who moves around this map is doing on a desktop what Tīrtha does in the hand.
 *
 * The wisdom tiers are not a website flourish either. They mirror
 * `core/wisdom/index.ts` exactly — the same ladder of depth, built from the
 * same already-sourced fields, so switching to `high` makes a place say *more*
 * without letting it say anything it could not already support.
 */

const TIERS = ['basic', 'medium', 'high'] as const;
type Tier = (typeof TIERS)[number];

/** Mirrors DEPTHS in core/wisdom/index.ts. Depth over sourced material only. */
const DEPTH: Record<Tier, { prose: 'short' | 'full'; facts: boolean; sources: boolean; scripture: boolean }> = {
  basic: { prose: 'short', facts: false, sources: false, scripture: false },
  medium: { prose: 'full', facts: true, sources: true, scripture: false },
  high: { prose: 'full', facts: true, sources: true, scripture: true },
};

const TIER_NOTE: Record<Tier, string> = {
  basic: 'A single line as you pass. Nothing arrives unasked.',
  medium: 'The full description, its facts, and the records they came from.',
  high: 'Everything above, plus the canonical passages the place rests on.',
};

const REGIONS = [
  { id: 'all', label: 'Everywhere', center: [84.3, 27.6] as [number, number], zoom: 6.6 },
  { id: 'lumbini', label: 'Lumbini', center: [83.276, 27.478] as [number, number], zoom: 12.4 },
  { id: 'kathmandu', label: 'Kathmandu Valley', center: [85.376, 27.695] as [number, number], zoom: 11.2 },
] as const;

/** `dn14` reads as a filename; `DN 14` reads as a citation. */
function citation(id: string) {
  const m = id.match(/^([a-z]+)(\d.*)$/i);
  return m ? `${m[1].toUpperCase()} ${m[2]}` : id.toUpperCase();
}

const STORE_KEY = 'sakshi.explorer.visited.v1';

export function MapExplorer() {
  const holder = useRef<HTMLDivElement | null>(null);
  const map = useRef<import('maplibre-gl').Map | null>(null);
  const markers = useRef<Map<string, import('maplibre-gl').Marker>>(new Map());

  /* `ready` means the Map object exists, which is all a DOM marker needs.
     `painted` means tiles are actually on screen, and only dims the overlay. */
  const [ready, setReady] = useState(false);
  const [painted, setPainted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [region, setRegion] = useState<(typeof REGIONS)[number]['id']>('all');
  const [tier, setTier] = useState<Tier>('medium');
  const [selectedId, setSelectedId] = useState<string>(SITES[0].id);
  const [visited, setVisited] = useState<string[]>([]);

  const shown = useMemo(
    () => (region === 'all' ? SITES : SITES.filter((s) => s.region === region)),
    [region],
  );
  const selected = useMemo(
    () => SITES.find((s) => s.id === selectedId) ?? SITES[0],
    [selectedId],
  );
  const depth = DEPTH[tier];

  /* Reading what a previous visit gained, so the counter is cumulative rather
     than resetting the moment someone follows a link away and comes back.
     Wrapped because a private window throws on access rather than returning
     null, and a thrown read here would blank the whole explorer. */
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORE_KEY);
      if (raw) setVisited(JSON.parse(raw));
    } catch {
      /* no stored history; the explorer works without one */
    }
  }, []);

  const visit = useCallback((id: string) => {
    setSelectedId(id);
    setVisited((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        window.localStorage.setItem(STORE_KEY, JSON.stringify(next));
      } catch {
        /* the gain is still shown for this session */
      }
      return next;
    });
  }, []);

  /* MapLibre is imported inside the effect rather than at module scope: it
     touches `window` on evaluation, and this component is prerendered. */
  useEffect(() => {
    let cancelled = false;
    let instance: import('maplibre-gl').Map | null = null;
    let overlayTimer: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      try {
        const maplibregl = await import('maplibre-gl');
        if (cancelled || !holder.current) return;

        /* Point MapLibre at the worker copied into public/ by
           scripts/copy-map-worker.mjs. Left alone it resolves the worker
           against its own chunk URL under /_next/static/, gets the HTML 404
           page back, and drops tile parsing onto the main thread. */
        maplibregl.setWorkerUrl(`/${WORKER_FILE}`);

        const m = new maplibregl.Map({
          container: holder.current,
          // OpenFreeMap serves this basemap with no key and no quota, which is
          // the same argument the engineering report makes for owning the tile
          // supply: the map bill must not scale with the visitors we want.
          style: 'https://tiles.openfreemap.org/styles/positron',
          center: REGIONS[0].center,
          zoom: REGIONS[0].zoom,
          attributionControl: { compact: true },
        });
        instance = m;
        map.current = m;

        m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        m.addControl(
          new maplibregl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: true,
            showAccuracyCircle: true,
          }),
          'top-right',
        );

        /* Markers attach as soon as the Map exists. Gating them on the `load`
           event looked right and was wrong: `load` waits on a painted frame, so
           any environment that never paints — a background tab, a headless
           renderer, a GPU-blocked browser — got a working map with no places on
           it. A marker is a DOM overlay and needs none of that. */
        setReady(true);

        m.on('load', () => {
          if (!cancelled) setPainted(true);
        });

        /* Only a style that never arrives is fatal. A single tile 404 must not
           replace a usable map with an apology. */
        m.on('error', () => {
          if (!cancelled && !m.isStyleLoaded()) setFailed(true);
        });

        /* And if `load` never comes at all, the overlay still has to leave:
           covering a map that is drawing fine is worse than dropping a spinner
           slightly early. */
        overlayTimer = setTimeout(() => {
          if (!cancelled) setPainted(true);
        }, 5000);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(overlayTimer);
      markers.current.forEach((m) => m.remove());
      markers.current.clear();
      instance?.remove();
      map.current = null;
    };
  }, []);

  /* Markers are rebuilt when the visible set changes. Plain DOM markers rather
     than a symbol layer: fifteen points do not need a tile pipeline, and DOM
     gives us focus, keyboard activation and a real accessible name. */
  useEffect(() => {
    if (!ready || !map.current) return;
    let live = true;

    (async () => {
      const maplibregl = await import('maplibre-gl');
      if (!live || !map.current) return;

      markers.current.forEach((m) => m.remove());
      markers.current.clear();

      for (const site of shown) {
        const el = document.createElement('button');
        el.type = 'button';
        el.setAttribute('aria-label', `${site.name}, ${site.zone}`);
        el.className = 'sk-pin';
        el.dataset.tier = String(site.tier);
        el.innerHTML = '<span class="sk-pin-dot"></span><span class="sk-pin-ring"></span>';
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          visit(site.id);
        });

        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([site.lon, site.lat])
          .addTo(map.current);
        markers.current.set(site.id, marker);
      }
    })();

    return () => {
      live = false;
    };
  }, [ready, shown, visit]);

  /* Selection and visited-ness are expressed as classes on the existing marker
     elements, so changing either does not tear down and rebuild the layer. */
  useEffect(() => {
    markers.current.forEach((marker, id) => {
      const el = marker.getElement();
      el.classList.toggle('is-selected', id === selectedId);
      el.classList.toggle('is-visited', visited.includes(id));
    });
  }, [selectedId, visited, shown, ready]);

  useEffect(() => {
    const r = REGIONS.find((x) => x.id === region);
    if (!ready || !map.current || !r) return;
    map.current.flyTo({ center: r.center, zoom: r.zoom, duration: 1100, essential: true });
  }, [region, ready]);

  useEffect(() => {
    if (!ready || !map.current) return;
    if (region !== 'all' && selected.region !== region) return;
    map.current.easeTo({
      center: [selected.lon, selected.lat],
      duration: 800,
      zoom: Math.max(map.current.getZoom(), 13.5),
    });
  }, [selected, ready, region]);

  const gained = visited.length;
  const pct = Math.round((gained / SITES.length) * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4 border-b border-line px-5 py-4">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-ink-muted" aria-hidden />
          <div role="group" aria-label="Region" className="flex flex-wrap gap-1">
            {REGIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRegion(r.id)}
                aria-pressed={region === r.id}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  region === r.id
                    ? 'bg-ink text-ground'
                    : 'text-ink-soft hover:bg-surface-secondary hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-ink-muted" aria-hidden />
          <span className="text-sm text-ink-muted">Wisdom</span>
          <div role="group" aria-label="Wisdom depth" className="flex rounded-lg bg-surface-secondary p-0.5">
            {TIERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTier(t)}
                aria-pressed={tier === t}
                className={`rounded-md px-3 py-1 text-sm font-medium capitalize transition ${
                  tier === t ? 'bg-surface text-ink shadow-sm' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="text-right">
            <p className="font-[family-name:var(--font-display)] text-xl leading-none font-semibold text-sakshi tabular-nums">
              {gained}
              <span className="text-ink-muted">/{SITES.length}</span>
            </p>
            <p className="text-xs text-ink-muted">places reached</p>
          </div>
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-secondary"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Places reached"
          >
            <div
              className="h-full rounded-full bg-sakshi transition-[width] duration-700 ease-out"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1.15fr_1fr]">
        {/* Map */}
        <div className="relative h-80 border-b border-line lg:h-[34rem] lg:border-r lg:border-b-0">
          {/* `size-full` rather than `absolute inset-0`: maplibre-gl.css sets
              `.maplibregl-map { position: relative }` on this very element and
              wins the cascade, which turned `inset-0` into nothing and
              collapsed the container to zero height. The canvas kept a default
              300px and was then clipped away by the map's own `overflow:
              hidden`, so the map was present, sized, and completely invisible.
              Taking the height from the sized parent avoids the fight. */}
          <div ref={holder} className="size-full" />

          {!painted && !failed ? (
            <div className="absolute inset-0 grid place-items-center bg-ground-deep text-ink-muted">
              <span className="flex items-center gap-2 text-sm">
                <Loader2 className="size-4 animate-spin" aria-hidden />
                Loading the map
              </span>
            </div>
          ) : null}

          {failed ? (
            <div className="absolute inset-0 grid place-items-center bg-ground-deep p-6 text-center">
              <div>
                <Compass className="mx-auto size-6 text-ink-muted" aria-hidden />
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  The basemap could not be reached. Every place below is still
                  listed, with the same facts and the same sources.
                </p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Panel */}
        <div className="flex max-h-[34rem] flex-col overflow-y-auto p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-tirtha/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-tirtha uppercase">
              {selected.zone}
            </span>
            {selected.surveyed ? (
              <span className="rounded-full bg-sakshi/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-sakshi uppercase">
                Coordinates checked
              </span>
            ) : (
              <span className="rounded-full bg-earth/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-earth uppercase">
                Approximate
              </span>
            )}
          </div>

          <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight font-semibold text-ink">
            {selected.name}
          </h3>
          {selected.period ? (
            <p className="mt-1 text-sm text-ink-muted">{selected.period}</p>
          ) : null}

          <p key={`${selected.id}-${tier}`} className="sk-fade mt-5 leading-relaxed text-ink-soft">
            {depth.prose === 'short' ? selected.lede : selected.summary}
          </p>

          {depth.facts && selected.facts.length ? (
            <dl className="sk-fade mt-6 divide-y divide-line border-y border-line">
              {selected.facts.map((f) => (
                <div key={f.label} className="flex gap-4 py-2.5">
                  <dt className="w-32 shrink-0 text-sm text-ink-muted">{f.label}</dt>
                  <dd className="text-sm text-ink">{f.value}</dd>
                </div>
              ))}
            </dl>
          ) : null}

          {selected.timeline.length && depth.prose === 'full' ? (
            <div className="sk-fade mt-6">
              <h4 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                What happened here
              </h4>
              <ol className="mt-3 space-y-3 border-l border-line pl-4">
                {selected.timeline.map((e) => (
                  <li key={e.label} className="relative">
                    <span className="absolute -left-[1.3rem] top-1.5 size-2 rounded-full bg-sandstone" />
                    <p className="text-sm font-semibold text-ink">
                      {e.label}{' '}
                      <span className="font-normal text-ink-muted tabular-nums">
                        {e.from < 0 ? `${Math.abs(e.from)} BCE` : e.from}
                        {e.to && e.to !== e.from ? `–${e.to}` : ''}
                      </span>
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-soft">{e.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {depth.scripture && selected.passages.length ? (
            <div className="sk-fade mt-6 rounded-2xl border border-line border-l-4 border-l-dhamma bg-ground p-4">
              <h4 className="flex items-center gap-2 text-xs font-semibold tracking-widest text-dhamma uppercase">
                <Quote className="size-3.5" aria-hidden />
                Canonical passages
              </h4>
              <p className="mt-2 flex flex-wrap gap-2">
                {selected.passages.map((p) => (
                  <span
                    key={p}
                    className="rounded-md bg-surface px-2 py-1 font-mono text-xs text-ink-soft"
                  >
                    {citation(p)}
                  </span>
                ))}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                Dhamma answers about this place quote these and nothing else.
              </p>
            </div>
          ) : null}

          <div className="sk-fade mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
            <span className="flex items-center gap-1.5">
              <Crosshair className="size-4" aria-hidden />
              {selected.vantages
                ? `${selected.vantages} established viewpoint${selected.vantages > 1 ? 's' : ''}`
                : 'No viewpoint established yet'}
            </span>
            {selected.geofenceM ? (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-4" aria-hidden />
                Speaks within {selected.geofenceM} m
              </span>
            ) : null}
          </div>

          {depth.sources && selected.sources.length ? (
            <div className="sk-fade mt-5">
              <h4 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
                Sources
              </h4>
              <ul className="mt-2 space-y-1.5">
                {selected.sources.map((s) =>
                  /* Not every record in seed/ carries a link — an excavation
                     report may exist only on paper. Naming it is still the
                     citation; a dead href would not be. */
                  s.url ? (
                    <li key={s.title}>
                      <a
                        href={s.url}
                        className="text-sm text-earth underline underline-offset-4 hover:text-sandstone-deep"
                      >
                        {s.title}
                      </a>
                    </li>
                  ) : (
                    <li key={s.title} className="text-sm text-ink-soft">
                      {s.title}
                    </li>
                  ),
                )}
              </ul>
            </div>
          ) : null}

          <p className="mt-6 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">
            {TIER_NOTE[tier]}
          </p>
        </div>
      </div>

      {/* The list is the map's equal, not its fallback: it is how the explorer
          is used with a keyboard, and it is what remains if tiles never load. */}
      <div className="border-t border-line bg-ground-deep px-5 py-4">
        <h4 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
          {shown.length} places {region === 'all' ? 'across both regions' : 'here'}
        </h4>
        <ul className="mt-3 flex flex-wrap gap-2">
          {shown.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => visit(s.id)}
                aria-pressed={s.id === selectedId}
                className={`rounded-lg border px-3 py-1.5 text-sm transition ${
                  s.id === selectedId
                    ? 'border-sakshi bg-sakshi text-white'
                    : visited.includes(s.id)
                      ? 'border-sakshi/40 bg-surface text-ink'
                      : 'border-line bg-surface text-ink-soft hover:border-sakshi/40 hover:text-ink'
                }`}
              >
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export const SITE_COUNT = SITES.length;
