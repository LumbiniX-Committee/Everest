import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { BackBar, EmptyState } from '@/components/common';
import { Button, Chip, Screen, SegmentedControl, Text } from '@/components/ui';
import { ON_SITE_RADIUS_M } from '@/core';
import { findPlace, findSite, panoramasFor, type Panorama } from '@/data';
import { useCurrentPosition, useSafeBack } from '@/hooks';
import { useInterfaceLanguage } from '@/i18n/context';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePreferences } from '@/store';
import { colors, radii, spacing } from '@/theme';
import type { InterfaceLanguage } from '@/types';
import { distanceMeters } from '@/utils';

import type { PanoramaEvent, PanoramaViewHandle } from './bridge';
import { PanoramaView } from './PanoramaView';
import { usePanoramaNarration } from './usePanoramaNarration';
import { useMotionLook } from './useMotionLook';

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'ne', label: 'Nepali' },
] as const;

/**
 * "Look around": a 360° photograph of the place, turned by a finger or by the
 * phone itself, with its features marked and explained aloud.
 */
export function LookAroundScreen({ siteId }: { siteId: string }) {
  const goBack = useSafeBack();
  const panoramas = panoramasFor(siteId);
  const [chosen, setChosen] = useState(0);
  const panorama = panoramas[chosen];
  const placeName = findSite(siteId)?.name ?? findPlace(siteId)?.name ?? null;

  if (!panorama) {
    return (
      <Screen>
        <BackBar />
        <EmptyState
          title="No panorama for this place"
          body="There is no openly licensed 360° photograph of this place yet."
          actionLabel="Back"
          onAction={goBack}
        />
      </Screen>
    );
  }

  return (
    <Screen bleed edges={['top', 'bottom']}>
      <View style={styles.top}>
        <BackBar />
      </View>
      <LookAround
        key={panorama.id}
        panorama={panorama}
        placeName={placeName}
        choices={panoramas}
        chosen={chosen}
        onChoose={setChosen}
      />
    </Screen>
  );
}

function LookAround({
  panorama,
  placeName,
  choices,
  chosen,
  onChoose,
}: {
  panorama: Panorama;
  placeName: string | null;
  choices: Panorama[];
  chosen: number;
  onChoose: (index: number) => void;
}) {
  const ui = useVisitorLiteralCopy();
  const interfaceLanguage = useInterfaceLanguage();
  const { preferences } = usePreferences();
  const [language, setLanguage] = useState<InterfaceLanguage>(interfaceLanguage);
  const [status, setStatus] = useState<'loading' | 'loaded' | 'offline' | 'unsupported'>('loading');
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [motionOn, setMotionOn] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const viewer = useRef<PanoramaViewHandle>(null);
  const lastView = useRef(panorama.startAzimuth);
  const autoStarted = useRef(false);

  const { coordinate, demoMode } = useCurrentPosition();
  // A scripted demo walk is not standing there, and must not claim to be.
  const onSite = !demoMode && coordinate != null && distanceMeters(coordinate, panorama.coordinate) <= ON_SITE_RADIUS_M;

  // Built once per panorama: rebuilding it would reload the page and the image.
  const config = useMemo(
    () => ({
      imageUrl: panorama.imageUrl,
      fallbackUrl: panorama.fallbackUrl,
      northU: panorama.northU,
      startAzimuth: panorama.startAzimuth,
      hotspots: panorama.hotspots.map((h) => ({ id: h.id, u: h.u, v: h.v, title: h.title[interfaceLanguage] })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panorama, attempt],
  );

  const narration = usePanoramaNarration(panorama.narration, language);
  const motion = useMotionLook({
    enabled: motionOn,
    onSite,
    startAzimuth: () => lastView.current,
    onLook: (az, el) => viewer.current?.send({ type: 'look', az, el }),
  });

  const onEvent = useCallback((event: PanoramaEvent) => {
    if (event.type === 'ready') setReady(true);
    else if (event.type === 'loaded') setStatus('loaded');
    else if (event.type === 'error') setStatus(event.reason === 'image' ? 'offline' : 'unsupported');
    else if (event.type === 'view') lastView.current = event.az;
    else if (event.type === 'hotspot') {
      setSelected(event.id);
      viewer.current?.send({ type: 'focus', id: event.id });
    }
  }, []);

  // Hotspot labels follow the explanation's language.
  useEffect(() => {
    if (!ready) return;
    const titles = Object.fromEntries(panorama.hotspots.map((h) => [h.id, h.title[language]]));
    viewer.current?.send({ type: 'labels', titles });
  }, [language, panorama, ready]);

  useEffect(() => {
    if (ready) viewer.current?.send({ type: 'motion', on: motionOn });
  }, [motionOn, ready]);

  // The explanation starts by itself once there is something to look at, in
  // the visitor's language, unless they have turned automatic narration off.
  const { voiceAvailable, play } = narration;
  useEffect(() => {
    if (autoStarted.current || status !== 'loaded' || voiceAvailable == null) return;
    autoStarted.current = true;
    if (preferences.autoNarration) play();
  }, [play, preferences.autoNarration, status, voiceAvailable]);

  // While a sentence names a feature, the view turns to it.
  const segment = panorama.narration[narration.index];
  useEffect(() => {
    if (!narration.playing || !segment?.hotspotId) return;
    viewer.current?.send({ type: 'focus', id: segment.hotspotId });
  }, [narration.playing, segment]);

  const selectedSpot = panorama.hotspots.find((h) => h.id === selected) ?? null;
  const selectedIndex = selectedSpot ? panorama.narration.findIndex((s) => s.hotspotId === selectedSpot.id) : -1;

  const motionNote = motion.available === false
    ? 'This phone has no motion sensor, so drag to look around.'
    : !motionOn
      ? 'Drag to look around, pinch to zoom.'
      : !onSite
        ? 'You are not here, so the view turns with your phone without matching north.'
        : motion.aligned
          ? 'North matches the real scene around you.'
          : 'Finding north with the compass…';

  const silentNote = voiceAvailable === false
    ? language === 'ne'
      ? 'This phone has no Nepali voice, so the explanation is shown here as text.'
      : 'This phone cannot read aloud, so the explanation is shown here as text.'
    : null;

  return (
    <View style={styles.flex}>
      <View style={styles.viewer}>
        <PanoramaView key={attempt} ref={viewer} config={config} onEvent={onEvent} />
        {status === 'loading' ? (
          <View style={[StyleSheet.absoluteFill, styles.center]} pointerEvents="none">
            <ActivityIndicator color={colors.onScrim} />
            <Text variant="caption" tone="onScrim" style={styles.gapTop}>
              Loading the panorama…
            </Text>
          </View>
        ) : null}
        {status === 'offline' || status === 'unsupported' ? (
          <View style={[StyleSheet.absoluteFill, styles.center, styles.veil]}>
            <Text variant="body" tone="onScrim" center>
              {status === 'offline'
                ? 'The panorama could not load. It needs a connection: try again when you have signal.'
                : 'This phone could not draw the 360° view.'}
            </Text>
            {status === 'offline' ? (
              <Button
                label="Try again"
                variant="secondary"
                style={styles.gapTop}
                onPress={() => {
                  setStatus('loading');
                  setReady(false);
                  setAttempt((n) => n + 1);
                }}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <Text variant="label" tone="muted" uppercase>
          Look around
        </Text>
        <Text variant="heading" translate={false}>
          {placeName ? `${placeName} · ${panorama.title[language]}` : panorama.title[language]}
        </Text>

        {choices.length > 1 ? (
          <View style={styles.row} accessibilityLabel={ui('Views')}>
            {choices.map((choice, i) => (
              <Chip key={choice.id} label={choice.title[interfaceLanguage]} selected={i === chosen} onPress={() => onChoose(i)} />
            ))}
          </View>
        ) : null}

        <View style={styles.row}>
          {motion.available !== false ? (
            <Button
              label={motionOn ? 'Stop moving with phone' : 'Move phone to look'}
              icon={motionOn ? 'close-circle-outline' : 'rotate-3d-variant'}
              variant={motionOn ? 'primary' : 'secondary'}
              disabled={motion.available == null}
              onPress={() => setMotionOn((on) => !on)}
            />
          ) : null}
        </View>
        <Text variant="caption" tone="secondary">
          {motionNote}
        </Text>
        {panorama.northApproximate && motionOn && onSite ? (
          <Text variant="caption" tone="muted">
            North in this photograph is estimated from the sun’s position when it was taken, so it may be a few degrees out.
          </Text>
        ) : null}

        <View style={styles.narrationHead}>
          <Text variant="bodyStrong">Explanation</Text>
          <SegmentedControl
            options={LANGUAGE_OPTIONS}
            value={language}
            onChange={(next) => setLanguage(next)}
            accessibilityLabel={ui('Explanation language')}
          />
        </View>
        <View style={styles.row}>
          <Button
            label={narration.playing ? 'Pause' : narration.finished ? 'Play again' : 'Play'}
            icon={narration.playing ? 'pause' : 'play'}
            variant="secondary"
            disabled={voiceAvailable == null}
            onPress={narration.playing ? narration.pause : narration.play}
          />
        </View>
        {silentNote ? (
          <Text variant="caption" tone="muted">
            {silentNote}
          </Text>
        ) : null}
        {panorama.narration.map((s, i) => (
          <Text
            key={i}
            variant="body"
            tone={i === narration.index && (narration.playing || !narration.finished) ? 'primary' : 'secondary'}
            translate={false}
          >
            {s[language]}
          </Text>
        ))}

        {selectedSpot ? (
          <View style={styles.card}>
            <Text variant="bodyStrong" translate={false}>
              {selectedSpot.title[language]}
            </Text>
            {selectedIndex >= 0 ? (
              <Text variant="caption" tone="secondary" translate={false}>
                {panorama.narration[selectedIndex][language]}
              </Text>
            ) : null}
            <View style={styles.row}>
              {selectedIndex >= 0 && voiceAvailable ? (
                <Button label="Listen" icon="volume-high" variant="secondary" onPress={() => narration.playFrom(selectedIndex)} />
              ) : null}
              <Button label="Close" variant="quiet" onPress={() => setSelected(null)} />
            </View>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="link"
          accessibilityLabel={ui('Open the photograph on Wikimedia Commons')}
          onPress={() => void Linking.openURL(panorama.sourcePage)}
        >
          <Text variant="caption" tone="muted">
            {ui('Photo')}: <Text variant="caption" tone="muted" translate={false}>{panorama.author}</Text>, {' '}
            <Text variant="caption" tone="muted" translate={false}>{panorama.licence}</Text> {ui('· Wikimedia Commons')}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  top: { paddingHorizontal: spacing.gutter },
  viewer: { flex: 1.1, minHeight: 260, backgroundColor: colors.backgroundDeep, overflow: 'hidden' },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  veil: { backgroundColor: colors.scrim },
  gapTop: { marginTop: spacing.sm },
  panel: { flex: 1 },
  panelContent: { padding: spacing.gutter, gap: spacing.sm, paddingBottom: spacing.xl },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' },
  narrationHead: { marginTop: spacing.md, gap: spacing.sm },
  card: {
    gap: spacing.xs,
    padding: spacing.base,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSecondary,
  },
});
