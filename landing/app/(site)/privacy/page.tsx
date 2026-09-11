import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Download, Eye, MapPin } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sākṣī — Privacy',
  description:
    'What Sākṣī collects, why, who can see it, how long it is kept, and how to get a copy of your records or have your device forgotten.',
};

const commitments = [
  {
    Icon: MapPin,
    title: 'Your own position, nothing more',
    body: 'A capture records the photograph, the observer\'s own GPS position and heading at that moment, and an optional note. That coordinate is always where the person stood, never a location typed in — there is no manual-coordinate entry anywhere in the app. No name, email or phone number is collected from a visitor; every write is attributed to a random device id and an anonymous account, neither of which identifies a person.',
  },
  {
    Icon: Eye,
    title: 'Who can see it',
    body: "A site's invite-only custodian accounts can see full reports and photographs for that site only, enforced at the database level. The public condition page shows only an aggregate view — category, severity, coverage, action dates — and excludes identities, exact coordinates, raw report ids, photographs and notes. Nothing is sold, licensed to advertisers, or repackaged as marketing imagery.",
  },
  {
    Icon: Clock,
    title: 'Kept as long as it serves the record',
    body: 'An observation already shared into a site\'s conservation record is kept indefinitely, the way an archive keeps a catalogued record rather than expiring it — the whole point of the app is a photographic baseline compared years later. What is not permanent is the link between a device and its contributions: that can be severed at any time, after which nothing recorded goes on to look like it came from the same place.',
  },
  {
    Icon: Download,
    title: 'Get a copy, or start fresh',
    body: 'In the app: Settings → Privacy. Export downloads everything the device is holding, synced or not, as a file. Delete wipes the device\'s own copy of every personal record, removes its photographs, and gives the device a new, unlinked identity. It cannot remove a report already shared into a site\'s record — that record does not erase evidence, the same reason a mistaken observation is corrected by a later one rather than deleted.',
  },
];

export default function PrivacyPage() {
  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          Privacy
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          What we collect, and why
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          Sākṣī records where a visitor stood at places of worship and
          historical significance, which supports inferences about religious
          belief. That deserves to be stated plainly, not left to a generic
          privacy notice. This is a product position, not legal advice — see
          the full detail and its limits in{' '}
          <a
            href="https://github.com/LumbiniX-Committee/Everest/blob/main/docs/PRIVACY.md"
            className="font-semibold text-earth underline underline-offset-4"
          >
            PRIVACY.md
          </a>
          .
        </p>

        <div className="mt-14 space-y-6">
          {commitments.map(({ Icon, title, body }) => (
            <article
              key={title}
              className="flex gap-5 rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-semibold text-ink">{title}</h2>
                <p className="mt-2 leading-relaxed text-ink-soft">{body}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-ink-muted">
          Capture is an explicit, in-the-moment action, and that action is the
          consent it rests on. Because what is retained is not tied to an
          identified person, the stricter obligations that attach to
          identifiable personal data are reduced under most readings of
          applicable law — a position that has not been confirmed by counsel
          and should not be treated as settled by an institution with its own
          data-protection obligations.
        </p>

        <p className="mt-8 text-sm">
          <Link
            href="/ethics"
            className="font-semibold text-earth underline underline-offset-4"
          >
            What Sākṣī will not do with what it collects →
          </Link>
        </p>
      </section>
    </main>
  );
}
