import type { Metadata } from 'next';
import Link from 'next/link';
import { Clock, Download, Eye, MapPin } from 'lucide-react';

import { localeHref, type Locale } from '@/lib/i18n';

const ICONS = {
  position: MapPin,
  visibility: Eye,
  retention: Clock,
  control: Download,
} as const;

const EN = {
  metaTitle: 'Privacy',
  metaDescription:
    'What Sākṣī collects, why, who can see it, how long it is kept, and how to get a copy of your records or have your device forgotten.',
  kicker: 'Privacy',
  title: 'What we collect, and why',
  intro: {
    before:
      'Sākṣī records where a visitor stood at places of worship and historical significance, which supports inferences about religious belief. That deserves to be stated plainly, not left to a generic privacy notice. This is a product position, not legal advice. See the full detail and its limits in',
    linkLabel: 'PRIVACY.md',
    after: '.',
  },
  commitments: {
    position: {
      title: 'Your own position, nothing more',
      body: "A capture records the photograph, the observer's own GPS position and heading at that moment, and an optional note. That coordinate is always where the person stood, never a location typed in: there is no manual-coordinate entry anywhere in the app. No name, email or phone number is collected from a visitor; every write is attributed to a random device id and an anonymous account, neither of which identifies a person.",
    },
    visibility: {
      title: 'Who can see it',
      body: "A site's invite-only custodian accounts can see full reports and photographs for that site only, enforced at the database level. The public condition page shows only an aggregate view: category, severity, coverage, action dates, and excludes identities, exact coordinates, raw report ids, photographs and notes. Nothing is sold, licensed to advertisers, or repackaged as marketing imagery.",
    },
    retention: {
      title: 'Kept as long as it serves the record',
      body: "An observation already shared into a site's conservation record is kept indefinitely, the way an archive keeps a catalogued record rather than expiring it. The whole point of the app is a photographic baseline compared years later. What is not permanent is the link between a device and its contributions: that can be severed at any time, after which nothing recorded goes on to look like it came from the same place.",
    },
    control: {
      title: 'Get a copy, or start fresh',
      body: "In the app: Settings → Privacy. Export downloads everything the device is holding, synced or not, as a file. Delete wipes the device's own copy of every personal record, removes its photographs, and gives the device a new, unlinked identity. It cannot remove a report already shared into a site's record: that record does not erase evidence, the same reason a mistaken observation is corrected by a later one rather than deleted.",
    },
  },
  footnote:
    'Capture is an explicit, in-the-moment action, and that action is the consent it rests on. Because what is retained is not tied to an identified person, the stricter obligations that attach to identifiable personal data are reduced under most readings of applicable law. This is a position that has not been confirmed by counsel and should not be treated as settled by an institution with its own data-protection obligations.',
  linkText: 'What Sākṣī will not do with what it collects →',
};

const NE: typeof EN = {
  metaTitle: 'गोपनीयता',
  metaDescription:
    'साक्षीले के सङ्कलन गर्छ, किन, यसलाई कसले देख्न सक्छ, कति समय राखिन्छ, र तपाईंको अभिलेखको प्रतिलिपि कसरी लिने वा तपाईंको डिभाइस कसरी बिर्साउने।',
  kicker: 'गोपनीयता',
  title: 'हामी के सङ्कलन गर्छौं, र किन',
  intro: {
    before:
      'साक्षीले आगन्तुक पूजा स्थल र ऐतिहासिक महत्त्वका ठाउँहरूमा कहाँ उभिए भन्ने दर्ता गर्छ, जसले धार्मिक विश्वासका बारेमा अनुमान लगाउन सघाउँछ। यो कुरा सामान्य गोपनीयता सूचनामा भन्दा स्पष्ट रूपमा भनिनुपर्छ। यो एउटा उत्पादन धारणा हो, कानुनी सल्लाह होइन। पूरा विवरण र यसका सीमाहरू',
    linkLabel: 'PRIVACY.md',
    after: ' मा हेर्नुहोस्।',
  },
  commitments: {
    position: {
      title: 'तपाईंको आफ्नै स्थान, अरू केही होइन',
      body: 'एउटा कैद (क्याप्चर) ले तस्बिर, त्यही क्षणमा अवलोकनकर्ताको आफ्नै GPS स्थान र दिशा, र वैकल्पिक टिप्पणी दर्ता गर्छ। त्यो निर्देशांक सधैं व्यक्ति उभिएको ठाउँ हो, टाइप गरिएको स्थान कहिल्यै होइन: एपमा कहीं पनि म्यानुअल-निर्देशांक प्रविष्टि छैन। आगन्तुकबाट नाम, इमेल वा फोन नम्बर सङ्कलन गरिँदैन; हरेक लेखाइ अनियमित डिभाइस आईडी र एक अज्ञात खातामा दर्ता हुन्छ, जसमध्ये कसैले पनि कुनै व्यक्तिको पहिचान गर्दैन।',
    },
    visibility: {
      title: 'यसलाई कसले देख्न सक्छ',
      body: 'कुनै ठाउँको आमन्त्रण-मात्र संरक्षक खाताहरूले त्यही ठाउँका पूरा प्रतिवेदन र तस्बिरहरू मात्र देख्न सक्छन्, जुन डाटाबेस तहमै लागू गरिएको छ। सार्वजनिक अवस्था पृष्ठले केवल सामूहिक दृश्य देखाउँछ: वर्ग, गम्भीरता, कभरेज, कारबाही मितिहरू, र पहिचान, ठ्याक्कै निर्देशांक, कच्चा प्रतिवेदन आईडी, तस्बिर र टिप्पणीहरू बहिष्कार गर्छ। केही पनि बेचिँदैन, विज्ञापनदातालाई लाइसेन्स दिइँदैन, वा मार्केटिङ छविको रूपमा पुनः प्रयोग गरिँदैन।',
    },
    retention: {
      title: 'जबसम्म यसले अभिलेखलाई सेवा गर्छ, त्यबसम्म राखिन्छ',
      body: 'कुनै ठाउँको संरक्षण अभिलेखमा पहिले नै साझा गरिएको अवलोकन अनिश्चित कालसम्म राखिन्छ, जसरी एउटा अभिलेखालयले सूचीकृत अभिलेख म्याद नसकाई राख्छ। एपको सम्पूर्ण उद्देश्य नै वर्षौंपछि तुलना गरिने तस्बिर आधाररेखा हो। स्थायी नरहने कुरा डिभाइस र त्यसको योगदानबीचको सम्बन्ध हो: त्यसलाई जुनसुकै बेला काट्न सकिन्छ, जसपछि दर्ता भइसकेको कुनै पनि कुरा सोही ठाउँबाट आएको जस्तो देखिँदैन।',
    },
    control: {
      title: 'प्रतिलिपि लिनुहोस्, वा नयाँबाट सुरु गर्नुहोस्',
      body: 'एपभित्र: सेटिङ्स → गोपनीयता। निर्यातले डिभाइसले राखेको सबै कुरा, सिंक भए वा नभए पनि, एउटा फाइलको रूपमा डाउनलोड गर्छ। मेटाउनुले डिभाइसको आफ्नै प्रत्येक व्यक्तिगत अभिलेखको प्रतिलिपि मेटाउँछ, यसका तस्बिरहरू हटाउँछ, र डिभाइसलाई नयाँ, नजोडिएको पहिचान दिन्छ। यसले कुनै ठाउँको अभिलेखमा पहिले नै साझा गरिएको प्रतिवेदन हटाउन सक्दैन: त्यो अभिलेखले प्रमाण मेटाउँदैन, ठीक जसरी गल्ती भएको अवलोकन मेटाइनुको सट्टा पछिको अर्कोले सच्याइन्छ।',
    },
  },
  footnote:
    'कैद (क्याप्चर) एउटा स्पष्ट, त्यही-क्षणको कार्य हो, र त्यही कार्य नै यसको आधारभूत सहमति हो। जे राखिन्छ त्यो पहिचान भएको व्यक्तिसँग नजोडिएकाले, पहिचान गर्न सकिने व्यक्तिगत डाटामा लाग्ने कडा दायित्वहरू लागू कानुनका धेरैजसो व्याख्याअन्तर्गत घटेका हुन्छन्। यो धारणा वकिलद्वारा पुष्टि गरिएको छैन र आफ्नै डाटा-सुरक्षा दायित्व भएको संस्थाले यसलाई टुङ्गिएको मान्नु हुँदैन।',
  linkText: 'साक्षीले सङ्कलन गरेको कुराबाट के गर्दैन →',
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;
  return {
    title: `Sākṣī: ${c.metaTitle}`,
    description: c.metaDescription,
    alternates: { languages: { en: '/en/privacy', ne: '/ne/privacy' } },
  };
}

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;

  return (
    <main>
      <section className="mx-auto max-w-3xl px-6 pt-16 pb-24 sm:pt-24">
        <p className="text-sm font-semibold tracking-widest text-sandstone-deep uppercase">
          {c.kicker}
        </p>

        <h1 className="mt-5 font-[family-name:var(--font-display)] text-5xl font-semibold tracking-tight text-ink sm:text-6xl">
          {c.title}
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
          {c.intro.before}{' '}
          <a
            href="https://github.com/LumbiniX-Committee/Everest/blob/main/docs/PRIVACY.md"
            className="font-semibold text-earth underline underline-offset-4"
          >
            {c.intro.linkLabel}
          </a>
          {c.intro.after}
        </p>

        <div className="mt-14 space-y-6">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            const { title, body } = c.commitments[id];
            return (
              <article
                key={id}
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
            );
          })}
        </div>

        <p className="mt-14 text-sm leading-relaxed text-ink-muted">{c.footnote}</p>

        <p className="mt-8 text-sm">
          <Link
            href={localeHref(locale, '/ethics')}
            className="font-semibold text-earth underline underline-offset-4"
          >
            {c.linkText}
          </Link>
        </p>
      </section>
    </main>
  );
}
