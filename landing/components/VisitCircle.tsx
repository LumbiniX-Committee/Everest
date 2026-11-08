import { Camera, Compass, Flag, MessageCircleQuestion } from 'lucide-react';

const COPY = {
  en: {
    kicker: 'Every visit, a full circle',
    title: 'You learn from the place.',
    titleAccent: 'The place learns from you.',
    centre: 'Your visit',
    steps: [
      { icon: Compass, title: 'Arrive', body: 'The place introduces itself, at the depth you chose.' },
      { icon: MessageCircleQuestion, title: 'Ask', body: 'A question, answered from sources, or an honest “not known”.' },
      { icon: Camera, title: 'Witness', body: 'A photo from the marked viewpoint joins the record of how it changes.' },
      { icon: Flag, title: 'Report', body: 'Flag what is wrong, and follow it until the site resolves it.' },
    ],
  },
  ne: {
    kicker: 'हरेक भ्रमण, पूरा चक्र',
    title: 'तपाईं ठाउँबाट सिक्नुहुन्छ।',
    titleAccent: 'ठाउँ तपाईंबाट सिक्छ।',
    centre: 'तपाईंको भ्रमण',
    steps: [
      { icon: Compass, title: 'पुग्नुहोस्', body: 'ठाउँले तपाईंले रोजेको गहिराइमा आफ्नो परिचय दिन्छ।' },
      { icon: MessageCircleQuestion, title: 'सोध्नुहोस्', body: 'स्रोतबाट उत्तर, वा इमानदार “थाहा छैन”।' },
      { icon: Camera, title: 'साक्षी बन्नुहोस्', body: 'चिनो लगाइएको दृश्य-बिन्दुबाट तस्बिर, ठाउँको परिवर्तनको अभिलेखमा।' },
      { icon: Flag, title: 'रिपोर्ट', body: 'गलत कुरा जनाउनुहोस्, र समाधान नभएसम्म पछ्याउनुहोस्।' },
    ],
  },
};

/* Positions on the ring: top, right, bottom, left. */
const SPOTS = [
  'lg:left-1/2 lg:top-0 lg:-translate-x-1/2 lg:-translate-y-1/2',
  'lg:right-0 lg:top-1/2 lg:translate-x-1/3 lg:-translate-y-1/2',
  'lg:left-1/2 lg:bottom-0 lg:-translate-x-1/2 lg:translate-y-1/2',
  'lg:left-0 lg:top-1/2 lg:-translate-x-1/3 lg:-translate-y-1/2',
];

/** Arrive, ask, witness, report: the loop the app is built around, drawn as one. */
export function VisitCircle({ locale }: { locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  return (
    <section className="relative overflow-hidden" aria-labelledby="visit-circle">
      <div className="mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-center text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{c.kicker}</p>
        <h2 id="visit-circle" className="mx-auto mt-4 max-w-3xl text-center font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink sm:text-6xl">
          {c.title} <em className="text-sandstone">{c.titleAccent}</em>
        </h2>

        <div className="relative mx-auto mt-16 max-w-xl lg:mt-36 lg:mb-20 lg:aspect-square">
          {/* The ring and its travelling dot, only where there is room to draw it. */}
          <div aria-hidden className="absolute inset-[12%] hidden rounded-full border-2 border-dashed border-line lg:block" />
          <div aria-hidden className="orbit-spin absolute inset-[12%] hidden lg:block">
            <span className="absolute top-0 left-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-marigold shadow-[0_0_0_6px_rgb(247_168_35_/_0.2)]" />
          </div>
          <div aria-hidden className="pulse-ring absolute top-1/2 left-1/2 hidden size-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line bg-surface text-center shadow-xl lg:flex">
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">Sākṣī</span>
            <span className="mt-1 text-xs font-semibold tracking-widest text-sandstone-deep uppercase">{c.centre}</span>
          </div>

          <ol className="grid gap-4 sm:grid-cols-2 lg:block">
            {c.steps.map(({ icon: Icon, title, body }, i) => (
              <li
                key={title}
                className={`relative rounded-3xl border border-line bg-surface p-6 shadow-lg transition duration-300 hover:-translate-y-1 hover:shadow-xl lg:absolute lg:w-56 ${SPOTS[i]}`}
              >
                <span className="absolute -top-3 -right-3 flex size-8 items-center justify-center rounded-full bg-marigold text-sm font-bold text-on-marigold tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="inline-flex size-10 items-center justify-center rounded-xl bg-surface-secondary text-sandstone-deep">
                  <Icon className="size-5" aria-hidden />
                </span>
                <p className="mt-3 font-semibold text-ink">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
