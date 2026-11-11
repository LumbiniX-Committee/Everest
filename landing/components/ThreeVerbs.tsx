'use client';

import { useState } from 'react';

import type { ExplorerSite } from '@/lib/generated/explorer';

type Depth = 0 | 1 | 2;

const COPY = {
  en: {
    kicker: 'One place, three verbs',
    title: 'Stand at Maya Devi Temple. Here is what Sākṣī does.',
    guide: {
      verb: 'Guide',
      title: 'Where you are, explained as deeply as you want',
      body: 'Arrive and the place introduces itself. One control sets how much you hear: a glance, the story, or everything with its sources. The choice stays with you from place to place.',
      depth: ['Glance', 'Story', 'Scholar'],
      hint: ['About 30 seconds', 'A few minutes', 'Everything, with sources'],
      sources: 'Sources',
    },
    ask: {
      verb: 'Ask',
      title: 'Answers that show their sources, or say they don’t know',
      body: 'Every sentence that rests on a source carries its number, and the source is one tap away. When nothing supports an answer, it says so instead of guessing.',
      label: 'Example answers, written from the app’s own sources',
      questions: ['When was the Ashokan Pillar raised, and by whom?', 'What did the horse on top of the pillar look like?'],
      agree: 'Sources agree',
      none: 'No source, so no answer',
      noAnswer: 'I don’t have a source that describes it. What the guide does record is that the pillar’s horse capital is lost.',
      pick: 'Tap a number to see its source.',
    },
    report: {
      verb: 'Report',
      title: 'Flag a problem, then watch what happens to it',
      body: 'A photo, a category, a few words. It works offline and sends when you are back in range. Then you follow it: every step is added by the people who look after the site, only when they act.',
      label: 'An example of how a report moves',
      issue: 'Cracked plaster on the outer wall',
      steps: [
        { title: 'Received', when: '2 Nov', note: null },
        { title: 'Acknowledged by the site', when: '4 Nov', note: null },
        { title: 'Being worked on', when: '9 Nov', note: 'Mason booked for repair' },
        { title: 'Resolved', when: null, note: null },
      ],
      honest: 'Nothing moves forward on its own. A report with no action stays “received”.',
    },
  },
  ne: {
    kicker: 'एउटा ठाउँ, तीन काम',
    title: 'मायादेवी मन्दिरमा उभिनुहोस्। साक्षीले यस्तो गर्छ।',
    guide: {
      verb: 'मार्गदर्शन',
      title: 'तपाईं कहाँ हुनुहुन्छ, जति गहिरो चाहनुहुन्छ त्यति',
      body: 'पुग्नुहोस्, ठाउँले आफ्नो परिचय दिन्छ। एउटै नियन्त्रणले कति सुन्ने तय गर्छ: झलक, कथा, वा स्रोतसहित सबै। तपाईंको रोजाइ ठाउँ-ठाउँमा साथै रहन्छ।',
      depth: ['झलक', 'कथा', 'विद्वत्'],
      hint: ['करिब ३० सेकेन्ड', 'केही मिनेट', 'स्रोतसहित सबै'],
      sources: 'स्रोत',
    },
    ask: {
      verb: 'सोध्नुहोस्',
      title: 'स्रोत देखाउने उत्तर, वा थाहा छैन भन्ने इमानदारी',
      body: 'स्रोतमा आधारित हरेक वाक्यमा त्यसको नम्बर हुन्छ, र स्रोत एक थिचाइ टाढा हुन्छ। कुनै स्रोतले नसमर्थन गरे, अनुमान नगरी सोही भन्छ।',
      label: 'एपकै स्रोतबाट लेखिएका उदाहरण उत्तर',
      questions: ['अशोक स्तम्भ कहिले र कसले खडा गरे?', 'स्तम्भको टुप्पोको घोडा कस्तो थियो?'],
      agree: 'स्रोतहरू सहमत छन्',
      none: 'स्रोत छैन, त्यसैले उत्तर छैन',
      noAnswer: 'त्यसको वर्णन गर्ने स्रोत मसँग छैन। मार्गदर्शकले यति मात्र अभिलेख गर्छ कि स्तम्भको घोडाको शिरभाग हराएको छ।',
      pick: 'स्रोत हेर्न नम्बर थिच्नुहोस्।',
    },
    report: {
      verb: 'रिपोर्ट',
      title: 'समस्या जनाउनुहोस्, अनि के हुन्छ हेर्नुहोस्',
      body: 'एउटा तस्बिर, एउटा प्रकार, केही शब्द। अफलाइन पनि चल्छ र सिग्नल आएपछि पठाउँछ। त्यसपछि पछ्याउनुहोस्: हरेक चरण स्थलको हेरचाह गर्नेहरूले काम गरेपछि मात्र थप्छन्।',
      label: 'रिपोर्ट कसरी अघि बढ्छ भन्ने उदाहरण',
      issue: 'बाहिरी पर्खालको प्लास्टर चर्किएको',
      steps: [
        { title: 'प्राप्त भयो', when: '२ नोभेम्बर', note: null },
        { title: 'स्थलले स्वीकार गर्‍यो', when: '४ नोभेम्बर', note: null },
        { title: 'काम भइरहेको छ', when: '९ नोभेम्बर', note: 'मर्मतका लागि डकर्मी तय' },
        { title: 'समाधान भयो', when: null, note: null },
      ],
      honest: 'केही पनि आफैँ अघि बढ्दैन। कुनै कारबाही नभएको रिपोर्ट “प्राप्त” मै रहन्छ।',
    },
  },
} as const;

function Row({ verb, title, body, children, flip }: { verb: string; title: string; body: string; children: React.ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-8 border-t border-line py-14 lg:grid-cols-2 lg:gap-16">
      <div className={flip ? 'lg:order-2' : ''}>
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{verb}</p>
        <h3 className="mt-3 font-[family-name:var(--font-display)] text-3xl leading-tight font-semibold text-ink sm:text-4xl">{title}</h3>
        <p className="mt-4 max-w-xl text-lg leading-relaxed text-ink-soft">{body}</p>
      </div>
      <div className={`rounded-3xl border border-line bg-surface p-6 shadow-sm sm:p-8 ${flip ? 'lg:order-1' : ''}`}>{children}</div>
    </div>
  );
}

/** One real place walked through Guide, Ask and Report. */
export function ThreeVerbs({ maya, pillar, locale }: { maya: ExplorerSite; pillar: ExplorerSite; locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  const [depth, setDepth] = useState<Depth>(0);
  const [question, setQuestion] = useState<0 | 1>(0);
  const [cited, setCited] = useState<number | null>(null);
  const answerSources = [pillar.sources[0], pillar.sources[1]].filter(Boolean);

  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24" aria-labelledby="three-verbs">
      <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{c.kicker}</p>
      <h2 id="three-verbs" className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink sm:text-5xl">
        {c.title}
      </h2>

      <div className="mt-10">
        <Row verb={c.guide.verb} title={c.guide.title} body={c.guide.body}>
          <div role="radiogroup" aria-label={c.guide.verb} className="grid grid-cols-3 gap-1 rounded-xl bg-surface-secondary p-1">
            {c.guide.depth.map((label, i) => (
              <button
                key={label}
                type="button"
                role="radio"
                aria-checked={depth === i}
                onClick={() => setDepth(i as Depth)}
                className={`min-h-12 rounded-lg px-2 text-base transition ${depth === i ? 'border border-line bg-surface font-semibold text-ink shadow-sm' : 'text-ink-muted hover:text-ink'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-center text-sm text-ink-muted">{c.guide.hint[depth]}</p>
          <p className="mt-5 font-[family-name:var(--font-display)] text-2xl font-semibold text-ink">{locale === 'ne' && maya.nameNe ? maya.nameNe : maya.name}</p>
          <p className="mt-2 leading-relaxed text-ink-soft">{depth === 0 ? maya.lede : maya.summary}</p>
          {depth === 2 ? (
            <>
              <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                {maya.facts.map((fact) => (
                  <div key={fact.label}>
                    <dt className="text-ink-muted">{fact.label}</dt>
                    <dd className="font-medium text-ink">{fact.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-5 text-xs font-semibold tracking-widest text-ink-muted uppercase">{c.guide.sources}</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-ink-soft">
                {maya.sources.map((source) => (
                  <li key={source.title}>
                    {source.url ? (
                      <a href={source.url} className="underline decoration-line underline-offset-4 hover:text-ink">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ol>
            </>
          ) : null}
        </Row>

        <Row verb={c.ask.verb} title={c.ask.title} body={c.ask.body} flip>
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">{c.ask.label}</p>
          <div className="mt-3 flex flex-col gap-2">
            {c.ask.questions.map((q, i) => (
              <button
                key={q}
                type="button"
                aria-pressed={question === i}
                onClick={() => {
                  setQuestion(i as 0 | 1);
                  setCited(null);
                }}
                className={`min-h-12 rounded-xl border px-4 py-2 text-left transition ${question === i ? 'border-sandstone bg-surface-secondary font-semibold text-ink' : 'border-line text-ink-soft hover:border-sandstone'}`}
              >
                {q}
              </button>
            ))}
          </div>
          {question === 0 ? (
            <div className="mt-5" aria-live="polite">
              <p className="leading-relaxed text-ink">
                {locale === 'ne'
                  ? 'मौर्य सम्राट अशोकले आफ्नो शासनको बीसौँ वर्ष, ईसापूर्व २४९ मा, बुद्धको जन्मस्थल चिनाउन यो स्तम्भ खडा गरे।'
                  : 'The Mauryan emperor Ashoka raised it in 249 BCE, in the twentieth year of his reign, to mark the Buddha’s birthplace.'}
                <Cite n={1} active={cited === 1} onPick={setCited} />
                <Cite n={2} active={cited === 2} onPick={setCited} />{' '}
                {locale === 'ne' ? 'यसको अभिलेख ब्राह्मी लिपिमा, पालि भाषामा छ।' : 'Its inscription is in Brahmi script, in Pali.'}
                <Cite n={2} active={cited === 2} onPick={setCited} />
              </p>
              <p className="mt-3 inline-flex rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-sandstone-deep">{c.ask.agree}</p>
              <div className="mt-4 rounded-xl border border-line bg-ground p-4 text-sm">
                {cited ? (
                  <p className="text-ink-soft">
                    <span className="font-semibold text-ink">[{cited}]</span>{' '}
                    {answerSources[cited - 1]?.url ? (
                      <a href={answerSources[cited - 1]!.url!} className="underline decoration-line underline-offset-4 hover:text-ink">
                        {answerSources[cited - 1]!.title}
                      </a>
                    ) : (
                      answerSources[cited - 1]?.title
                    )}
                  </p>
                ) : (
                  <p className="text-ink-muted">{c.ask.pick}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5" aria-live="polite">
              <p className="leading-relaxed text-ink">{c.ask.noAnswer}</p>
              <p className="mt-3 inline-flex rounded-full border border-line px-3 py-1 text-xs font-semibold text-ink-muted">{c.ask.none}</p>
            </div>
          )}
        </Row>

        <Row verb={c.report.verb} title={c.report.title} body={c.report.body}>
          <p className="text-xs font-semibold tracking-widest text-ink-muted uppercase">{c.report.label}</p>
          <p className="mt-2 font-semibold text-ink">{c.report.issue}</p>
          <ol className="mt-5">
            {c.report.steps.map((step, i) => {
              const done = step.when != null;
              const current = done && c.report.steps[i + 1]?.when == null;
              return (
                <li key={step.title} className="flex gap-4">
                  <div className="flex w-3 flex-col items-center">
                    <span className={`mt-1.5 size-3 rounded-full border-2 ${done ? 'border-sandstone bg-sandstone' : 'border-line bg-surface'} ${current ? 'ring-4 ring-marigold/40' : ''}`} />
                    {i < c.report.steps.length - 1 ? <span className={`w-0.5 flex-1 ${c.report.steps[i + 1].when ? 'bg-sandstone' : 'bg-line'}`} /> : null}
                  </div>
                  <div className="pb-5">
                    <p className={done ? (current ? 'font-semibold text-ink' : 'text-ink') : 'text-ink-muted'}>{step.title}</p>
                    {step.when ? <p className="text-sm text-ink-muted">{step.when}</p> : null}
                    {step.note ? <p className="text-sm text-ink-soft">“{step.note}”</p> : null}
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="border-t border-line pt-4 text-sm text-ink-muted">{c.report.honest}</p>
        </Row>
      </div>
    </section>
  );
}

function Cite({ n, active, onPick }: { n: number; active: boolean; onPick: (n: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onPick(n)}
      aria-label={`Source ${n}`}
      className={`ml-0.5 inline-flex size-6 -translate-y-1.5 items-center justify-center rounded-md text-xs font-semibold align-baseline transition ${active ? 'bg-sandstone text-surface' : 'bg-surface-secondary text-sandstone-deep hover:bg-sandstone hover:text-surface'}`}
    >
      {n}
    </button>
  );
}
