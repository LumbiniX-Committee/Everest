import type { Metadata } from 'next';
import Link from 'next/link';
import { Cpu, Database, FileText, Map as MapIcon, WifiOff } from 'lucide-react';

import { Callout, Ledger, PageHero, Prose, Section } from '@/components/ui';
import { REPO_URL, REPORTS } from '@/lib/site';

export const metadata: Metadata = {
  title: 'Sākṣī — Technology',
  description:
    'React Native and Expo on the phone, an append-only SQLite ledger, Postgres with PostGIS and pgvector in the cloud, and two AI models that propose rather than decide. The full engineering report is a four-page PDF.',
};

const layers = [
  {
    Icon: WifiOff,
    name: 'The record, on the device',
    stack: 'expo-sqlite (WAL) · versioned migrations',
    body: 'A real SQL database on the phone, written as an append-only ledger. Observations, condition reports and corrections are all inserts; a mistake is fixed by a row that supersedes another, never by overwriting it. This is what makes the offline guarantee structural rather than a promise.',
  },
  {
    Icon: Database,
    name: 'The record, in the cloud',
    stack: 'Postgres · PostGIS · pgvector · row-level security',
    body: 'One database, three extensions. PostGIS makes "what within 500 m has gone longest without a resurvey" an index rather than a loop, and makes the GeoJSON export a real GIS artefact. pgvector holds the knowledge corpus. Authorisation lives in the database, so the phone, the dashboard and any future integration share one rule set.',
  },
  {
    Icon: Cpu,
    name: 'Vision, on the phone',
    stack: 'ONNX Runtime with XNNPACK · a YOLO-family segmentation model',
    body: 'The damage detector runs on the handset, because the network is not there at the moment it is needed and because a photograph of a monument should not have to leave the country to be looked at. It proposes candidates as dashed outlines. A person confirms severity, and the report records that the AI assisted.',
  },
  {
    Icon: FileText,
    name: 'Answers that can be checked',
    stack: 'retrieval → synthesis → verification, with a refusal path',
    body: 'The Dhamma engine retrieves passages from a fixed corpus — the Pali canon alongside the ICOMOS Venice and Burra Charters, UNESCO World Heritage records and named Kathmandu Valley archaeology — writes only from those passages, and checks that every claim resolves to one. When it cannot, it refuses. Source text and citations are never machine-translated.',
  },
  {
    Icon: MapIcon,
    name: 'Maps that work without a signal',
    stack: 'MapLibre GL Native · vector tiles served from object storage',
    body: 'An open renderer over an open basemap, so a regional extract can be downloaded before a visit and used with no connection at all — and so the map bill does not grow with the number of people we most want using it.',
  },
];

export default function TechnologyPage() {
  return (
    <main>
      <PageHero
        eyebrow="Technology"
        title="Built to still be readable in twenty years"
        lede="A conservation record is only worth making if it outlives the software that made it. That single requirement decides most of what follows: open formats, one database, records written locally first, and AI that is never allowed the last word."
      >
        <Link
          href={REPORTS.techStack.href}
          className="mt-9 inline-flex items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-4 font-semibold text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <FileText className="size-5 text-sakshi" aria-hidden />
          Read the full engineering report
          <span className="text-sm font-normal text-ink-muted">
            PDF · {REPORTS.techStack.pages} pages
          </span>
        </Link>
      </PageHero>

      <Section kicker="The stack" title="What each layer is, and why it is there">
        <div className="mt-8 space-y-4">
          {layers.map(({ Icon, name, stack, body }) => (
            <article
              key={name}
              className="flex gap-5 rounded-3xl border border-line bg-surface p-7 shadow-sm"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sakshi/10 text-sakshi">
                <Icon className="size-5" aria-hidden />
              </span>
              <div>
                <h3 className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">
                  {name}
                </h3>
                <p className="mt-1 font-mono text-sm text-ink-muted">{stack}</p>
                <p className="mt-3 leading-relaxed text-ink-soft">{body}</p>
              </div>
            </article>
          ))}
        </div>

        <Callout title="On the phone itself" Icon={Cpu}>
          The app is React Native on Expo, with file-based routing, and the New
          Architecture enabled — which the vision module requires. One codebase
          covers Android and iOS while still reaching the camera, GPS, compass
          and two AI runtimes through native modules.
        </Callout>
      </Section>

      <Section
        tone="deep"
        kicker="The rules"
        title="Five constraints the code actually enforces"
      >
        <Prose>
          <p>
            These are not aspirations in a document. Several of them are checked
            automatically, and the build fails when one is broken.
          </p>
        </Prose>

        <Ledger
          headings={['The rule', 'What it costs, and why we pay it']}
          rows={[
            {
              left: 'A measurement is never faked.',
              right:
                'An unknown reading is stored as unknown, never as zero. Some records are therefore less complete than they could appear to be — which is the point.',
            },
            {
              left: '"By eye" is never dressed up as "measured".',
              right:
                'A shot framed without a sensor lock is marked, and looks different. Fewer records read as authoritative, and the ones that do can be trusted.',
            },
            {
              left: 'The AI suggests; it never decides.',
              right:
                'The detector cannot set severity and the answer engine refuses rather than guesses. The product is slower and says "I do not know" more often than a competitor would.',
            },
            {
              left: 'Nothing is deleted.',
              right:
                'Corrections are added, not applied over the top. Storage grows and the history is heavier to read — and it stays auditable.',
            },
            {
              left: 'The device is the source of truth.',
              right:
                'Every write lands locally first. Synchronisation is harder to build than a straight API call, and the app keeps working where there is no signal at all.',
            },
          ]}
        />

        <Prose>
          <p className="mt-8">
            A sixth rule has no technical cost and is enforced by a linter
            anyway: <strong>no gamification vocabulary</strong>. Streaks, XP,
            levels, badges and points reward volume, and volume is the wrong
            incentive for evidence. Merit here is <em>puṇya</em> — unscored,
            unspendable, and untransferable.
          </p>
        </Prose>
      </Section>

      <Section kicker="Openness" title="Everything here has an exit">
        <Prose>
          <p>
            Each managed service in the stack is chosen so that leaving it is a
            migration rather than a rewrite. Postgres is Postgres. Object storage
            is a byte copy. SQLite and the map archive are files. MapLibre and
            the inference runtime are open source, and{' '}
            <a href={REPO_URL}>the whole codebase is public</a>.
          </p>
          <p>
            That matters more here than in most products. An institution being
            asked to build a decade of monitoring record on a piece of software
            is entitled to know what happens to that record if the people who
            wrote the software move on.
          </p>
        </Prose>
      </Section>
    </main>
  );
}
