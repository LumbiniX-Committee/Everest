const COPY = {
  en: {
    kicker: 'Where the answers come from',
    title: 'Every claim names its source. Every gap is left open.',
    lede: 'Sākṣī is built from records you can check, and it shows which one each fact came from. When a value was never measured, it says “not recorded” rather than inventing one.',
    sourcesTitle: 'What it draws on',
    sources: [
      ['Site histories', 'UNESCO World Heritage records, the 1899 Mukherji survey of Lumbini, Hultzsch’s Inscriptions of Asoka, and other cited scholarship'],
      ['The teaching', 'The Pali Canon, quoted by collection, book and verse'],
      ['Maps and places', 'OpenStreetMap and Wikidata; essentials from Overture Maps'],
      ['Treks', 'Trails from OpenStreetMap, altitudes from the Copernicus elevation model'],
      ['Fees', 'Nepal Tourism Board, with the date each was checked'],
    ],
    promisesTitle: 'Five promises the app keeps',
    promises: [
      'A measurement is never faked. Unmeasured is “not recorded”, never zero.',
      'Framed by eye is never dressed up as measured.',
      'The AI suggests. It never decides.',
      'Nothing you record is ever deleted.',
      'Your phone is the source of truth. It works without a signal.',
    ],
  },
  ne: {
    kicker: 'उत्तर कहाँबाट आउँछन्',
    title: 'हरेक दाबीले आफ्नो स्रोत भन्छ। हरेक खाली ठाउँ खाली नै रहन्छ।',
    lede: 'साक्षी जाँच्न सकिने अभिलेखबाट बनेको छ, र हरेक तथ्य कुन अभिलेखबाट आयो देखाउँछ। कहिल्यै नापिएको छैन भने अङ्क बनाउनुको सट्टा “अभिलेख छैन” भन्छ।',
    sourcesTitle: 'यसका आधार',
    sources: [
      ['सम्पदाको इतिहास', 'युनेस्को विश्व सम्पदा अभिलेख, सन् १८९९ को मुखर्जी सर्वेक्षण, हुल्त्शको अशोकका अभिलेख, र अन्य उद्धृत विद्वत् कार्य'],
      ['धर्म', 'पालि त्रिपिटक, सङ्ग्रह, ग्रन्थ र श्लोकसहित उद्धृत'],
      ['नक्सा र ठाउँ', 'OpenStreetMap र Wikidata; आवश्यक सेवा Overture Maps बाट'],
      ['ट्रेक', 'OpenStreetMap का पदमार्ग, कोपर्निकस उचाइ मोडेलबाट उचाइ'],
      ['शुल्क', 'नेपाल पर्यटन बोर्ड, जाँचिएको मितिसहित'],
    ],
    promisesTitle: 'एपले राख्ने पाँच वाचा',
    promises: [
      'मापन कहिल्यै नक्कली हुँदैन। नापिएको छैन भने “अभिलेख छैन”, शून्य होइन।',
      'आँखाले मिलाएको कुरालाई नापिएको जस्तो देखाइँदैन।',
      'एआईले सुझाव दिन्छ। निर्णय गर्दैन।',
      'तपाईंले अभिलेख गरेको केही पनि मेटिँदैन।',
      'तपाईंको फोन नै सत्यको स्रोत हो। सिग्नलबिना पनि चल्छ।',
    ],
  },
} as const;

/** The sources, named, and the five promises, stated plainly. */
export function Provenance({ locale }: { locale: 'en' | 'ne' }) {
  const c = COPY[locale];
  return (
    <section className="border-y border-line bg-ground-deep" aria-labelledby="provenance">
      <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">{c.kicker}</p>
        <h2 id="provenance" className="mt-3 max-w-3xl font-[family-name:var(--font-display)] text-4xl leading-tight font-semibold text-ink sm:text-5xl">
          {c.title}
        </h2>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">{c.lede}</p>

        <div className="mt-12 grid gap-12 lg:grid-cols-2">
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-ink-muted uppercase">{c.sourcesTitle}</h3>
            <dl className="mt-4 divide-y divide-line border-y border-line">
              {c.sources.map(([term, detail]) => (
                <div key={term} className="grid gap-1 py-4 sm:grid-cols-[10rem_1fr] sm:gap-6">
                  <dt className="font-semibold text-ink">{term}</dt>
                  <dd className="text-ink-soft">{detail}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-widest text-ink-muted uppercase">{c.promisesTitle}</h3>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {c.promises.map((promise, i) => (
                <li key={promise} className="flex gap-5 py-4">
                  <span className="font-[family-name:var(--font-display)] text-2xl font-semibold text-sandstone tabular-nums">{i + 1}</span>
                  <span className="pt-1 text-ink-soft">{promise}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
