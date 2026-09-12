import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrivalWisdom } from '@/components/arrival';
import { MapWebView } from '@/components/map';
import { GreetingMonk } from '@/components/monk';
import { NarrationPlayer } from '@/components/site';
import { BottomSheet, Button, Card, Icon, Text } from '@/components/ui';
import { reachedNewLevel, standingFor } from '@/core';
import { findSite, findVantage, questsForPrecinct, vantagesForSite, questAreas, type QuestArea } from '@/data';
import {
  useCurrentPosition,
  useDemoWalk,
  useHaptics,
  useHeading,
  useSiteArrival,
  useStoryProgress,
} from '@/hooks';
import { arrival, location as locationService, questMemories } from '@/services';
import { useVisitorLiteralCopy } from '@/i18n/useVisitorLiteralCopy';
import { usePractice, usePreferences, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';

import { BuddhaChat } from './BuddhaChat';
import { DemoWalkPanel } from './DemoWalkPanel';
import { DemoRoutePicker } from './DemoRoutePicker';
import { PlacePicker } from './PlacePicker';
import { QuestHud, RewardToast } from './QuestHud';
import { QuestSheet } from './QuestSheet';
import { StorySequence } from './StorySequence';

/**
 * Height of the top HUD row, so the things below it can clear it by arithmetic
 * rather than by a number someone guessed and then had to keep guessing.
 */
const HUD_ROW_H = 72;

/**
 * The map, full screen, with you standing on it.
 *
 * Deliberately not a `Screen`: that component supplies the page gutter and the
 * pale ground, and both would frame a map that is meant to be the whole
 * surface. The controls float over it against the safe area instead.
 *
 * Rendered through the WebView path unconditionally rather than preferring the
 * native module — the figure is a three.js custom layer, and MapLibre Native
 * has no 3D model support, so the native map cannot draw it at any quality.
 */
export function LiveMapScreen() {
  const ui = useVisitorLiteralCopy();
  const router = useRouter();
  const { guideArea } = useLocalSearchParams<{ guideArea?: string }>();
  const returnToQuests = useRef(false);
  const insets = useSafeAreaInsets();
  const { coordinate, demoMode } = useCurrentPosition({ watch: true });
  const deviceHeading = useHeading();
  const demo = useDemoWalk();
  const { pulse } = useHaptics();
  const { pauseWalk, resumeWalk } = demo;
  const [follow, setFollow] = useState(true);
  const [showWisdomModal, setShowWisdomModal] = useState(false);

  // notify:false — Tīrtha's card already announces, and two banners for one
  // arrival is the app talking over itself.
  const { atSiteId, nearest: near } = useSiteArrival(coordinate, { notify: false });

  const activeSiteId = atSiteId ?? near?.site.id;
  const activeSignificance = activeSiteId ? arrival.significanceOf(activeSiteId) : null;

  const { preferences } = usePreferences();
  const { summary, recognise } = usePractice();
  const { quests, creditArrival } = useQuests();
  const story = useStoryProgress();
  // Mirror story into a ref so imperative code can always read the latest
  // value without being in a stale closure.
  const storyRef = useRef(story);
  useEffect(() => { storyRef.current = story; }, [story]);

  const [showStory, setShowStory] = useState(false);
  const manualPause = useRef(false);
  const pauseManually = () => { manualPause.current = true; pauseWalk(); };
  const resumeManually = () => { manualPause.current = false; if (!showStory) resumeWalk(); };
  const resumeAfterStory = () => { if (demoMode && !manualPause.current) resumeWalk(); };
  const [showChat, setShowChat] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  useFocusEffect(useCallback(() => {
    if (returnToQuests.current) { returnToQuests.current = false; setShowQuests(true); }
  }, []));
  const [showPlaces, setShowPlaces] = useState(false);
  const [showDemoRoutes, setShowDemoRoutes] = useState(false);
  const [reward, setReward] = useState<{ title: string; detail?: string } | null>(null);
  const hideReward = useCallback(() => setReward(null), []);

  // A visit objective is evidence-backed by the same live position that drives
  // the arrival story. Reaching a child monument also settles the parent
  // complex's arrival objective, so entering Hanuman Dhoka immediately changes
  // “Reach Kathmandu Durbar Square” to completed without asking for a tap.
  useEffect(() => {
    if (!atSiteId) return;
    void creditArrival(atSiteId).then((count) => {
      if (count > 0) {
        setReward({
          title: count === 1 ? '✓ Place reached' : `✓ ${count} visit objectives complete`,
          detail: findSite(atSiteId)?.name,
        });
      }
    });
  }, [atSiteId, creditArrival]);
  /**
   * A commanded camera move.
   *
   * `nonce` is what makes asking twice work. The move is delivered by comparing
   * the serialised value, so choosing the same place a second time produced an
   * identical object, the effect did not re-run, and the camera stayed where the
   * user had panned it — "the target location isn't set".
   */
  const [camera, setCamera] = useState<{
    longitude: number;
    latitude: number;
    distance: 'world' | 'close';
    nonce: number;
  } | null>(null);
  const cameraNonce = useRef(0);
  const flyTo = useCallback((longitude: number, latitude: number, distance: 'world' | 'close') => {
    cameraNonce.current += 1;
    setCamera({ longitude, latitude, distance, nonce: cameraNonce.current });
  }, []);
  const [guideTargetId, setGuideTargetId] = useState<string | null>(null);
  const guideTarget = guideTargetId ? questAreas.find((area) => area.id === guideTargetId) : undefined;
  useFocusEffect(useCallback(() => {
    if (guideArea && questAreas.some((area) => area.id === guideArea)) {
      setGuideTargetId(guideArea);
      setFollow(false);
    }
  }, [guideArea]));
  const guideRoute = coordinate && guideTarget
    ? [[coordinate.longitude, coordinate.latitude], [guideTarget.coordinate.longitude, guideTarget.coordinate.latitude]] as const
    : [];

  /** Quests belong to the nearby cultural area, not an exact monument pin. */
  const questAreaSiteId = near && near.distanceM <= 5_000 ? near.site.id : null;
  const questsHere = questAreaSiteId ? questsForPrecinct(questAreaSiteId, quests) : [];
  const questsDoneHere = questsHere.filter((q) => q.progress?.status === 'completed').length;
  const questsOpenHere = questsHere.length - questsDoneHere;

  /**
   * The story, opened by reaching the place it is about.
   *
   * Three conditions, all necessary. It opens on the *transition* into a site,
   * so it cannot reopen while you stand there; only once per site, tracked
   * across the whole visit rather than per render; and only when the site has
   * something to say at the reader's chosen depth, which is the same test the
   * arrival banner applies — a sequence that opens onto nothing is worse than
   * one that never opened.
   *
   * A place already read does not tell its story again. Dismissing is
   * remembered for the visit, because someone who closed it has said no here
   * and reopening on the next fix would be the app arguing.
   */
  /**
   * Story trigger — fires once per genuine site transition.
   *
   * Using a prevAtSiteId ref rather than useEffect dependency tracking to avoid
   * a class of timing bugs where the effect re-runs (because `story` changed
   * identity) after `openedFor` was already set, silently blocking the story.
   * Reading all mutable state through refs means the check always sees the
   * latest value at the moment of the transition, never a stale closure.
   */
  const openedFor = useRef<string | null>(null);
  const prevAtSiteIdRef = useRef<string | null>(null);
  // Preferences ref so the trigger always reads current prefs without being
  // listed as a dependency (prefs change does not constitute a new arrival).
  const prefsRef = useRef(preferences);
  useEffect(() => { prefsRef.current = preferences; }, [preferences]);
  const demoModeRef = useRef(demoMode);
  useEffect(() => { demoModeRef.current = demoMode; }, [demoMode]);

  // The actual trigger — runs on every render but only fires side-effects when
  // atSiteId has genuinely changed to a new, non-null value.
  useEffect(() => {
    if (atSiteId === prevAtSiteIdRef.current) return;
    prevAtSiteIdRef.current = atSiteId;

    if (!atSiteId) {
      // Walked away — re-arm for a genuine return.
      openedFor.current = null;
    } else if (
      openedFor.current !== atSiteId &&
      prefsRef.current.autoWisdom &&
      (demoModeRef.current || !storyRef.current.hasRead(atSiteId)) &&
      arrival.hasSomethingToSay(atSiteId, prefsRef.current.wisdomTier)
    ) {
      openedFor.current = atSiteId;
      // Schedule the story open and camera move on the next tick so React can
      // finish the current render before we set state.
      const capturedId = atSiteId;
      const timer = setTimeout(() => {
        setShowStory(true);
        if (demoModeRef.current) pauseWalk();
        const site = findSite(capturedId);
        if (site) flyTo(site.coordinate.longitude, site.coordinate.latitude, 'close');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [atSiteId, pauseWalk, flyTo]);


  /**
   * Demo restart: re-arm the gamified story for every site.
   *
   * The story progress is persisted to AsyncStorage so real visits are not
   * replayed. But a demo is the one case where replaying is the point — the
   * presenter needs to walk the same circuit again without clearing app data
   * manually. Resetting both the in-memory guard and the persisted map means
   * the next time the demo position enters a site radius, the Buddha sequence
   * fires fresh.
   */
  const handleDemoRestart = () => {
    manualPause.current = false;
    openedFor.current = null;
    prevAtSiteIdRef.current = null;
    void story.reset();
    demo.restart();
  };

  // When the demo toggles ON, also re-arm so the very first site of a new
  // demo run shows the sequence even if the user visited it in real mode.
  useEffect(() => {
    if (!demoMode) return;
    openedFor.current = null;
    prevAtSiteIdRef.current = null;
    void story.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  /**
   * Reading a place through is an act of attention, so it is recognised like
   * one — through the same capped ledger, at the same `wisdom` weight the
   * arrival card uses. There is no second currency: the wisdom the interface
   * shows is this balance. See core/progression.
   */
  const onStoryComplete = async (siteId: string) => {
    setShowStory(false);
    setCamera(null);
    // Resume the demo walker — story is done, character can move to next site.
    resumeAfterStory();
    await story.markRead(siteId);

    const before = summary.balance;
    const event = await recognise({ kind: 'wisdom', siteId });
    const after = before + (event?.amount ?? 0);
    const leveledUp = reachedNewLevel(before, after);
    const standingAfter = standingFor(after);
    const site = findSite(siteId);

    // Recognition, not a score. Crossing a threshold is named rather than
    // celebrated, and the amount shown is always the amount the ledger actually
    // granted — which is zero once the daily cap is reached, and says so.
    setReward(
      leveledUp
        ? {
            title: `✦ Recognised as ${standingAfter.title}`,
            detail: `${site?.name ?? 'This place'} · ${amountLine(event?.amount ?? 0)}`,
          }
        : event && event.amount > 0
          ? {
              title: `✦ ${event.amount} puṇya recorded`,
              detail: `${site?.name ?? 'This place'} · ${standingAfter.title}`,
            }
          : {
              title: '✦ Recorded',
              detail: `${site?.name ?? 'This place'} · enough for today; the record keeps`,
            },
    );
  };


  /**
   * Hand off to Sākṣī, from the place you are standing in.
   *
   * Sākṣī is a separate surface with its own tab, and this does not reimplement
   * any of it — reaching a monument is simply the moment its capture flow is
   * worth offering, so this is the door rather than the room.
   *
   * ── The route matters, and mine was wrong ──────────────────────────────────
   *
   * An observation is a photograph taken *from a known vantage*: the whole
   * point is that the next person can stand in the same spot. So the door has
   * to open on a vantage. This used to send a site id to
   * `/sakshi/register/<siteId>`, which is the Chaityāvalī history page — a
   * perfectly good screen with no camera anywhere on it. Witnessing appeared to
   * do nothing because it went somewhere else.
   *
   * Only three of the twelve sites carry vantages, so the honest answer at the
   * other nine is to say so rather than navigate into a dead end.
   */
  const openSakshi = (targetId: string) => {
    setShowQuests(false);

    if (findVantage(targetId)) {
      router.push({ pathname: '/(main)/sakshi/vantage', params: { vantageId: targetId } });
      return;
    }

    const vantages = vantagesForSite(targetId);
    if (vantages.length > 0) {
      router.push({ pathname: '/(main)/sakshi/vantage', params: { vantageId: vantages[0].id } });
      return;
    }

    const site = findSite(targetId);
    setReward({
      title: 'No vantage here yet',
      detail: `${site?.name ?? 'This place'} has no surveyed viewpoint to photograph from`,
    });
  };

  /** Take the camera there, and the player too when the walk is driving. */
  const goToSite = (siteId: string) => {
    setShowPlaces(false);
    setShowQuests(false);

    const site = findSite(siteId);
    if (site) flyTo(site.coordinate.longitude, site.coordinate.latitude, 'world');
    if (demo.active) locationService.demo.goToSite(siteId);
  };

  /** Guide the visitor without changing either their real or simulated location. */
  const guideToSite = (site: QuestArea) => {
    setShowQuests(false);
    setGuideTargetId(site.id);
    setFollow(false);
    setCamera(null);
  };

  // On the walk the figure faces the way it is going. The magnetometer is
  // reporting which way the phone is pointing on a desk, which has nothing to
  // do with the pilgrim on the map and makes the character spin as you move it.
  const heading = demo.active
    ? (demo.step?.headingDeg ?? 0)
    : typeof deviceHeading === 'number'
      ? deviceHeading
      : null;

  return (
    <View style={styles.root}>
      <MapWebView
        fill
        showFigure
        coordinate={coordinate}
        heading={heading}
        follow={follow}
        route={guideTarget ? guideRoute : demo.route}
        routeColor={guideTarget ? colors.warning : colors.sandstoneDeep}
        guideDestination={guideTarget ? { ...guideTarget.coordinate, name: guideTarget.name } : null}
        camera={camera}
        onSelectSite={(id) => router.push(`/(main)/tirtha/site/${id}`)}
        topInset={insets.top}
      />

      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.topLeft} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Tīrtha')}
            accessibilityHint={ui('Everything else at Lumbini: the sites, the quests, then and now')}
            onPress={() => {
              pulse();
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/(main)/tirtha');
              }
            }}
            style={({ pressed }) => [styles.homeButton, pressed && styles.buttonPressed]}
          >
            <Icon name="chevron-left" size={30} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Open your quest memories')}
            onPress={() => router.push('/(main)/tirtha/memories')}
            style={({ pressed }) => [styles.iconPill, pressed && styles.buttonPressed]}
          >
            <Icon name="image-multiple-outline" size={23} color={colors.primary} />
          </Pressable>
        </View>

        <View style={styles.topRight} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Go to a place')}
            onPress={() => {
              pulse();
              setShowPlaces(true);
            }}
            style={({ pressed }) => [styles.iconPill, pressed && styles.buttonPressed]}
          >
            <Icon name="compass-outline" size={25} color={colors.primary} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui(follow ? 'Stop following your position' : 'Follow your position')}
            accessibilityState={{ selected: follow }}
            onPress={() => {
              pulse();
              setFollow((f) => !f);
            }}
            style={({ pressed }) => [styles.iconPill, follow && styles.pillActive, pressed && styles.buttonPressed]}
          >
            <Icon
              name={follow ? 'crosshairs-gps' : 'crosshairs'}
              size={24}
              color={follow ? colors.primary : colors.textSecondary}
            />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui(demoMode ? (demo.paused ? 'Resume the demo walk' : 'Pause the demo walk') : 'Start the demo walk')}
            accessibilityHint={ui(demoMode ? 'Keeps the simulated location fixed until you resume' : 'Choose a heritage precinct and walk it using synthetic positions')}
            accessibilityState={{ selected: demoMode }}
            onPress={() => {
              pulse();
              if (demoMode) {
                if (demo.paused) resumeManually();
                else pauseManually();
              }
              else setShowDemoRoutes(true);
            }}
            style={({ pressed }) => [styles.iconPill, demoMode && styles.pillActive, pressed && styles.buttonPressed]}
          >
            <Icon
              name={demoMode && !demo.paused ? 'pause' : 'play'}
              size={25}
              color={demoMode ? colors.primary : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>

      <View style={[styles.worldControls, { top: insets.top + HUD_ROW_H }]} pointerEvents="box-none">
        <QuestHud
          available={questsOpenHere}
          completed={questsDoneHere}
          total={questsHere.length}
          pulse={questsOpenHere > 0 && !showStory}
          onPress={() => {
            pulse();
            if (demoMode) pauseManually();
            setShowQuests(true);
          }}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            atSiteId
              ? story.hasRead(atSiteId)
                ? 'Ask the Buddha'
                : 'Hear this place'
              : 'Ask about Lumbini'
          }
          accessibilityHint={ui('Opens Buddha guide to listen to site stories or ask questions')}
          onPress={() => {
            pulse();
            if (atSiteId && !story.hasRead(atSiteId)) {
              setShowStory(true);
              if (demoMode) pauseWalk();
            } else {
              setShowChat(true);
            }
          }}
          style={({ pressed }) => [styles.worldButton, pressed && styles.buttonPressed]}
        >
          <GreetingMonk height={38} />
        </Pressable>

        {atSiteId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={ui('Witness this place')}
            accessibilityHint={ui('Opens Sākṣī to record what you can see here')}
            onPress={() => {
              pulse();
              openSakshi(atSiteId);
            }}
            style={({ pressed }) => [styles.worldButton, pressed && styles.buttonPressed]}
          >
            <Icon name="eye-outline" size={24} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.dock} pointerEvents="box-none">
        {guideTarget ? <View style={styles.guideCard}>
          <Text variant="heading">{guideTarget.name}</Text>
          <Text variant="caption" tone="secondary">Yellow line shows the direction. Use walking directions for streets and paths.</Text>
          <Button label="Walking directions" icon="directions" onPress={() => { void questMemories.walkingDirections(guideTarget.coordinate).catch(() => setReward({ title: 'Could not open directions', detail: 'Please try again.' })); }} />
          <Button label="Clear destination" variant="quiet" onPress={() => setGuideTargetId(null)} />
        </View> : null}
        <View style={styles.toastSlot} pointerEvents="none">
          <RewardToast
            visible={reward !== null}
            title={reward?.title ?? ''}
            detail={reward?.detail}
            onHide={hideReward}
          />
        </View>

        {demo.active ? (
          <DemoWalkPanel
            step={demo.step}
            coordinate={coordinate}
            atSiteId={atSiteId}
            paused={demo.paused}
            onRestart={handleDemoRestart}
            onPause={pauseManually}
            onResume={resumeManually}
            onExit={demo.toggle}
          />
        ) : null}
      </View>

      <BottomSheet
        visible={showWisdomModal}
        onClose={() => setShowWisdomModal(false)}
        title={near ? near.site.name : 'Lumbini'}
        translateTitle={!near}
        subtitle={
          atSiteId
            ? 'You are here'
            : near
              ? `${Math.round(near.distanceM)} m away`
              : 'The sacred garden and its precincts'
        }
        scroll
      >
        <View style={styles.modalContent}>
          <View style={styles.avatarBanner}>
            <GreetingMonk height={120} />
          </View>

          {activeSiteId ? (
            <NarrationPlayer
              siteId={activeSiteId}
              autoPlay={preferences.autoNarration && atSiteId === activeSiteId}
              textless
            />
          ) : null}

          {coordinate || activeSiteId ? (
            <ArrivalWisdom coordinate={coordinate} notify={false} siteId={activeSiteId} />
          ) : null}

          {!atSiteId && activeSignificance ? (
            <Card style={styles.fallbackCard}>
              <Text variant="label" tone="sandstone" uppercase>
                {activeSignificance.site.name}
              </Text>
              {activeSignificance.narration ? (
                <Text variant="body">{activeSignificance.narration}</Text>
              ) : null}
              {activeSignificance.dhamma[0] ? (
                <View style={styles.dhammaSnippet}>
                  <Text variant="label" tone="muted" uppercase>
                    From the canon
                  </Text>
                  {activeSignificance.dhamma[0].original ? (
                    <Text variant="body" tone="sandstone" style={styles.dhammaOriginal}>
                      {activeSignificance.dhamma[0].original}
                    </Text>
                  ) : null}
                  <Text variant="body">{activeSignificance.dhamma[0].answer}</Text>
                </View>
              ) : null}
            </Card>
          ) : null}
        </View>
      </BottomSheet>

      <QuestSheet
        visible={showQuests}
        onClose={() => setShowQuests(false)}
        coordinate={coordinate}
        quests={quests}
        onGuide={guideToSite}
        onCapture={(questId, taskId) => {
          returnToQuests.current = true;
          setShowQuests(false);
          if (demoMode) pauseManually();
          router.push({ pathname: '/(main)/tirtha/quest-camera', params: { questId, taskId } });
        }}
        onMemories={() => { setShowQuests(false); router.push('/(main)/tirtha/memories'); }}
        onWitness={openSakshi}
      />

      <PlacePicker
        visible={showPlaces}
        onClose={() => setShowPlaces(false)}
        coordinate={coordinate}
        atSiteId={atSiteId}
        canTravel={demo.active}
        onSelect={goToSite}
      />

      <DemoRoutePicker
        visible={showDemoRoutes}
        onClose={() => setShowDemoRoutes(false)}
        onSelect={(walkId) => {
          manualPause.current = false;
          setGuideTargetId(null);
          locationService.demo.selectWalk(walkId);
          locationService.setDemoMode(true);
          setShowDemoRoutes(false);
        }}
      />

      {/*
        Last in the tree, so the guide stands in front of the world and the HUD
        both. It is the only thing on this screen that takes the whole surface,
        and it does so without covering the map — see StorySequence.
      */}
      {atSiteId && showStory ? (
        <StorySequence
          siteId={atSiteId}
          visible={showStory}
          onComplete={(siteId) => void onStoryComplete(siteId)}
          onDismiss={() => {
            setShowStory(false);
            setCamera(null);
            // Dismissed without completing — still unfreeze so demo can continue.
            resumeAfterStory();
          }}
          onOpenQuests={() => {
            setShowStory(false);
            setCamera(null);
            resumeAfterStory();
            setShowQuests(true);
          }}
        />
      ) : null}

      <BuddhaChat
        visible={showChat}
        onClose={() => setShowChat(false)}
        siteId={activeSiteId}
        siteName={activeSignificance?.site.name}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  guideCard: { margin: spacing.md, padding: spacing.md, gap: spacing.xs, borderRadius: radii.lg, backgroundColor: colors.surface, borderColor: colors.warning, borderWidth: 1 },
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.content,
    gap: spacing.sm,
    zIndex: 10,
  },
  pill: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillActive: { borderColor: colors.borderStrong, backgroundColor: colors.primarySoft },
  topLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexShrink: 1 },
  homeButton: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 6,
  },
  topRight: { flexDirection: 'row', gap: spacing.sm, flexShrink: 0 },
  iconPill: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 7,
    elevation: 6,
  },
  /** The world actions, in one right-hand column clear of the top bar. */
  worldControls: { position: 'absolute', right: spacing.base, zIndex: 12, gap: spacing.sm, alignItems: 'center' },
  worldButton: {
    width: 58,
    height: 58,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surfaceRaised,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    elevation: 5,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  toastSlot: { alignItems: 'center', paddingBottom: spacing.sm },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  modalContent: {
    gap: spacing.md,
    paddingBottom: spacing.base,
  },
  avatarBanner: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  fallbackCard: {
    gap: spacing.sm,
    borderColor: colors.sandstone,
  },
  dhammaSnippet: {
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  dhammaOriginal: {
    fontStyle: 'italic',
  },
  buttonPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});

/**
 * What the ledger actually granted, in words.
 *
 * Zero is a real and expected outcome — the daily cap exists precisely so that
 * repeating an act stops being worth anything, and `core/progression` says the
 * completion moments must state that rather than show an amount that was not
 * granted. Printing a fixed "+200" over a capped award would be inventing a
 * measurement, which is the one thing this record must never do.
 */
function amountLine(amount: number): string {
  return amount > 0 ? `${amount} puṇya recorded` : 'enough for today; the record keeps';
}
