/**
 * The figure that greets the page, palms joined in añjali mudra.
 *
 * This is the *site's* welcome, and deliberately not the app's. Inside Sākṣī
 * the reticle is the only emblem — `components/reticle/Reticle.tsx` and
 * `features/onboarding/WelcomeScreen.tsx` both say "no Buddha, no temple, no
 * lotus", and the Dhamma engine refuses questions that ask it to speak as the
 * Buddha. A figure carrying that iconography belongs on the page that invites
 * people in, not on a surface that records evidence or cites the canon.
 *
 * A plain `<img>` rather than `next/image`: the source is an animated WebP, and
 * the image optimiser's job is to re-encode stills. Nothing here needs
 * optimising that the build step has not already done — see
 * `tools/build-greeting-monk.py` for how the asset is made, including why it
 * ping-pongs rather than loops.
 *
 * `<picture>` handles reduced motion without JavaScript. Anyone who has asked
 * their system to stop animation gets a single frame, chosen from the middle of
 * the sway so the still does not look like a figure caught mid-lean. An
 * animated WebP cannot be paused from CSS, so swapping the source is the only
 * honest way to honour that preference.
 */
export function GreetingMonk({ className = '' }: { className?: string }) {
  return (
    <div className={`relative flex justify-center ${className}`}>
      {/*
        Without a shadow the figure hangs in the middle of the cream. The
        ellipse is wide and very soft — it reads as ground, not as a drop
        shadow attached to a card.
      */}
      <span
        aria-hidden
        className="absolute bottom-1 left-1/2 h-4 w-[62%] -translate-x-1/2 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(138,90,69,0.28),transparent_72%)]"
      />

      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/greeting-monk-still.webp" />
        <img
          src="/greeting-monk.webp"
          alt="A young monk standing with palms joined in greeting"
          width={316}
          height={560}
          decoding="async"
          // 419 KB, and never the largest thing painted — the wordmark is. Low
          // priority keeps it behind the markup and the download button rather
          // than in front of them on a slow connection, which is the order a
          // visitor here actually needs.
          fetchPriority="low"
          className="relative h-full w-auto select-none"
          draggable={false}
        />
      </picture>
    </div>
  );
}
