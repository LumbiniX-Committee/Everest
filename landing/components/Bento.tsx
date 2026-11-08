import { BedDouble, Compass, Flag, MessageCircleQuestion, Mountain, WifiOff } from 'lucide-react';

/*
 * Trek figures are the measured totals from the app's trek build
 * (data/generated/treks.ts, see docs/WORK_LOG.md). Update them together.
 */
const COPY = {
  en: {
    kicker: 'Everything a visit needs',
    title: 'One app, from the gate to the summit.',
    titleMuted: 'Nothing you have to trust blindly.',
    guide: { t: 'Guide', h: 'Where you are, explained', b: 'Arrive and the place introduces itself, from a 30-second glance to the full scholarly record.', depth: ['Glance', 'Story', 'Scholar'] },
    ask: { t: 'Ask', h: 'Answers with sources', b: 'Each claim is numbered to the record it rests on, or the answer says it doesn’t know.', sample: 'Raised in 249 BCE' },
    report: { t: 'Report', h: 'Flag it, follow it', b: 'A photo and a few words, then every step the site takes, dated.', steps: ['Received', 'Acknowledged', 'Resolved'] },
    treks: { t: 'Treks', h: 'Three treks, day by day', b: 'Distance, climb, walking time and where you sleep, with a warning on days that climb too fast.', list: [['Poon Hill', '5 days', '48 km'], ['Langtang Valley', '6 days', '67 km'], ['Everest Base Camp', '11 days', '112 km']] },
    offline: { t: 'Offline', h: 'Maps that work with no signal', b: 'Save a city or a trek. Map, terrain and names still draw in flight mode.' },
    essentials: { t: 'Essentials', h: '1,086 places to stay, eat, get help', b: 'Hotels, teahouses, hospitals, banks, each with a number to call ahead.' },
  },
  ne: {
    kicker: 'भ्रमणलाई चाहिने सबै',
    title: 'ढोकादेखि शिखरसम्म, एउटै एप।',
    titleMuted: 'आँखा चिम्लेर पत्याउनुपर्ने केही छैन।',
    guide: { t: 'मार्गदर्शन', h: 'तपाईं कहाँ हुनुहुन्छ, व्याख्यासहित', b: 'पुग्नुहोस्, ठाउँले आफ्नो परिचय दिन्छ, ३० सेकेन्डको झलकदेखि पूरा विद्वत् अभिलेखसम्म।', depth: ['झलक', 'कथा', 'विद्वत्'] },
    ask: { t: 'सोध्नुहोस्', h: 'स्रोतसहितका उत्तर', b: 'हरेक दाबी आफ्नो अभिलेखसँग नम्बरले जोडिन्छ, नभए उत्तरले थाहा छैन भन्छ।', sample: 'ईसापूर्व २४९ मा खडा' },
    report: { t: 'रिपोर्ट', h: 'जनाउनुहोस्, पछ्याउनुहोस्', b: 'एउटा तस्बिर र केही शब्द, अनि स्थलले चालेको हरेक कदम, मितिसहित।', steps: ['प्राप्त', 'स्वीकार', 'समाधान'] },
    treks: { t: 'ट्रेक', h: 'तीन ट्रेक, दिनदिनै', b: 'दूरी, उकालो, हिँडाइको समय र बास, धेरै छिटो उक्लिने दिनको चेतावनीसहित।', list: [['पुनहिल', '५ दिन', '४८ किमी'], ['लाङटाङ उपत्यका', '६ दिन', '६७ किमी'], ['सगरमाथा आधार शिविर', '११ दिन', '११२ किमी']] },
    offline: { t: 'अफलाइन', h: 'सिग्नलबिना चल्ने नक्सा', b: 'सहर वा ट्रेक सुरक्षित गर्नुहोस्। फ्लाइट मोडमा पनि नक्सा, भू-आकृति र नाम देखिन्छन्।' },
    essentials: { t: 'आवश्यक सेवा', h: '१,०८६ बस्ने, खाने, सहायता पाउने ठाउँ', b: 'होटल, चिया-घर, अस्पताल, बैंक, पहिले फोन गर्ने नम्बरसहित।' },
  },
};

function Kicker({ icon: Icon, dark }: { icon: typeof Compass; children?: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex size-11 items-center justify-center rounded-2xl ${dark ? 'bg-ground/10 text-marigold' : 'bg-surface-secondary text-sandstone-deep'}`} aria-hidden>
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

/** The features as an uneven grid: one dark anchor, lighter cards around it. */
export function Bento({ locale }: { locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  const card = 'relative overflow-hidden rounded-[2rem] border border-line bg-surface p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl sm:p-8';
  return (
    <section className="paper relative overflow-hidden border-y border-line bg-ground-deep" aria-labelledby="bento">
      <div className="watermark" aria-hidden>साक्षी</div>
      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
        <p className="text-center text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{c.kicker}</p>
        <h2 id="bento" className="mx-auto mt-4 max-w-3xl text-center font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink sm:text-6xl">
          {c.title} <span className="text-ink-muted">{c.titleMuted}</span>
        </h2>

        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {/* Guide: the dark anchor */}
          <article className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-ink via-ink to-sandstone-deep p-8 text-ground shadow-xl transition duration-300 hover:-translate-y-1 sm:p-10 lg:col-span-2">
            <Kicker icon={Compass} dark>{c.guide.t}</Kicker>
            <h3 className="mt-6 font-[family-name:var(--font-display)] text-3xl font-semibold sm:text-4xl">{c.guide.h}</h3>
            <p className="mt-3 max-w-lg text-lg leading-relaxed text-ground/75">{c.guide.b}</p>
            <div className="mt-8 inline-grid grid-cols-3 gap-1 rounded-2xl bg-ground/10 p-1 text-sm">
              {c.guide.depth.map((label, i) => (
                <span key={label} className={i === 1 ? 'rounded-xl bg-ground px-5 py-2 font-semibold text-ink' : 'px-5 py-2 text-ground/70'}>
                  {label}
                </span>
              ))}
            </div>
            <span aria-hidden className="pointer-events-none absolute -right-16 -bottom-24 size-72 rounded-full bg-marigold/20 blur-3xl" />
          </article>

          {/* Ask */}
          <article className={card}>
            <Kicker icon={MessageCircleQuestion}>{c.ask.t}</Kicker>
            <h3 className="mt-6 text-xl font-semibold text-ink">{c.ask.h}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{c.ask.b}</p>
            <p className="mt-6 inline-flex items-center gap-1 rounded-xl bg-ground px-3 py-2 text-sm font-medium text-ink">
              {c.ask.sample}
              <span className="ml-1 rounded-md bg-sandstone px-1.5 text-xs font-semibold text-surface">1</span>
              <span className="rounded-md bg-sandstone px-1.5 text-xs font-semibold text-surface">2</span>
            </p>
          </article>

          {/* Report */}
          <article className={card}>
            <Kicker icon={Flag}>{c.report.t}</Kicker>
            <h3 className="mt-6 text-xl font-semibold text-ink">{c.report.h}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{c.report.b}</p>
            <ol className="mt-6 flex items-center gap-2 text-xs font-semibold">
              {c.report.steps.map((step, i) => (
                <li key={step} className="flex items-center gap-2">
                  <span className={`size-2.5 rounded-full ${i < 2 ? 'bg-sandstone' : 'border-2 border-line bg-surface'}`} />
                  <span className={i < 2 ? 'text-ink' : 'text-ink-muted'}>{step}</span>
                  {i < c.report.steps.length - 1 ? <span className="h-px w-4 bg-line" /> : null}
                </li>
              ))}
            </ol>
          </article>

          {/* Treks: wide, jade-tinted */}
          <article className={`${card} bg-gradient-to-br from-surface to-surface-secondary lg:col-span-2`}>
            <Kicker icon={Mountain}>{c.treks.t}</Kicker>
            <h3 className="mt-6 text-xl font-semibold text-ink">{c.treks.h}</h3>
            <p className="mt-2 max-w-xl leading-relaxed text-ink-soft">{c.treks.b}</p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-3">
              {c.treks.list.map(([name, days, km]) => (
                <li key={name} className="rounded-2xl border border-line bg-surface/80 p-4">
                  <p className="font-semibold text-ink">{name}</p>
                  <p className="mt-1 text-sm text-ink-muted tabular-nums">
                    {days} · {km}
                  </p>
                </li>
              ))}
            </ul>
          </article>

          {/* Offline */}
          <article className={card}>
            <Kicker icon={WifiOff}>{c.offline.t}</Kicker>
            <h3 className="mt-6 text-xl font-semibold text-ink">{c.offline.h}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">{c.offline.b}</p>
          </article>

          {/* Essentials */}
          <article className={`${card} lg:col-span-2`}>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Kicker icon={BedDouble}>{c.essentials.t}</Kicker>
                <h3 className="mt-6 text-xl font-semibold text-ink">{c.essentials.h}</h3>
                <p className="mt-2 max-w-md leading-relaxed text-ink-soft">{c.essentials.b}</p>
              </div>
              <p className="font-[family-name:var(--font-display)] text-7xl font-semibold text-sandstone/20 tabular-nums" aria-hidden>
                1,086
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
