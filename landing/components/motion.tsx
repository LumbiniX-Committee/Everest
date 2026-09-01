'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

/**
 * Two small pieces of motion, both built on one rule: the finished state is
 * what the markup renders, and script only ever takes something away and gives
 * it back. Nothing here can leave content permanently invisible or a figure
 * permanently at zero if the observer never fires.
 */

function usesReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Fades a block up as it enters the viewport, once.
 *
 * The hidden state is set in an effect rather than in the initial markup, so a
 * reader without JavaScript — or one whose observer never runs — sees the
 * content rather than an empty page.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || usesReducedMotion()) return;

    el.dataset.reveal = 'hidden';
    el.style.transitionDelay = `${delay}ms`;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.reveal = 'shown';
        io.disconnect();
      },
      /* Deliberately forgiving. A -12% bottom margin looked better and left
         blocks that sit near the end of the document permanently invisible,
         because they never cleared the line before the page ran out of scroll.
         Any part of the element entering the viewport is enough. */
      { rootMargin: '0px 0px -5% 0px', threshold: 0 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Counts a figure up when it first scrolls into view.
 *
 * Units are given as `prefix`, `suffix` and `decimals` rather than as a
 * formatting callback: this renders inside server components, and a function
 * prop cannot cross that boundary. Being plain data also keeps 1.17M, 80% and
 * $624.6B on one component without it guessing at units.
 *
 * The finished value is what the server renders, so a reader whose observer
 * never fires still sees the real figure rather than a zero.
 */
export function CountUp({
  value,
  decimals = 0,
  prefix = '',
  suffix = '',
  duration = 1400,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [shown, setShown] = useState(value);

  useEffect(() => {
    const el = ref.current;
    if (!el || usesReducedMotion()) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();

        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
          const t = Math.min((now - start) / duration, 1);
          // Ease out cubic: fast enough to read as a count, settled before the
          // reader's eye has moved on.
          setShown(value * (1 - Math.pow(1 - t, 3)));
          if (t < 1) frame = requestAnimationFrame(tick);
        };

        frame = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frame);
      },
      { threshold: 0.4 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [value, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {shown.toLocaleString('en', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
}
