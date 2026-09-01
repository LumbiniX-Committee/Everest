'use client';

import { useState } from 'react';
import { Check, TriangleAlert } from 'lucide-react';

/**
 * A hands-on model of the one mechanic that separates this from a photo album:
 * a frame only locks when the sensors agree it is on the stored vantage *and*
 * the GPS is accurate enough for that agreement to mean anything.
 *
 * The tolerances are the real ones — `tol_pos_m: 8` and `tol_heading_deg: 12`
 * from seed/vantages.json — because a demo that quietly loosens them to look
 * good would be the exact dishonesty the product refuses.
 *
 * The GPS switch is the point of the whole widget. Drag to a perfect alignment,
 * turn the fix off, and the lock does not come: it falls back to "by eye", the
 * record says so, and the colour changes. That refusal is the product.
 */

const TOL = { pos: 8, heading: 12, pitch: 6 };

export function AlignmentDial() {
  const [align, setAlign] = useState(18);
  const [goodFix, setGoodFix] = useState(true);

  const off = 1 - align / 100;
  const pos = +(off * 26).toFixed(1);
  const heading = +(off * 44).toFixed(0);
  const pitch = +(off * 19).toFixed(0);

  const onTarget = pos <= TOL.pos && heading <= TOL.heading && pitch <= TOL.pitch;
  const locked = onTarget && goodFix;
  const byEye = onTarget && !goodFix;

  // The frame drifts by the same offsets the readouts show, so the picture and
  // the numbers can never disagree.
  const dx = off * 46;
  const dy = off * 30;
  const rot = off * 9;

  const rows = [
    { label: 'Position', value: `${pos} m`, ok: pos <= TOL.pos, tol: `≤ ${TOL.pos} m` },
    { label: 'Heading', value: `${heading}°`, ok: heading <= TOL.heading, tol: `≤ ${TOL.heading}°` },
    { label: 'Tilt', value: `${pitch}°`, ok: pitch <= TOL.pitch, tol: `≤ ${TOL.pitch}°` },
  ];

  return (
    <div className="overflow-hidden rounded-3xl border border-line bg-surface shadow-sm">
      <div className="grid sm:grid-cols-[1fr_1fr]">
        {/* Viewfinder */}
        <div className="relative aspect-[4/3] border-b border-line bg-ground-deep sm:border-r sm:border-b-0">
          <svg viewBox="0 0 320 240" className="absolute inset-0 size-full" aria-hidden>
            {/* The stored vantage: where the last photograph was taken from. */}
            <rect
              x="82"
              y="52"
              width="156"
              height="136"
              rx="4"
              fill="none"
              stroke="var(--color-ink-muted)"
              strokeWidth="1.5"
              strokeDasharray="5 5"
            />
            <line x1="160" y1="104" x2="160" y2="136" stroke="var(--color-ink-muted)" strokeWidth="1.5" />
            <line x1="144" y1="120" x2="176" y2="120" stroke="var(--color-ink-muted)" strokeWidth="1.5" />

            {/* Where the phone is actually pointing. */}
            <g
              style={{
                transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg)`,
                transformOrigin: '160px 120px',
                transition: 'transform 220ms ease-out',
              }}
            >
              <rect
                x="82"
                y="52"
                width="156"
                height="136"
                rx="4"
                fill={locked ? 'color-mix(in srgb, var(--color-sakshi) 10%, transparent)' : 'transparent'}
                stroke={locked ? 'var(--color-sakshi)' : byEye ? 'var(--color-earth)' : 'var(--color-ink-soft)'}
                strokeWidth={locked ? 2.5 : 2}
                style={{ transition: 'stroke 220ms ease, stroke-width 220ms ease' }}
              />
              <circle
                cx="160"
                cy="120"
                r="5"
                fill={locked ? 'var(--color-sakshi)' : byEye ? 'var(--color-earth)' : 'var(--color-ink-soft)'}
                style={{ transition: 'fill 220ms ease' }}
              />
            </g>
          </svg>

          <div className="absolute inset-x-0 bottom-0 p-4">
            <span
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold shadow-sm transition ${
                locked
                  ? 'bg-sakshi text-white'
                  : byEye
                    ? 'bg-earth text-white'
                    : 'bg-surface text-ink-soft'
              }`}
            >
              {locked ? (
                <>
                  <Check className="size-4" aria-hidden />
                  Locked — recorded as measured
                </>
              ) : byEye ? (
                <>
                  <TriangleAlert className="size-4" aria-hidden />
                  By eye — the record will say so
                </>
              ) : (
                'Not aligned'
              )}
            </span>
          </div>
        </div>

        {/* Readouts and controls */}
        <div className="p-6">
          <dl className="divide-y divide-line">
            {rows.map((r) => (
              <div key={r.label} className="flex items-baseline gap-3 py-2.5">
                <dt className="w-20 text-sm text-ink-muted">{r.label}</dt>
                <dd
                  className={`font-mono text-lg tabular-nums transition-colors ${
                    r.ok ? 'text-sakshi' : 'text-ink'
                  }`}
                >
                  {r.value}
                </dd>
                <dd className="ml-auto text-xs text-ink-muted">{r.tol}</dd>
              </div>
            ))}
          </dl>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-ink">Move onto the vantage</span>
            <input
              type="range"
              min={0}
              max={100}
              value={align}
              onChange={(e) => setAlign(Number(e.target.value))}
              className="mt-2 w-full accent-[var(--color-sakshi)]"
            />
          </label>

          <label className="mt-5 flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={goodFix}
              onChange={(e) => setGoodFix(e.target.checked)}
              className="mt-1 size-4 accent-[var(--color-sakshi)]"
            />
            <span className="text-sm leading-relaxed text-ink-soft">
              <span className="font-medium text-ink">GPS accuracy is good enough</span>
              <span className="mt-0.5 block text-ink-muted">
                Turn this off with the frame perfectly aligned. The lock does not
                come — it falls back to &ldquo;by eye&rdquo;, and the record keeps
                that difference forever.
              </span>
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
