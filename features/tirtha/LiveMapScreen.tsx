import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ArrivalWisdom } from '@/components/arrival';
import { MapWebView } from '@/components/map';
import { GreetingMonk } from '@/components/monk';
import { NarrationPlayer } from '@/components/site';
import { BottomSheet, Card, Text } from '@/components/ui';
import { placeStanding, standingFor } from '@/core';
import { findSite, findVantage, questsForSite, vantagesForSite } from '@/data';
import {
  useCurrentPosition,
  useDemoWalk,
  useHeading,
  useSiteArrival,
  useStoryProgress,
} from '@/hooks';
import { arrival, location as locationService } from '@/services';
import { usePractice, usePreferences, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';

import { DemoWalkPanel } from './DemoWalkPanel';
import { PlacePicker } from './PlacePicker';
import { QuestHud, RewardToast } from './QuestHud';
import { QuestSheet } from './QuestSheet';
import { StorySequence } from './StorySequence';

/**
 * Height of the top HUD row, so the things below it can clear it by arithmetic
 * rather than by a number someone guessed and then had to keep guessing.
 */
const HUD_ROW_H = 60;

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
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { coordinate, demoMode } = useCurrentPosition({ watch: true });
  const deviceHeading = useHeading();
  const demo = useDemoWalk();
  const [follow, setFollow] = useState(true);
  const [showWisdomModal, setShowWisdomModal] = useState(false);

  // notify:false — Tīrtha's card already announces, and two banners for one
  // arrival is the app talking over itself.
  const { atSiteId, nearest: near } = useSiteArrival(coordinate, { notify: false });

  const activeSiteId = atSiteId ?? near?.site.id;
  const activeSignificance = activeSiteId ? arrival.significanceOf(activeSiteId) : null;

  const { preferences } = usePreferences();
  const { summary, recognise } = usePractice();
  const { quests, startQuest, completeTask, uncompleteTask } = useQuests();
  const story = useStoryProgress();

  const [showStory, setShowStory] = useState(false);
  const [showQuests, setShowQuests] = useState(false);
  const [showPlaces, setShowPlaces] = useState(false);
  const [reward, setReward] = useState<{ title: string; detail?: string } | null>(null);
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
  const flyTo = (longitude: number, latitude: number, distance: 'world' | 'close') => {
    cameraNonce.current += 1;
    setCamera({ longitude, latitude, distance, nonce: cameraNonce.current });
  };

  const standing = standingFor(summary.balance);

  /**
   * The quests belonging to where the player is, and everywhere else.
   *
   * Split rather than filtered: §15 asks for the locked ones to stay visible
   * with the way to them, because a quest you cannot see is not a reason to
   * walk anywhere.
   */
  const questsHere = atSiteId ? questsForSite(atSiteId, quests) : [];
  const questsElsewhere = quests.filter((q) => !questsHere.includes(q));
  const questsDoneHere = questsHere.filter((q) => q.progress?.status === 'completed').length;
  const questsOpenHere = questsHere.length - questsDoneHere;

  const placeHere = atSiteId
    ? placeStanding(story.hasRead(atSiteId), questsDoneHere, questsHere.length)
    : null;

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
  const openedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!preferences.autoWisdom || !story.hydrated) return;
    if (!atSiteId || openedFor.current === atSiteId) return;
    if (story.hasRead(atSiteId)) return;
    if (!arrival.hasSomethingToSay(atSiteId, preferences.wisdomTier)) return;

    openedFor.current = atSiteId;
    setShowStory(true);

    // The camera comes in with the story: attention has narrowed to one
    // monument, so the world should too. It goes back out when the story ends.
    const site = findSite(atSiteId);
    if (site) flyTo(site.coordinate.longitude, site.coordinate.latitude, 'close');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [atSiteId, preferences.autoWisdom, preferences.wisdomTier, story]);

  // Walking out re-arms it, so a genuine return can offer the place again.
  useEffect(() => {
    if (!atSiteId) openedFor.current = null;
  }, [atSiteId]);

  /**
   * Reading a place through is an act of attention, so it is recognised like
   * one — through the same capped ledger, at the same `wisdom` weight the
   * arrival card uses. There is no second currency: the wisdom the interface
   * shows is this balance. See core/progression.
   */
  const onStoryComplete = async (siteId: string) => {
    setShowStory(false);
    setCamera(null);
    await story.markRead(siteId);

    const before = summary.balance;
    const event = await recognise({ kind: 'wisdom', siteId });
    const site = findSite(siteId);

    setReward(
      event && event.amount > 0
        ? {
            title: '✦ Wisdom unlocked',
            detail: `${site?.name ?? 'This place'} · +${event.amount} wisdom · ${
              standingFor(before + event.amount).title
            }`,
          }
        : {
            // Honest about the cap rather than showing a number nobody was
            // given. The reading still happened and is still in the ledger.
            title: '✦ Wisdom unlocked',
            detail: `${site?.name ?? 'This place'} · you have done enough today`,
          },
    );
  };

  const onCompleteTask = async (questId: string, taskId: string) => {
    const quest = quests.find((q) => q.id === questId);
    if (quest && quest.progress?.status === 'not_started') await startQuest(questId);

    const result = await completeTask(questId, taskId);

    if (!result.questCompleted) {
      setReward({ title: '✓ Objective done' });
      return;
    }

    // Finishing the last quest at a place is the bigger event, and it is the
    // one the loop is built to end on.
    const wasLastHere = atSiteId ? questsOpenHere <= 1 && story.hasRead(atSiteId) : false;
    setReward(
      wasLastHere
        ? { title: '🏆 Place mastered', detail: findSite(atSiteId!)?.name }
        : { title: '🏆 Quest complete', detail: quest?.title },
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
        route={demo.route}
        camera={camera}
        onSelectSite={(id) => router.push(`/(main)/tirtha/site/${id}`)}
        topInset={insets.top}
      />

      {/*
        The HUD. Standing, then the controls — a game reads its own state first
        and its buttons second, and the level is the one thing on this screen
        that is about the player rather than about the ground.
      */}
      <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${standing.title}, level ${standing.level}, ${standing.wisdom} wisdom`}
          accessibilityHint="Back to Tīrtha"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace('/(main)/tirtha')
          }
          style={styles.standing}
        >
          <View style={styles.standingHead}>
            <Text variant="caption" tone="sandstone" uppercase style={styles.standingTitle}>
              {standing.title}
            </Text>
            <Text variant="caption" tone="muted">
              {standing.wisdom}
            </Text>
          </View>
          <View style={styles.wisdomTrack}>
            <View style={[styles.wisdomFill, { width: `${Math.round(standing.progress * 100)}%` }]} />
          </View>
        </Pressable>

        <View style={styles.topRight} pointerEvents="box-none">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go to a place"
            onPress={() => setShowPlaces(true)}
            style={styles.iconPill}
          >
            <Text variant="body">🧭</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={follow ? 'Stop following your position' : 'Follow your position'}
            accessibilityState={{ selected: follow }}
            onPress={() => setFollow((f) => !f)}
            style={[styles.iconPill, follow && styles.pillActive]}
          >
            <Text variant="body">{follow ? '◉' : '◎'}</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={demoMode ? 'Stop the demo walk' : 'Start the demo walk'}
            accessibilityHint="Walks a pilgrim through Lumbini using synthetic positions"
            accessibilityState={{ selected: demoMode }}
            onPress={demo.toggle}
            style={[styles.iconPill, demoMode && styles.pillActive]}
          >
            <Text variant="body">{demoMode ? '⏸' : '▶'}</Text>
          </Pressable>
        </View>
      </View>

      {/*
        The quest marker sits in the world, not in a bar — but on its own row
        under the top bar, clear of it. Everything floating on this screen has a
        lane: the bar across the top, the marker on the right beneath it, the
        toast above the dock at the bottom. They were all pinned to the top
        inset with hand-picked offsets, so the marker and the toast landed four
        points apart and drew over each other.
      */}
      <View style={[styles.worldControls, { top: insets.top + HUD_ROW_H }]} pointerEvents="box-none">
        <QuestHud
          available={questsOpenHere}
          completed={questsDoneHere}
          total={questsHere.length}
          pulse={questsOpenHere > 0 && !showStory}
          onPress={() => setShowQuests(true)}
        />

        {/*
          The two doors out of a place, in the same column as the quest marker
          rather than in a row along the bottom. As a bottom row they were 88
          points of dock — on top of the panel and the readout, the map was down
          to a third of the screen. A column of round buttons on the right costs
          the world nothing and keeps every action in one place.
        */}
        {atSiteId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={story.hasRead(atSiteId) ? 'What this place holds' : 'Hear this place'}
            accessibilityHint="Opens the passage for this site, with its sources"
            onPress={() => {
              // The guide is the same guide. Where a story is still unread, the
              // avatar opens it; once read, it opens the passage and its
              // sources — one control, two states, rather than two Buddhas.
              if (!story.hasRead(atSiteId)) {
                setShowStory(true);
                return;
              }
              setShowWisdomModal(true);
            }}
            style={styles.worldButton}
          >
            <GreetingMonk height={38} />
          </Pressable>
        ) : null}

        {atSiteId ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Witness this place"
            accessibilityHint="Opens Sākṣī to record what you can see here"
            onPress={() => openSakshi(atSiteId)}
            style={styles.worldButton}
          >
            <Text style={styles.worldIcon}>👁️</Text>
          </Pressable>
        ) : null}
      </View>

      {/*
        One column along the bottom rather than three absolutely-positioned
        pieces. The demo panel appears and disappears, and with fixed offsets
        every neighbour had to be told its height — the monk sat 80 points up
        whether or not there was anything under him. Stacked, the layout is the
        arithmetic.
      */}
      {/*
        No bottom inset here. This screen sits inside the tab navigator, and
        SurfaceTabBar already pads for the gesture bar — adding it again left a
        transparent band of map between the readout and the tab bar, with the
        readout floating above its own background.
      */}
      <View style={styles.dock} pointerEvents="box-none">
        {/* The toast rides above the dock, in the gap between the world and the
            readout, where nothing else is drawn. */}
        <View style={styles.toastSlot} pointerEvents="none">
          <RewardToast
            visible={reward !== null}
            title={reward?.title ?? ''}
            detail={reward?.detail}
            onHide={() => setReward(null)}
          />
        </View>

        {demo.active ? (
          <DemoWalkPanel
            step={demo.step}
            coordinate={coordinate}
            atSiteId={atSiteId}
            onRestart={demo.restart}
            onExit={demo.toggle}
          />
        ) : null}

        <View style={styles.readout}>
          {coordinate ? (
            near ? (
              <Text variant="body" center>
                {near.site.name}
                <Text variant="body" tone={atSiteId ? 'sandstone' : 'muted'}>
                  {'  ·  '}
                  {atSiteId ? 'you are here' : `${Math.round(near.distanceM)} m`}
                </Text>
                {/* How far through this place you are, where you already are.
                    A progress bar in a menu is a statistic; here it is a reason
                    to stay a moment longer. */}
                {placeHere && placeHere.questsTotal > 0 ? (
                  <Text variant="body" tone="muted">
                    {'  ·  '}
                    {placeHere.mastered
                      ? 'mastered'
                      : `${Math.round(placeHere.progress * 100)}%`}
                  </Text>
                ) : null}
              </Text>
            ) : (
              <Text variant="body" tone="secondary" center>
                Position acquired.
              </Text>
            )
          ) : (
            // Named rather than a spinner: a GPS fix under open sky can take
            // thirty seconds, and saying so is the difference between waiting
            // and assuming it is broken.
            <Text variant="body" tone="muted" center>
              {demoMode ? 'Setting out…' : 'Acquiring position…'}
            </Text>
          )}
        </View>
      </View>

      {/*
        Titled from where you actually are. "Buddha Wisdom · <nearest site>"
        named a passage after a place you might be 400 m from, and subtitled it
        with the distance to that same place — so the sheet announced a site and
        then said you were not at it. It says which of the two it is instead.
      */}
      <BottomSheet
        visible={showWisdomModal}
        onClose={() => setShowWisdomModal(false)}
        title={near ? near.site.name : 'Lumbini'}
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

          {/*
            The recorded narration, started on arrival when the reader has asked
            for that. Above the passage rather than below it: it is the thing
            that begins on its own, so the control that stops it has to be the
            first thing found, not something to scroll for.
          */}
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

          {/* Fallback Site Significance if user is not in reach of site */}
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
        atSiteId={atSiteId}
        here={questsHere}
        elsewhere={questsElsewhere}
        onCompleteTask={(questId, taskId) => void onCompleteTask(questId, taskId)}
        onUndoTask={(questId, taskId) => void uncompleteTask(questId, taskId)}
        onGoToSite={goToSite}
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
          }}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
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
  pillActive: { borderColor: colors.sandstone, backgroundColor: colors.surfaceSecondary },
  topRight: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0 },
  iconPill: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  standing: {
    // Shrinks rather than pushing the controls off a narrow screen. The three
    // pills are fixed at 44 each, so this is the piece that has to give.
    flexShrink: 1,
    minWidth: 96,
    maxWidth: 180,
    gap: 4,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  standingHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm },
  standingTitle: { fontWeight: '700', flexShrink: 1 },
  wisdomTrack: {
    height: 3,
    borderRadius: radii.full,
    backgroundColor: colors.surfaceSecondary,
    overflow: 'hidden',
  },
  wisdomFill: { height: 3, backgroundColor: colors.sandstone },
  /** The world actions, in one right-hand column clear of the top bar. */
  worldControls: { position: 'absolute', right: spacing.base, zIndex: 12, gap: spacing.sm, alignItems: 'center' },
  worldButton: {
    width: 58,
    height: 58,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
  },
  worldIcon: { fontSize: 24, lineHeight: 28 },
  toastSlot: { alignItems: 'center', paddingBottom: spacing.sm },
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  readout: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    paddingBottom: spacing.base,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
