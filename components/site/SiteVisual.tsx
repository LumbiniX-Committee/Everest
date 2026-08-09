import { Image, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui';
import { findSite, heroImageForSite, massingFor } from '@/data';
import { colors, radii, spacing } from '@/theme';

/**
 * A place, as a picture, always.
 *
 * ── Why this exists ─────────────────────────────────────────────────────────
 *
 * Three of the twelve sites carry a photograph and six historical plates are
 * bundled. Every screen that wants to show a place therefore had the same
 * choice: a photograph for a lucky few, and prose for the rest. That is how the
 * app ended up reading as a document — not because anyone chose text, but
 * because the alternative was a grey rectangle.
 *
 * So the last resort is a drawing rather than a gap. A stupa dome, a pitched
 * shelter, a stepped tank: the same massing the map extrudes, drawn flat. It is
 * a diagram of a kind of thing and it says so, which is the one honest way to
 * illustrate a place you have no picture of. It is never a stock photograph of
 * somewhere else and never a photograph of a different monument.
 *
 * ── Why it is built from Views ──────────────────────────────────────────────
 *
 * There is no SVG in this project and no icon library — see ProgressRing, which
 * makes the same case: a native dependency cannot reach the shipped APK over
 * the air. Borders, radii and layered Views draw all of this, and the Reticle
 * proves the vocabulary works at any scale.
 */

export type SiteVisualProps = {
  siteId: string;
  height?: number;
  /** Corner radius, so a thumbnail and a hero can share one component. */
  radius?: number;
  /** Hides the provenance tag where the caller has its own caption. */
  quiet?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function SiteVisual({
  siteId,
  height = 120,
  radius = radii.md,
  quiet = false,
  style,
}: SiteVisualProps) {
  const hero = heroImageForSite(siteId);

  if (hero) {
    return (
      <View style={[styles.frame, { height, borderRadius: radius }, style]}>
        <Image
          source={hero.source}
          style={styles.photo}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        {hero.historical && !quiet ? <Tag label="Historical plate" /> : null}
      </View>
    );
  }

  return (
    <View style={[styles.frame, { height, borderRadius: radius }, style]}>
      <SiteSchematic siteId={siteId} height={height} />
      {quiet ? null : <Tag label="Schematic" />}
    </View>
  );
}

/**
 * The monument's own shape, drawn.
 *
 * Proportions come from `massingFor`, which is the table the map extrudes — so
 * the Peace Pagoda is the tall one here for the same reason it is the tall one
 * on the map, and a correction in one place moves both.
 */
function SiteSchematic({ siteId, height }: { siteId: string; height: number }) {
  const massing = massingFor(siteId);
  const site = findSite(siteId);
  const form = massing?.form ?? 'square';

  // The ground line sits a fifth up from the bottom; everything stands on it.
  const groundY = height * 0.2;
  const available = height - groundY - spacing.sm;
  // Tallest monument here is the 41 m pagoda; scale everything against it so
  // the relative heights are the real ones rather than each shape filling the
  // box it happens to be drawn in.
  const scale = Math.min(1, (massing?.height ?? 6) / 41);
  const bodyH = Math.max(available * 0.32, available * (0.35 + scale * 0.65));

  return (
    <View style={styles.sky}>
      {/* A low band of ground, so the shape stands on something. */}
      <View style={[styles.ground, { height: groundY }]} />

      <View style={[styles.stage, { bottom: groundY }]}>
        {form === 'water' ? (
          // A stepped tank, seen from a low angle: three concentric rims.
          <View style={styles.tank}>
            <View style={[styles.tankRim, { width: '78%', height: bodyH * 0.62 }]} />
            <View style={[styles.tankRim, styles.tankRimInner, { width: '58%', height: bodyH * 0.42 }]} />
            <View style={[styles.tankWater, { width: '38%', height: bodyH * 0.24 }]} />
          </View>
        ) : form === 'round' ? (
          // Dome, harmika and spire — a stupa in three parts.
          <View style={styles.stupa}>
            <View style={[styles.spire, { height: bodyH * 0.34 }]} />
            <View style={styles.harmika} />
            <View style={[styles.dome, { width: bodyH * 0.98, height: bodyH * 0.5 }]} />
            <View style={[styles.plinth, { width: bodyH * 1.16 }]} />
          </View>
        ) : (
          // A pitched shelter over a plinth — the shape of the temple and the
          // monastery halls.
          <View style={styles.hall}>
            <View style={[styles.roof, { borderBottomWidth: bodyH * 0.34 }]} />
            <View style={[styles.wall, { height: bodyH * 0.54, width: bodyH * 1.1 }]} />
            <View style={[styles.plinth, { width: bodyH * 1.3 }]} />
          </View>
        )}
      </View>

      {site?.nameNepali ? (
        <Text variant="caption" tone="muted" style={styles.script} numberOfLines={1}>
          {site.nameNepali}
        </Text>
      ) : null}
    </View>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <View style={styles.tag}>
      <Text variant="caption" tone="inverse" style={styles.tagText}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.surfaceSecondary,
  },
  photo: { width: '100%', height: '100%' },

  sky: { flex: 1, backgroundColor: colors.mapBase },
  ground: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.mapLanduse,
  },
  stage: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },

  stupa: { alignItems: 'center' },
  dome: {
    backgroundColor: colors.sandstone,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  harmika: {
    width: 14,
    height: 8,
    backgroundColor: colors.sandstoneDeep,
  },
  spire: {
    width: 4,
    backgroundColor: colors.sandstoneDeep,
    borderRadius: radii.full,
  },

  hall: { alignItems: 'center' },
  // A triangle from a zero-width box with coloured bottom border — the same
  // trick the tab indicator uses, and the only way to a diagonal without SVG.
  roof: {
    width: 0,
    height: 0,
    borderLeftWidth: 34,
    borderRightWidth: 34,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.earth,
    transform: [{ rotate: '180deg' }],
  },
  wall: { backgroundColor: colors.sandstone },

  tank: { alignItems: 'center', justifyContent: 'flex-end' },
  tankRim: {
    backgroundColor: colors.sandstone,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },
  tankRimInner: { position: 'absolute', backgroundColor: colors.sandstoneDeep },
  tankWater: {
    position: 'absolute',
    backgroundColor: colors.mapWater,
    borderTopLeftRadius: 999,
    borderTopRightRadius: 999,
  },

  plinth: {
    height: 6,
    backgroundColor: colors.sandstoneDeep,
    borderRadius: 2,
  },

  script: {
    position: 'absolute',
    right: spacing.xs,
    top: spacing.xs,
    opacity: 0.7,
  },

  tag: {
    position: 'absolute',
    left: spacing.xs,
    bottom: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: 'rgba(37, 42, 39, 0.72)',
  },
  tagText: { fontSize: 10 },
});
