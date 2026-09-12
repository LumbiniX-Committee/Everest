import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, Database, FileJson, Sheet } from 'lucide-react';

import { PageHero, Prose, Section } from '@/components/ui';
import { localeHref, type Locale } from '@/lib/i18n';
import { REPO_URL } from '@/lib/site';
import manifest from '@/public/data/manifest.json';

const ICONS = {
  'sites.geojson': FileJson,
  'sites.csv': Sheet,
  'vantages.geojson': FileJson,
  'manifest.json': Database,
} as const;

const EN = {
  metaTitle: 'Open data',
  metaDescription:
    'The heritage site register and its established photographic vantages, as GeoJSON and CSV, with coordinate provenance carried on every record. Built for a GIS, not for a screenshot.',
  hero: {
    eyebrow: 'Open data',
    title: 'The register, in a format a GIS actually reads',
    lede: 'Heritage inventory platforms are systems of record that wait to be fed. Saying Sākṣī should feed them is a promise until the data can leave without anyone having to ask, so here it is: coordinates, viewpoints, provenance and sources, regenerated from the same seed files the app ships with.',
  },
  filesKicker: 'The files',
  filesTitle: 'Four downloads, no registration',
  files: {
    'sites.geojson': {
      what: 'Every site as a point feature, with region, zone, period, photography policy, viewpoint count and its cited sources.',
    },
    'sites.csv': {
      what: 'The same register as a spreadsheet, RFC 4180 and UTF-8, for anyone who is not opening a GIS today.',
    },
    'vantages.geojson': {
      what: 'The established photographic viewpoints: position, bearing, pitch, field of view, and the tolerances the app accepts an alignment within.',
    },
    'manifest.json': {
      what: 'What each file contains, when it was generated, the coordinate reference system, and the caveats that travel with it.',
    },
  },
  statLabels: {
    sites: 'heritage sites',
    checked: 'with coordinates checked against a gazetteer',
    vantages: 'established viewpoints',
  },
  versionLabel: 'version',
  claimsKicker: 'Read this first',
  claimsTitle: 'What the data does not claim',
  claimsBefore:
    'The same rule that governs the app governs the export:',
  claimsStrong: 'provenance travels with the measurement.',
  claimsMiddle:
    'Five of the fifteen sites carry a coordinate read off a document and never checked against a gazetteer. Those are exported with',
  claimsCode: 'surveyed: false',
  claimsAfter: ', not quietly rounded into looking like a survey.',
  licenceKicker: 'Licence',
  licenceTitle: 'CC BY 4.0, with one obligation we cannot waive',
  licenceP1Before: 'The register is licensed',
  licenceP1Link: 'Creative Commons Attribution 4.0',
  licenceP1After:
    '. Take it, use it, fold it into your own inventory, build on it: and say where it came from. Attribution is the whole condition, and it is the same rule the application holds itself to.',
  licenceP2Before: 'The source code is separately licensed',
  licenceP2Link1: 'Apache 2.0',
  licenceP2Middle: ', and the reasoning behind both is written up in',
  licenceP2Link2: 'docs/LICENSING.md',
  licenceP2After: '.',
  suggestedAttribution: 'Suggested attribution',
  osmTitle: 'OpenStreetMap coordinates carry ODbL, whatever we say',
  osmBefore: 'Ten of the fifteen sites carry a coordinate recorded as',
  osmCode: 'coords_source: osm',
  osmMiddle:
    '. Those positions were checked against, and in places taken from, OpenStreetMap: © OpenStreetMap contributors, under the',
  osmLink: 'Open Database Licence',
  osmAfter:
    ". Our grant covers our compilation. It cannot relicense theirs, so if you extract those coordinates into a database of your own, ODbL's attribution and share-alike terms apply to you.",
  thirdPartyBefore: 'Third-party media shipped with the app: photographs, audio, fonts and the damage-detection model, stays under its own licences, all 107 assets itemised in',
  thirdPartyLink: 'LICENCES.md',
  thirdPartyMiddle: '. If you are a custodial institution, the',
  thirdPartyLink2: 'custodian dashboard',
  thirdPartyMiddle2: 'exports live condition reports on the same terms, and',
  thirdPartyLink3: 'the research report',
  thirdPartyAfter:
    'sets out why we think this belongs in your inventory rather than only in ours.',
};

const NE: typeof EN = {
  metaTitle: 'खुला डेटा',
  metaDescription:
    'सम्पदा स्थलहरूको दर्ता र तिनका स्थापित फोटोग्राफिक दृष्टिकोणहरू, GeoJSON र CSV को रूपमा, हरेक अभिलेखमा निर्देशांक स्रोतसहित। स्क्रिनसटका लागि होइन, GIS का लागि बनाइएको।',
  hero: {
    eyebrow: 'खुला डेटा',
    title: 'दर्ता, GIS ले साँच्चै पढ्ने ढाँचामा',
    lede: 'सम्पदा सूची प्लेटफर्महरू अभिलेखका प्रणाली हुन् जुन खुवाइनका लागि पर्खिरहेका छन्। साक्षीले तिनलाई खुवाउनुपर्छ भन्नु कसैले नसोधी डेटा बाहिर जान सक्ने नभएसम्म एउटा वाचा मात्र हो, त्यसैले यहाँ छ: निर्देशांक, दृष्टिकोण, स्रोत र सन्दर्भहरू, एपसँगै आउने उही सिड फाइलहरूबाट पुनः उत्पन्न गरिएको।',
  },
  filesKicker: 'फाइलहरू',
  filesTitle: 'चार डाउनलोड, कुनै दर्ता आवश्यक छैन',
  files: {
    'sites.geojson': {
      what: 'हरेक ठाउँ एउटा बिन्दु सुविधाको रूपमा, क्षेत्र, जोन, कालखण्ड, फोटोग्राफी नीति, दृष्टिकोण सङ्ख्या र यसका उद्धृत स्रोतहरूसहित।',
    },
    'sites.csv': {
      what: 'उही दर्ता स्प्रेडसिटको रूपमा, RFC 4180 र UTF-8 मा, जसले आज GIS खोल्दैन उसका लागि।',
    },
    'vantages.geojson': {
      what: 'स्थापित फोटोग्राफिक दृष्टिकोणहरू: स्थिति, दिशा, झुकाव, दृश्य क्षेत्र, र एपले मिलान स्वीकार गर्ने सहनशीलता।',
    },
    'manifest.json': {
      what: 'हरेक फाइलमा के छ, यो कहिले उत्पन्न गरियो, निर्देशांक सन्दर्भ प्रणाली, र यससँगै आउने सावधानीहरू।',
    },
  },
  statLabels: {
    sites: 'सम्पदा स्थलहरू',
    checked: 'गजेटियरविरुद्ध जाँचिएको निर्देशांकसहित',
    vantages: 'स्थापित दृष्टिकोणहरू',
  },
  versionLabel: 'संस्करण',
  claimsKicker: 'पहिले यो पढ्नुहोस्',
  claimsTitle: 'डेटाले के दाबी गर्दैन',
  claimsBefore: 'एपलाई सञ्चालन गर्ने उही नियमले निर्यातलाई पनि सञ्चालन गर्छ:',
  claimsStrong: 'स्रोत मापनसँगै यात्रा गर्छ।',
  claimsMiddle:
    'पन्ध्रमध्ये पाँच ठाउँले कुनै कागजातबाट पढिएको र कहिल्यै गजेटियरविरुद्ध नजाँचिएको निर्देशांक बोक्छन्। तिनलाई',
  claimsCode: 'surveyed: false',
  claimsAfter: ' सहित निर्यात गरिन्छ, चुपचाप सर्वेक्षण जस्तो देखिने गरी मिलाइएको होइन।',
  licenceKicker: 'इजाजतपत्र',
  licenceTitle: 'CC BY 4.0, जुन एउटा दायित्व हामी माफ गर्न सक्दैनौं',
  licenceP1Before: 'दर्तालाई इजाजतपत्र दिइएको छ',
  licenceP1Link: 'Creative Commons Attribution 4.0',
  licenceP1After:
    ' अन्तर्गत। यसलाई लिनुहोस्, प्रयोग गर्नुहोस्, आफ्नै सूचीमा मिसाउनुहोस्, यसमाथि निर्माण गर्नुहोस्: र यो कहाँबाट आयो भनी बताउनुहोस्। श्रेय नै सम्पूर्ण सर्त हो, र यो उही नियम हो जुन एपले आफैलाई लागू गर्छ।',
  licenceP2Before: 'स्रोत कोडलाई अलग्गै इजाजतपत्र दिइएको छ',
  licenceP2Link1: 'Apache 2.0',
  licenceP2Middle: ' अन्तर्गत, र दुवैपछाडिको तर्क यहाँ लेखिएको छ',
  licenceP2Link2: 'docs/LICENSING.md',
  licenceP2After: '।',
  suggestedAttribution: 'सुझाइएको श्रेय',
  osmTitle: 'OpenStreetMap निर्देशांकहरूले जे भने पनि ODbL बोक्छन्',
  osmBefore: 'पन्ध्रमध्ये दस ठाउँले यसरी दर्ता गरिएको निर्देशांक बोक्छन्',
  osmCode: 'coords_source: osm',
  osmMiddle:
    '। ती स्थानहरू OpenStreetMap विरुद्ध जाँचिएका थिए, र ठाउँ-ठाउँमा त्यहींबाट लिइएका थिए: © OpenStreetMap योगदानकर्ताहरू,',
  osmLink: 'Open Database Licence',
  osmAfter:
    ' अन्तर्गत। हाम्रो अनुदानले हाम्रो सङ्कलनलाई मात्र समेट्छ। यसले उनीहरूको इजाजतपत्र बदल्न सक्दैन, त्यसैले यदि तपाईंले ती निर्देशांकहरू आफ्नै डाटाबेसमा झिक्नुभयो भने, ODbL का श्रेय र समान-साझेदारी सर्तहरू तपाईंलाई लागू हुन्छन्।',
  thirdPartyBefore:
    'एपसँगै आउने तेस्रो-पक्ष मिडिया: तस्बिर, अडियो, फन्ट र क्षति-पत्ता लगाउने मोडेल, आफ्नै इजाजतपत्रअन्तर्गत रहन्छ, सबै 107 सम्पत्ति सूचीबद्ध',
  thirdPartyLink: 'LICENCES.md',
  thirdPartyMiddle: 'मा। यदि तपाईं संरक्षक संस्था हुनुहुन्छ भने,',
  thirdPartyLink2: 'संरक्षक ड्यासबोर्डले',
  thirdPartyMiddle2: 'उही सर्तमा प्रत्यक्ष अवस्था प्रतिवेदन निर्यात गर्छ, र',
  thirdPartyLink3: 'अनुसन्धान प्रतिवेदनले',
  thirdPartyAfter:
    'किन यो हाम्रो मात्र नभई तपाईंको सूचीमा पनि पर्नुपर्छ भन्ने कुरा राख्छ।',
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
    alternates: { languages: { en: '/en/data', ne: '/ne/data' } },
  };
}

export default async function DataPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const c = locale === 'ne' ? NE : EN;

  return (
    <main>
      <PageHero eyebrow={c.hero.eyebrow} title={c.hero.title} lede={c.hero.lede} />

      <Section kicker={c.filesKicker} title={c.filesTitle}>
        <div className="mt-8 space-y-4">
          {(Object.keys(ICONS) as (keyof typeof ICONS)[]).map((name) => {
            const Icon = ICONS[name];
            const { what } = c.files[name];
            return (
              <a
                key={name}
                href={`/data/${name}`}
                className="flex items-start gap-5 rounded-3xl border border-line bg-surface p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-tirtha/10 text-tirtha">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block font-mono text-sm font-semibold text-ink">{name}</span>
                  <span className="mt-1.5 block leading-relaxed text-ink-soft">{what}</span>
                </span>
              </a>
            );
          })}
        </div>

        <dl className="mt-8 grid gap-px overflow-hidden rounded-3xl border border-line bg-line sm:grid-cols-3">
          {[
            { v: manifest.counts.sites, k: c.statLabels.sites },
            {
              v: manifest.counts.sites_with_checked_coordinates,
              k: c.statLabels.checked,
            },
            { v: manifest.counts.established_vantages, k: c.statLabels.vantages },
          ].map(({ v, k }) => (
            <div key={k} className="bg-surface p-6">
              <dt className="font-[family-name:var(--font-display)] text-4xl font-semibold text-sakshi tabular-nums">
                {v}
              </dt>
              <dd className="mt-2 text-sm leading-relaxed text-ink-soft">{k}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-6 font-mono text-sm text-ink-muted">
          {c.versionLabel} {manifest.version} · {manifest.crs}
        </p>
      </Section>

      <Section tone="deep" kicker={c.claimsKicker} title={c.claimsTitle}>
        <Prose>
          <p>
            {c.claimsBefore} <strong>{c.claimsStrong}</strong> {c.claimsMiddle}{' '}
            <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">
              {c.claimsCode}
            </code>
            {c.claimsAfter}
          </p>
        </Prose>

        <div className="mt-8 space-y-3">
          {manifest.caveats.map((caveat) => (
            <div
              key={caveat}
              className="flex gap-4 rounded-2xl border border-line border-l-4 border-l-earth bg-surface p-5"
            >
              <AlertTriangle className="mt-0.5 size-5 shrink-0 text-earth" aria-hidden />
              <p className="leading-relaxed text-ink-soft">{caveat}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section kicker={c.licenceKicker} title={c.licenceTitle}>
        <Prose>
          <p>
            {c.licenceP1Before}{' '}
            <a href={manifest.licence_url}>{c.licenceP1Link}</a>
            {c.licenceP1After}
          </p>
          <p>
            {c.licenceP2Before}{' '}
            <a href={`${REPO_URL}/blob/main/LICENSE`}>{c.licenceP2Link1}</a>
            {c.licenceP2Middle}{' '}
            <a href={`${REPO_URL}/blob/main/docs/LICENSING.md`}>{c.licenceP2Link2}</a>
            {c.licenceP2After}
          </p>
        </Prose>

        <div className="mt-8 rounded-3xl border border-line bg-surface p-6 shadow-sm">
          <h3 className="text-xs font-semibold tracking-widest text-ink-muted uppercase">
            {c.suggestedAttribution}
          </h3>
          <p className="mt-3 rounded-2xl bg-ground-deep p-4 font-mono text-sm leading-relaxed text-ink">
            {manifest.attribution}
          </p>
        </div>

        <div className="mt-4 flex gap-4 rounded-3xl border border-line border-l-4 border-l-earth bg-surface p-6">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-earth" aria-hidden />
          <div>
            <h3 className="font-semibold text-ink">{c.osmTitle}</h3>
            <p className="mt-2 leading-relaxed text-ink-soft">
              {c.osmBefore}{' '}
              <code className="rounded bg-surface-secondary px-1.5 py-0.5 font-mono text-sm">
                {c.osmCode}
              </code>
              {c.osmMiddle}{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                className="text-earth underline underline-offset-4"
              >
                {c.osmLink}
              </a>
              {c.osmAfter}
            </p>
          </div>
        </div>

        <Prose>
          <p className="mt-8">
            {c.thirdPartyBefore}{' '}
            <a href={`${REPO_URL}/blob/main/LICENCES.md`}>{c.thirdPartyLink}</a>
            {c.thirdPartyMiddle}{' '}
            <Link href={localeHref(locale, '/for-custodians')}>{c.thirdPartyLink2}</Link>{' '}
            {c.thirdPartyMiddle2}{' '}
            <Link href={localeHref(locale, '/research')}>{c.thirdPartyLink3}</Link>{' '}
            {c.thirdPartyAfter}
          </p>
        </Prose>
      </Section>
    </main>
  );
}
