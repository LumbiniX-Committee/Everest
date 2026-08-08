/**
 * app/src/screens/SiteDetailScreen.tsx — the site detail surface.
 *
 * Name in display face with Nepali immediately beneath at equal weight; facts
 * as a Plex Mono table; the 200-word narrative; a five-phase timeline scrubber;
 * condition status as one line; sources collapsed but always present
 * (07-DESIGN-SYSTEM §5).
 *
 * The then/now dissolve and audio narration are lane-B/asset surfaces; their
 * slots are here and light up when those assets exist. Pure presentational —
 * data arrives as a SiteDetailResponse.
 */

import { useState } from 'react';
import { View, Pressable } from 'react-native';
import type { SiteDetailResponse, Language, ReportStatus } from '../../../shared/types.ts';
import { color, space, border, radius } from '../design/tokens';
import { Txt, Rule } from '../design/ui';

export interface SiteDetailScreenProps {
  detail: SiteDetailResponse;
  lang: Language;
  onToggleLang: () => void;
  /** Open condition summary for this site, if any. */
  openCondition?: { status: ReportStatus; label: string } | null;
}

export function SiteDetailScreen({ detail, lang, onToggleLang, openCondition }: SiteDetailScreenProps) {
  const { site, timeline } = detail;
  const [showSources, setShowSources] = useState(false);
  const [activePhase, setActivePhase] = useState(timeline.length - 1);

  const summary = lang === 'ne' ? site.summary.ne : site.summary.en;

  return (
    <View style={{ flex: 1, backgroundColor: color.ground }}>
      <View style={{ padding: space.lg }}>
        {/* Name — display face, Nepali beneath at equal weight. */}
        <Txt role="display" tone="white">
          {site.name.en}
        </Txt>
        <Txt role="title" tone="sand" style={{ marginTop: 2 }}>
          {site.name.ne}
        </Txt>

        <Pressable onPress={onToggleLang} accessibilityRole="button" style={{ marginTop: space.sm }}>
          <Txt role="label" tone="lock">
            {lang === 'en' ? 'नेपालीमा पढ्नुहोस्' : 'read in english'}
          </Txt>
        </Pressable>

        <Rule />

        {/* Facts — Plex Mono table. */}
        {site.facts.map((f, i) => (
          <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Txt role="data" tone="sand_dim">
              {lang === 'ne' ? f.label.ne : f.label.en}
            </Txt>
            <Txt role="data" tone="sand">
              {lang === 'ne' ? f.value.ne : f.value.en}
            </Txt>
          </View>
        ))}

        <Rule />

        {/* Narrative. */}
        <Txt role="body" tone="sand">
          {summary}
        </Txt>

        {/* Inscription, when present. */}
        {site.inscription && (
          <View style={{ marginTop: space.lg }}>
            <Txt role="label" tone="sand_dim">
              inscription
            </Txt>
            <Txt role="data" tone="sand" style={{ marginTop: space.xs }}>
              {site.inscription.transliteration}
            </Txt>
            <Txt role="body" tone="sand_dim" style={{ marginTop: space.sm }}>
              {lang === 'ne' ? site.inscription.translation.ne : site.inscription.translation.en}
            </Txt>
          </View>
        )}

        <Rule />

        {/* Timeline scrubber — turns a gallery into an argument. */}
        <Txt role="label" tone="sand_dim">
          conservation timeline
        </Txt>
        <View style={{ flexDirection: 'row', marginTop: space.sm }}>
          {timeline.map((phase, i) => (
            <Pressable
              key={phase.id}
              onPress={() => setActivePhase(i)}
              style={{ flex: 1, alignItems: 'center' }}
              accessibilityRole="button"
            >
              <View
                style={{
                  width: '100%',
                  height: 3,
                  backgroundColor: i === activePhase ? color.lock : color.ground3,
                }}
              />
              <Txt role="data" tone={i === activePhase ? 'sand' : 'sand_faint'} style={{ marginTop: 4, fontSize: 10 }}>
                {phase.year_from}
              </Txt>
            </Pressable>
          ))}
        </View>
        {timeline[activePhase] && (
          <View style={{ marginTop: space.md }}>
            <Txt role="title" tone="white">
              {lang === 'ne' ? timeline[activePhase].label.ne : timeline[activePhase].label.en}
            </Txt>
            <Txt role="body" tone="sand_dim" style={{ marginTop: space.xs }}>
              {lang === 'ne' ? timeline[activePhase].description.ne : timeline[activePhase].description.en}
            </Txt>
          </View>
        )}

        <Rule />

        {/* Condition status — a single line. */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: openCondition ? color.change : color.resolved,
              marginRight: space.sm,
            }}
          />
          <Txt role="body" tone={openCondition ? 'change' : 'resolved'}>
            {openCondition ? openCondition.label : 'No open conditions recorded here.'}
          </Txt>
        </View>

        <Rule />

        {/* Sources — collapsed by default, always present. */}
        <Pressable onPress={() => setShowSources((s) => !s)} accessibilityRole="button">
          <Txt role="label" tone="sand_dim">
            {showSources ? 'hide sources' : `sources (${site.sources.length})`}
          </Txt>
        </Pressable>
        {showSources &&
          site.sources.map((src, i) => (
            <View
              key={i}
              style={{
                marginTop: space.sm,
                padding: space.sm,
                borderColor: color.ground3,
                borderWidth: border.hairline,
                borderRadius: radius.sm,
              }}
            >
              <Txt role="bodySm" tone="sand">
                {src.title}
              </Txt>
              {src.locator && (
                <Txt role="data" tone="sand_faint" style={{ marginTop: 2 }}>
                  {src.locator}
                </Txt>
              )}
            </View>
          ))}
      </View>
    </View>
  );
}
