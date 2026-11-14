import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PhotoHero } from '@/components/site';
import { Icon, Text } from '@/components/ui';
import { commonsThumb, inLanguage } from '@/data';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { colors, radii, spacing } from '@/theme';
import type { Flagship, InterfaceLanguage, WisdomTier } from '@/types';

/**
 * The flagship places at three depths that are genuinely different texts.
 *
 * The rest of the catalogue shows a shorter or longer cut of one description,
 * which is why switching Glance to Scholar used to change almost nothing.
 * Here Glance is the essentials and what to know at the gate, Story is a
 * narrative read through photographs and a timeline, and Scholar is the
 * evidence: dated inscriptions, disagreements between sources, and numbered
 * citations a reader can follow.
 */
export function FlagshipDepth({ flagship, depth, language }: { flagship: Flagship; depth: WisdomTier; language: InterfaceLanguage }) {
  const ui = useVisitorLiteralCopy();
  const t = (text: Parameters<typeof inLanguage>[0]) => inLanguage(text, language);

  if (depth === 'basic') {
    return (
      <View style={styles.block}>
        <Text variant="bodyLarge" translate={false}>
          {t(flagship.glance.essentials)}
        </Text>
        <View style={styles.facts}>
          {flagship.glance.facts.map((fact) => (
            <View key={fact.label.en} style={styles.fact}>
              <Text variant="label" tone="muted" uppercase translate={false}>
                {t(fact.label)}
              </Text>
              <Text variant="bodyStrong" translate={false}>
                {t(fact.value)}
              </Text>
            </View>
          ))}
        </View>
        <Text variant="heading">{ui('Good to know')}</Text>
        {flagship.glance.tips.map((tip) => (
          <View key={tip.en} style={styles.tip}>
            <Icon name="check-circle-outline" size={18} color={colors.primary} />
            <Text variant="body" tone="secondary" translate={false} style={styles.flex}>
              {t(tip)}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (depth === 'high') {
    return (
      <View style={styles.block}>
        {flagship.scholar.sections.map((section) => (
          <View key={section.title.en} style={styles.chapter}>
            <Text variant="heading" translate={false}>
              {t(section.title)}
            </Text>
            <Text variant="body" translate={false}>
              {`${t(section.body)} ${section.cites.map((index) => `[${index + 1}]`).join('')}`}
            </Text>
          </View>
        ))}
        <Text variant="heading">{ui('References')}</Text>
        {flagship.sources.map((source, index) => (
          <Pressable
            key={source.url + source.title}
            accessibilityRole="link"
            onPress={() => void application.openExternal(source.url)}
            style={({ pressed }) => [styles.reference, pressed && styles.pressed]}
          >
            <Text variant="caption" tone="muted" translate={false} style={styles.refNumber}>
              {`[${index + 1}]`}
            </Text>
            <Text variant="caption" tone="primary" translate={false} style={styles.flex}>
              {source.title}
            </Text>
          </Pressable>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.block}>
      {flagship.story.chapters.map((chapter, index) => {
        const photo = chapter.photo != null ? flagship.photos[chapter.photo] : undefined;
        return (
          <View key={chapter.title.en} style={styles.chapter}>
            <View style={styles.chapterHead}>
              <Text variant="display" tone="accent" style={styles.chapterNumber}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              <Text variant="heading" translate={false} style={styles.flex}>
                {t(chapter.title)}
              </Text>
            </View>
            {photo ? (
              <View style={styles.inline}>
                <PhotoHero uri={commonsThumb(photo.file, 1024)} credit={`${photo.author} · ${photo.licence}`} height={200} radius={radii.lg} />
                <Text variant="caption" tone="muted" translate={false}>
                  {t(photo.caption)}
                </Text>
              </View>
            ) : null}
            <Text variant="body" translate={false}>
              {t(chapter.body)}
            </Text>
          </View>
        );
      })}
      <Text variant="heading">{ui('Timeline')}</Text>
      <View>
        {flagship.story.timeline.map((entry, index) => {
          const last = index === flagship.story.timeline.length - 1;
          return (
            <View key={entry.what.en} style={styles.event}>
              <View style={styles.rail}>
                <View style={styles.dot} />
                {!last ? <View style={styles.line} /> : null}
              </View>
              <View style={[styles.eventBody, !last && styles.eventGap]}>
                <Text variant="label" tone="sandstone" uppercase translate={false}>
                  {t(entry.when)}
                </Text>
                <Text variant="body" translate={false}>
                  {t(entry.what)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

/** A strip of the flagship's other photographs, each credited on the image. */
export function FlagshipGallery({ flagship, language, bleed = 0 }: { flagship: Flagship; language: InterfaceLanguage; bleed?: number }) {
  const ui = useVisitorLiteralCopy();
  const gallery = flagship.photos.slice(1);
  if (!gallery.length) return null;
  return (
    <View style={styles.block}>
      <Text variant="heading" style={{ paddingHorizontal: bleed }}>
        {ui('In pictures')}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -bleed }}
        contentContainerStyle={[styles.gallery, { paddingHorizontal: bleed }]}
      >
        {gallery.map((photo) => (
          <View key={photo.file} style={styles.galleryItem}>
            <PhotoHero uri={commonsThumb(photo.file, 800)} credit={`${photo.author} · ${photo.licence}`} height={170} radius={radii.lg} />
            <Text variant="caption" tone="secondary" translate={false} numberOfLines={2}>
              {inLanguage(photo.caption, language)}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** What a visitor needs on the day, and the places inside the place. */
export function FlagshipVisit({ flagship, language }: { flagship: Flagship; language: InterfaceLanguage }) {
  const router = useRouter();
  const ui = useVisitorLiteralCopy();
  const t = (text: Parameters<typeof inLanguage>[0]) => inLanguage(text, language);
  const rows: { icon: React.ComponentProps<typeof Icon>['name']; label: string; text: string }[] = [
    { icon: 'clock-outline', label: ui('Opening hours'), text: t(flagship.visit.hours) },
    { icon: 'tshirt-crew-outline', label: ui('Dress and etiquette'), text: t(flagship.visit.dress) },
    { icon: 'map-marker-path', label: ui('Best route'), text: t(flagship.visit.route) },
    { icon: 'camera-outline', label: ui('Photography'), text: t(flagship.visit.photography) },
  ];

  return (
    <View style={styles.block}>
      <Text variant="heading">{ui('Before you go')}</Text>
      {rows.map((row) => (
        <View key={row.label} style={styles.visitRow}>
          <Icon name={row.icon} size={22} color={colors.primary} />
          <View style={styles.flex}>
            <Text variant="label" tone="muted" uppercase translate={false}>
              {row.label}
            </Text>
            <Text variant="body" tone="secondary" translate={false}>
              {row.text}
            </Text>
          </View>
        </View>
      ))}

      <Text variant="heading">{ui('Places within')}</Text>
      {flagship.subsites.map((subsite) => {
        const coordinate = subsite.coordinate;
        const onPress = subsite.siteId
          ? () => router.push(`/(main)/tirtha/site/${subsite.siteId}`)
          : coordinate
            ? () => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { focusAt: `${coordinate.latitude},${coordinate.longitude}` } })
            : undefined;
        return (
          <Pressable
            key={subsite.name.en}
            accessibilityRole={onPress ? 'button' : undefined}
            disabled={!onPress}
            onPress={onPress}
            style={({ pressed }) => [styles.subsite, pressed && styles.pressed]}
          >
            <View style={styles.flex}>
              <Text variant="bodyStrong" translate={false}>
                {t(subsite.name)}
              </Text>
              <Text variant="caption" tone="secondary" translate={false}>
                {t(subsite.note)}
              </Text>
            </View>
            {onPress ? (
              <Icon name={subsite.siteId ? 'chevron-right' : 'map-marker-outline'} size={20} color={colors.textMuted} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { gap: spacing.md, paddingVertical: spacing.md },
  flex: { flex: 1 },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  fact: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xxs,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  tip: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  chapter: { gap: spacing.sm, marginTop: spacing.xs },
  chapterHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  chapterNumber: { fontSize: 30, lineHeight: 36 },
  inline: { gap: spacing.xxs },
  event: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 14 },
  dot: { width: 12, height: 12, marginTop: 4, borderRadius: radii.full, backgroundColor: colors.accent },
  line: { flex: 1, width: 2, marginVertical: spacing.xxs, backgroundColor: colors.border },
  eventBody: { flex: 1, gap: spacing.xxs },
  eventGap: { paddingBottom: spacing.md },
  reference: { flexDirection: 'row', gap: spacing.sm, minHeight: 32, alignItems: 'flex-start' },
  refNumber: { minWidth: 28 },
  gallery: { gap: spacing.md },
  galleryItem: { width: 240, gap: spacing.xs },
  visitRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  subsite: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.75 },
});
