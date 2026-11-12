import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/common';
import { PhotoHero, PhotoVeil, VisitInfo } from '@/components/site';
import { Icon, Screen, SegmentedControl, Text, type IconName } from '@/components/ui';
import { commonsThumb, feeForPlace, findPlace, guideFor, modelFor } from '@/data';
import { useHaptics, useSafeBack } from '@/hooks';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { application } from '@/services';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import { WISDOM_TIER_OPTIONS, type GuideChapter, type WisdomTier } from '@/types';

const DEPTHS = WISDOM_TIER_OPTIONS.filter((option) => option.value !== 'custom');
const HERO_HEIGHT = 440;

function chapterText(chapter: GuideChapter, depth: WisdomTier): string[] {
  if (depth === 'basic') return [chapter.glance];
  if (depth === 'medium') return [chapter.glance, chapter.story];
  return [chapter.glance, chapter.story, chapter.scholar];
}

/**
 * The deep guide for a major place: the cover photograph, the story at the
 * visitor's chosen depth, a walk with the stops OpenStreetMap has mapped, and
 * what to know before going. Every fact is cited at the foot, and the page
 * says plainly that it has not been reviewed on site yet.
 */
export function PlaceGuideScreen({ placeId }: { placeId: string }) {
  const router = useRouter();
  const goBack = useSafeBack();
  const insets = useSafeAreaInsets();
  const ui = useVisitorLiteralCopy();
  const { selection } = useHaptics();
  const { preferences, update } = usePreferences();
  const [coverFailed, setCoverFailed] = useState(false);
  const guide = guideFor(placeId);
  const place = findPlace(placeId);

  if (!guide || !place) {
    return (
      <Screen>
        <EmptyState title="No guide for this place" body="This place has no long-form guide yet." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }

  const depth: WisdomTier = preferences.wisdomTier === 'custom' ? 'medium' : preferences.wisdomTier;
  const [cover, ...gallery] = guide.photos;
  const model = guide.modelId ? modelFor(place.id) : undefined;

  const actions: { icon: IconName; label: string; onPress: () => void }[] = [
    { icon: 'directions', label: 'Directions', onPress: () => router.dismissTo({ pathname: '/(main)/tirtha/map', params: { guideTo: place.id } }) },
    ...(model ? [{ icon: 'cube-outline' as IconName, label: 'View in 3D', onPress: () => router.push(`/(main)/tirtha/model/${model.id}`) }] : []),
    { icon: 'comment-question-outline', label: 'Ask', onPress: () => router.push({ pathname: '/(main)/dhamma/question', params: { q: guide.questions[0] } }) },
  ];

  return (
    <Screen scroll bleed edges={[]}>
      {/* Cover: the photograph runs to the top of the display; the title sits on a deepening veil. */}
      <View style={styles.hero}>
        {!coverFailed ? (
          <Image
            source={{ uri: commonsThumb(cover.file, 1200) }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
            accessibilityIgnoresInvertColors
            accessibilityLabel={cover.caption}
            onError={() => setCoverFailed(true)}
          />
        ) : null}
        <PhotoVeil edge="top" height={140} steps={10} strength={0.055} />
        <PhotoVeil height={HERO_HEIGHT * 0.8} />

        <View style={[styles.heroTop, { paddingTop: insets.top + spacing.sm }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Back')}
            hitSlop={8}
            onPress={() => {
              selection();
              goBack();
            }}
            style={({ pressed }) => [styles.round, pressed && styles.pressed]}
          >
            <Icon name="chevron-left" size={26} color={colors.onScrim} />
          </Pressable>
        </View>

        <View style={styles.heroText}>
          <Text variant="label" tone="onScrim" uppercase style={styles.eyebrow}>
            {guide.eyebrow}
          </Text>
          <Text variant="display" tone="onScrim" translate={false} style={styles.title}>
            {place.name}
          </Text>
          {place.nameNepali ? (
            <Text variant="bodyLarge" tone="onScrim" translate={false} style={styles.nepali}>
              {place.nameNepali}
            </Text>
          ) : null}
          <Text variant="body" tone="onScrim" translate={false} style={styles.tagline}>
            {guide.tagline}
          </Text>
          <Text variant="caption" tone="onScrim" translate={false} style={styles.credit}>
            {`${cover.author} · ${cover.licence} · Wikimedia Commons`}
          </Text>
        </View>
      </View>

      <View style={styles.sheet}>
        <View style={styles.actions}>
          {actions.map((action) => (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={() => {
                selection();
                action.onPress();
              }}
              style={({ pressed }) => [styles.action, pressed && styles.pressed]}
            >
              <View style={styles.actionIcon}>
                <Icon name={action.icon} size={22} color={colors.onPrimary} />
              </View>
              <Text variant="caption" tone="primary">
                {ui(action.label)}
              </Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.facts}>
          {guide.facts.map((fact, index) => (
            <Animated.View key={fact.label} entering={FadeInDown.duration(360).delay(40 * index)} style={styles.fact}>
              <Text variant="label" tone="muted" uppercase translate={false}>
                {fact.label}
              </Text>
              <Text variant="bodyStrong" translate={false}>
                {fact.value}
              </Text>
            </Animated.View>
          ))}
        </View>

        <View style={styles.section}>
          <Text variant="title">The story</Text>
          <SegmentedControl
            accessibilityLabel={ui('How much to tell')}
            options={DEPTHS.map((option) => ({ value: option.value, label: ui(option.label) }))}
            value={depth}
            onChange={(value) => void update('wisdomTier', value)}
          />
          {guide.chapters.map((chapter, index) => (
            <View key={chapter.title} style={styles.chapter}>
              <View style={styles.chapterHead}>
                <Text variant="display" tone="accent" style={styles.chapterNumber}>
                  {String(index + 1).padStart(2, '0')}
                </Text>
                <Text variant="heading" translate={false} style={styles.flex}>
                  {chapter.title}
                </Text>
              </View>
              {chapterText(chapter, depth).map((paragraph, p) => (
                <Text key={p} variant={p === 0 ? 'bodyLarge' : 'body'} tone={p === 0 ? 'primary' : 'secondary'} translate={false}>
                  {paragraph}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </View>

      {gallery.length ? (
        <View style={styles.section}>
          <Text variant="title" style={styles.gutter}>
            In pictures
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {gallery.map((photo) => (
              <View key={photo.file} style={styles.galleryItem}>
                <PhotoHero uri={commonsThumb(photo.file, 800)} credit={`${photo.author} · ${photo.licence}`} height={200} radius={radii.lg} />
                <Text variant="caption" tone="secondary" translate={false}>
                  {photo.caption}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={[styles.section, styles.gutter]}>
        <Text variant="title" translate={false}>
          {guide.walk.title}
        </Text>
        <Text variant="body" tone="secondary" translate={false}>
          {guide.walk.intro}
        </Text>
        <View style={styles.walk}>
          {guide.walk.stops.map((stop, index) => {
            const last = index === guide.walk.stops.length - 1;
            return (
              <View key={stop.name} style={styles.stop}>
                <View style={styles.rail}>
                  <View style={styles.dot}>
                    <Text variant="caption" style={styles.dotText}>
                      {String(index + 1)}
                    </Text>
                  </View>
                  {!last ? <View style={styles.line} /> : null}
                </View>
                <View style={[styles.stopBody, !last && styles.stopGap]}>
                  <Text variant="bodyStrong" translate={false}>
                    {stop.name}
                  </Text>
                  <Text variant="body" tone="secondary" translate={false}>
                    {stop.note}
                  </Text>
                  {stop.coordinate ? (
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        router.dismissTo({
                          pathname: '/(main)/tirtha/map',
                          params: { focusAt: `${stop.coordinate!.latitude},${stop.coordinate!.longitude}` },
                        })
                      }
                      style={({ pressed }) => [styles.mapLink, pressed && styles.pressed]}
                    >
                      <Icon name="map-marker-outline" size={16} color={colors.primary} />
                      <Text variant="caption" tone="primary">
                        Show on the map
                      </Text>
                    </Pressable>
                  ) : (
                    <Text variant="caption" tone="muted">
                      Not mapped yet
                    </Text>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </View>

      <View style={[styles.section, styles.gutter]}>
        <Text variant="title">Before you go</Text>
        <View style={styles.tips}>
          {guide.beforeYouGo.map((tip) => (
            <View key={tip.title} style={styles.tip}>
              <Icon name={tip.icon as IconName} size={24} color={colors.primary} />
              <Text variant="bodyStrong" translate={false}>
                {tip.title}
              </Text>
              <Text variant="caption" tone="secondary" translate={false}>
                {tip.body}
              </Text>
            </View>
          ))}
        </View>
        <VisitInfo fee={feeForPlace(place)} hours={place.hours} wheelchair={place.wheelchair} />
      </View>

      <View style={[styles.section, styles.gutter]}>
        <Text variant="title">Ask about it</Text>
        {guide.questions.map((question) => (
          <Pressable
            key={question}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/(main)/dhamma/question', params: { q: question } })}
            style={({ pressed }) => [styles.question, pressed && styles.pressed]}
          >
            <Icon name="comment-question-outline" size={18} color={colors.primary} />
            <Text variant="body" translate={false} style={styles.flex}>
              {question}
            </Text>
            <Icon name="chevron-right" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
      </View>

      <View style={[styles.section, styles.gutter, styles.foot]}>
        <View style={styles.review}>
          <Icon name="information-outline" size={18} color={colors.textMuted} />
          <Text variant="caption" tone="secondary" style={styles.flex}>
            Written from the sources below. Not yet reviewed on site by the people who look after this place.
          </Text>
        </View>
        {guide.sources.map((source) => (
          <Pressable key={source.url + source.title} accessibilityRole="link" onPress={() => void application.openExternal(source.url)}>
            <Text variant="caption" tone="primary" translate={false}>
              {source.title}
            </Text>
          </Pressable>
        ))}
        <Text variant="caption" tone="muted" translate={false}>
          {`Photographs: ${guide.photos.map((photo) => photo.author).filter((a, i, all) => all.indexOf(a) === i).join(', ')}, via Wikimedia Commons.`}
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { height: HERO_HEIGHT, justifyContent: 'space-between', backgroundColor: colors.backgroundDeep },
  heroTop: { paddingHorizontal: spacing.gutter, flexDirection: 'row' },
  round: {
    width: 44,
    height: 44,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.scrim,
  },
  heroText: { paddingHorizontal: spacing.gutter, paddingBottom: spacing.xxl, gap: spacing.xs },
  title: { fontSize: 38, lineHeight: 44, letterSpacing: 0 },
  eyebrow: { opacity: 0.85, letterSpacing: 1.2 },
  nepali: { opacity: 0.9 },
  tagline: { opacity: 0.92 },
  credit: { opacity: 0.7, fontSize: 10, marginTop: spacing.xs },
  sheet: {
    marginTop: -spacing.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.gutter,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    backgroundColor: colors.background,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  action: { alignItems: 'center', gap: spacing.xs, minWidth: 72, paddingVertical: spacing.xs, borderRadius: radii.md },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  facts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.lg },
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
  section: { gap: spacing.md, marginTop: spacing.xl },
  gutter: { paddingHorizontal: spacing.gutter },
  chapter: { gap: spacing.sm, marginTop: spacing.sm },
  chapterHead: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
  chapterNumber: { fontSize: 30, lineHeight: 36 },
  flex: { flex: 1 },
  gallery: { gap: spacing.md, paddingHorizontal: spacing.gutter },
  galleryItem: { width: 280, gap: spacing.xs },
  walk: { marginTop: spacing.sm },
  stop: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 32 },
  dot: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  dotText: { color: colors.onAccent, fontWeight: '700' },
  line: { flex: 1, width: 2, marginVertical: spacing.xxs, backgroundColor: colors.border },
  stopBody: { flex: 1, gap: spacing.xxs, paddingTop: spacing.xxs },
  stopGap: { paddingBottom: spacing.lg },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, alignSelf: 'flex-start', minHeight: 32, marginTop: spacing.xxs },
  tips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tip: {
    flexGrow: 1,
    flexBasis: '45%',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.border,
  },
  question: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  foot: { marginBottom: spacing.xxl, gap: spacing.sm },
  review: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  pressed: { opacity: 0.75 },
});
