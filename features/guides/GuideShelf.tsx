import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { PhotoVeil } from '@/components/site';
import { Icon, Text } from '@/components/ui';
import { commonsThumb, findPlace, PLACE_GUIDES } from '@/data';
import { useHaptics } from '@/hooks';
import { colors, radii, spacing } from '@/theme';
import type { PlaceGuide } from '@/types';

const CARD_WIDTH = 260;
const CARD_HEIGHT = 320;

function GuideCard({ guide }: { guide: PlaceGuide }) {
  const router = useRouter();
  const { selection } = useHaptics();
  const [failed, setFailed] = useState(false);
  const place = findPlace(guide.placeId);
  if (!place) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={place.name}
      onPress={() => {
        selection();
        router.push({ pathname: '/(main)/tirtha/guide/[placeId]', params: { placeId: guide.placeId } });
      }}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {!failed ? (
        <Image
          source={{ uri: commonsThumb(guide.photos[0].file, 640) }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
          onError={() => setFailed(true)}
        />
      ) : null}
      <PhotoVeil height={CARD_HEIGHT * 0.75} steps={20} strength={0.12} />
      <View style={styles.text}>
        <Text variant="label" tone="onScrim" uppercase numberOfLines={1} style={styles.eyebrow}>
          {guide.eyebrow.split(' · ')[0]}
        </Text>
        <Text variant="title" tone="onScrim" translate={false}>
          {place.name}
        </Text>
        <Text variant="caption" tone="onScrim" translate={false} numberOfLines={3}>
          {guide.tagline}
        </Text>
        <View style={styles.open}>
          <Text variant="caption" tone="accent">
            Open the guide
          </Text>
          <Icon name="arrow-right" size={16} color={colors.accent} />
        </View>
      </View>
    </Pressable>
  );
}

/** The deep guides, as a row of photographs on Explore. */
export function GuideShelf() {
  return (
    <View style={styles.wrap}>
      <Text variant="label" tone="muted" uppercase>
        In depth
      </Text>
      <Text variant="title">Three places, told fully</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row} style={styles.scroller}>
        {PLACE_GUIDES.map((guide) => (
          <GuideCard key={guide.placeId} guide={guide} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs, marginBottom: spacing.lg },
  scroller: { marginHorizontal: -spacing.gutter },
  row: { gap: spacing.md, paddingHorizontal: spacing.gutter, paddingVertical: spacing.sm },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderRadius: radii.xl,
    backgroundColor: colors.backgroundDeep,
  },
  text: { padding: spacing.base, gap: spacing.xxs },
  eyebrow: { opacity: 0.85, letterSpacing: 1.2 },
  open: { flexDirection: 'row', alignItems: 'center', gap: spacing.xxs, marginTop: spacing.xs },
  pressed: { opacity: 0.85 },
});
