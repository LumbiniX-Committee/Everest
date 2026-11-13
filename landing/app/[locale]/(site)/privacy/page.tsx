import type { Metadata } from 'next';
import Link from 'next/link';
import { Building2, Clock, Download, Eye, Globe, KeyRound, MapPin } from 'lucide-react';

import { localeHref, type Locale } from '@/lib/i18n';
import { OWNER } from '@/lib/site';

const ICONS = {
  owner: Building2,
  position: MapPin,
  visibility: Eye,
  retention: Clock,
  services: Globe,
  plans: KeyRound,
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
      'Sākṣī records where a visitor stood at places of worship and historical significance, which supports inferences about religious belief. That deserves to be stated plainly, not left to a generic privacy notice. This is a product position, not legal advice.',
    linkLabel: '',
    after: '',
  },
  commitments: {
    owner: {
      title: 'Who is responsible',
      body: `Sākṣī is made and run by ${OWNER.legalName} (Reg. No. ${OWNER.registrationNo}, PAN ${OWNER.pan}), ${OWNER.address.en}. Questions about your records, or this page, go to ${OWNER.email}.`,
    },
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
    services: {
      title: 'Services the app talks to',
      body: "To draw the map, the app downloads map tiles and fonts from OpenFreeMap and terrain from Amazon's open elevation data; those servers see your device's internet address and which area you are viewing, not who you are. When you ask for walking directions, your current position and the destination are sent to the OpenStreetMap routing server run by FOSSGIS, which answers with the route. When satellite view is available it is drawn by Google's Map Tiles service, which sees the area on screen. Photographs of listed places load from Wikimedia Commons. Real 3D scans of places play in Sketchfab's player, and only when you open one: Sketchfab then sees your device's internet address, and the player is asked not to track you. “View in your space” hands one of our own 3D models to Google's Scene Viewer on Android, which fetches it from this website. Reports you choose to share, plan activations and opt-in crash reports go to our own database, hosted by Supabase. Offline map packs, trek routes and the essentials listings are stored on the phone and need no account.",
    },
    plans: {
      title: 'Plans and crash reports',
      body: "Redeeming an activation code links it to the device's anonymous account, so the plan survives a reinstall; the code itself is stored only as a one-way hash. Crash reports are off unless you turn them on in Settings. When on, a report holds the error message, the screen it happened on and the time, with personal details scrubbed, and nothing else.",
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
      'साक्षीले आगन्तुक पूजा स्थल र ऐतिहासिक महत्त्वका ठाउँहरूमा कहाँ उभिए भन्ने दर्ता गर्छ, जसले धार्मिक विश्वासका बारेमा अनुमान लगाउन सघाउँछ। यो कुरा सामान्य गोपनीयता सूचनामा भन्दा स्पष्ट रूपमा भनिनुपर्छ। यो एउटा उत्पादन धारणा हो, कानुनी सल्लाह होइन।',
    linkLabel: '',
    after: '',
  },
  commitments: {
    owner: {
      title: 'जिम्मेवार को हो',
      body: `साक्षी ${OWNER.legalName}ले बनाएको र सञ्चालन गरेको हो (दर्ता नं. ${OWNER.registrationNo}, प्यान ${OWNER.pan}, ${OWNER.address.ne})। तपाईंको अभिलेख वा यो पृष्ठबारे प्रश्न ${OWNER.email} मा पठाउनुहोस्।`,
    },
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
    services: {
      title: 'एपले सम्पर्क गर्ने सेवाहरू',
      body: 'नक्सा देखाउन एपले OpenFreeMap बाट नक्साका टाइल र अक्षर, र Amazon को खुला उचाइ डाटाबाट भू-आकृति डाउनलोड गर्छ; ती सर्भरले तपाईंको डिभाइसको इन्टरनेट ठेगाना र तपाईंले हेरिरहेको क्षेत्र मात्र देख्छन्, तपाईं को हो भन्ने होइन। हिँड्ने बाटो माग्दा तपाईंको हालको स्थान र गन्तव्य FOSSGIS ले चलाउने OpenStreetMap को बाटो सर्भरमा पठाइन्छ। स्याटेलाइट दृश्य उपलब्ध हुँदा Google को Map Tiles सेवाले देखाउँछ, जसले स्क्रिनमा भएको क्षेत्र देख्छ। सूचीकृत ठाउँका तस्बिर Wikimedia Commons बाट आउँछन्। ठाउँहरूका वास्तविक 3D स्क्यान Sketchfab को प्लेयरमा, तपाईंले खोलेपछि मात्र चल्छन्: त्यसबेला Sketchfab ले तपाईंको डिभाइसको इन्टरनेट ठेगाना देख्छ, र प्लेयरलाई तपाईंलाई ट्र्याक नगर्न भनिन्छ। “आफ्नो ठाउँमा हेर्नुहोस्” ले हाम्रो 3D मोडेल Android मा Google को Scene Viewer लाई दिन्छ, जसले यो वेबसाइटबाट मोडेल ल्याउँछ। तपाईंले बाँड्न रोजेका रिपोर्ट, योजना सक्रियता र आफैँ खोलेका क्र्यास रिपोर्ट Supabase मा राखिएको हाम्रो आफ्नै डाटाबेसमा जान्छन्। अफलाइन नक्सा, ट्रेक मार्ग र आवश्यक सेवाका सूची फोनमै रहन्छन् र खाता चाहिँदैन।',
    },
    plans: {
      title: 'योजना र क्र्यास रिपोर्ट',
      body: 'सक्रियता कोड प्रयोग गर्दा त्यो डिभाइसको बेनामी खातासँग जोडिन्छ, जसले गर्दा फेरि इन्स्टल गर्दा पनि योजना रहन्छ; कोड आफैँ एकतर्फी ह्यासका रूपमा मात्र राखिन्छ। क्र्यास रिपोर्ट सेटिङमा तपाईंले नखोलेसम्म बन्द रहन्छ। खोलिएपछि रिपोर्टमा त्रुटि सन्देश, त्रुटि भएको स्क्रिन र समय मात्र हुन्छ, व्यक्तिगत विवरण हटाएर।',
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
          {c.intro.before}
          {c.intro.linkLabel ? (
            <>
              {' '}
              <a href="https://github.com/siddantasodari4-eng/saksi/blob/main/docs/PRIVACY.md" className="font-semibold text-earth underline underline-offset-4">
                {c.intro.linkLabel}
              </a>
            </>
          ) : null}
          {c.intro.after}
        </p>

        <div className="mt-14 space-y-6">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((id) => {
            const Icon = ICONS[id];
            const { title, body } = c.commitments[id];
            return (
              <article
                key={id}
                // Stable anchors: the store listing links #delete as the data-deletion page.
                id={id === 'control' ? 'delete' : id}
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
