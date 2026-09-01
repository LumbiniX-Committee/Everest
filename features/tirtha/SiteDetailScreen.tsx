import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Card, ConditionBadge, Divider, MetaRow, Screen, SourceBadge, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { NarrationPlayer, SiteListItem, VantageListItem } from '@/components/site';
import { SourceCard, SourceDetailSheet } from '@/components/source';
import { audioForSite, findSite, historicalImagesForSite, narrationForSite, questsForSite, resolveSources, sitesForParent, vantagesForSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database, location as locationService } from '@/services';
import { usePreferences } from '@/store';
import { SITE_VISIT_RADIUS_M } from '@/constants';
import { spacing } from '@/theme';
import { AskThisPlace } from './AskThisPlace';
import { depthFor, scriptureForSite } from './wisdom';
import type { Source } from '@/types';
import { distanceMeters, formatCoordinate, formatDistance } from '@/utils';

/**
 * A single heritage site.
 *
 * Provenance is shown before description, deliberately: a reader should know
 * whether they are looking at excavated evidence or a community report before
 * they read the claim, not after.
 */
export function SiteDetailScreen({ siteId }: { siteId: string }) {
  const router = useRouter();
  const site = findSite(siteId);
  const { coordinate } = useCurrentPosition();
  const { preferences } = usePreferences();
  const [openSource, setOpenSource] = useState<Source | null>(null);

  /**
   * Marks the register when the reader is actually standing here.
   *
   * Gated on distance rather than on opening the screen: "visited" has to mean
   * you were there. Reading about a site on the bus is not a visit, and a
   * register that says otherwise is worthless in an app built on first-hand
   * evidence.
   *
   * Failure is ignored. Missing a register mark is a small loss; an error
   * banner over a site's history for it would be a larger one.
   */
  useEffect(() => {
    if (!site || !coordinate) return;
    if (distanceMeters(coordinate, site.coordinate) > SITE_VISIT_RADIUS_M) return;
    void database.recordSiteVisit(site.id).catch(() => undefined);
  }, [site, coordinate]);

  if (!site) {
    return (
      <Screen>
        <EmptyState
          title="No such site"
          body="This site is not in the catalogue. It may have been removed, or the link may be stale."
          actionLabel="Back to Tīrtha"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const vantages = vantagesForSite(site.id);
  const childMonuments = sitesForParent(site.id);
  const localQuests = questsForSite(site.id);
  const sources = resolveSources(site.sourceIds ?? []);
  const historical = historicalImagesForSite(site.id);
  const audioSource = audioForSite(site.id);
  const narration = narrationForSite(site.id);
  const distanceM = coordinate ? distanceMeters(coordinate, site.coordinate) : null;

  const simulateHere = () => {
    const walk = locationService.demo.walkForSite(site.id);
    if (walk) locationService.demo.selectWalk(walk.id);
    locationService.setDemoMode(true);
    // Public-catalog sites do not have an invented walking route. Place the
    // demo walker at the recorded coordinate so location-driven UI is testable.
    locationService.demo.goToSite(site.id);
    router.push('/(main)/tirtha/map');
  };

  // One policy, shared with the arrival notification, so a person who asked for
  // less does not get more pushed at them from the other direction.
  const depth = depthFor(preferences.wisdomTier);
  const scripture = depth.scripture ? scriptureForSite(site) : [];

  return (
    <Screen scroll>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          Tīrtha
        </Text>
        <Text variant="title">{site.name}</Text>
        {site.nameNepali ? (
          <Text variant="body" tone="secondary">
            {site.nameNepali}
          </Text>
        ) : null}

        <View style={styles.badges}>
          <ConditionBadge status={site.condition} />
          <SourceBadge tier={site.sourceTier} />
        </View>
      </View>

      <Text variant="body" style={styles.description}>
        {depth.prose === 'short' ? site.summary : site.description}
      </Text>

      {childMonuments.length > 0 ? (
        <>
          <Divider />
          <View style={styles.storyBlock}>
            <Text variant="heading">{childMonuments.length} monuments in this complex</Text>
            <Text variant="body" tone="secondary">
              Open each monument for its own history, significance and simulation.
            </Text>
            {childMonuments.map((monument) => (
              <SiteListItem
                key={monument.id}
                site={{
                  ...monument,
                  distanceM: coordinate ? distanceMeters(coordinate, monument.coordinate) : null,
                }}
                onPress={() => router.push(`/(main)/tirtha/site/${monument.id}`)}
              />
            ))}
          </View>
        </>
      ) : null}

      {depth.facts && site.facts && site.facts.length > 0 ? (
        <View style={styles.facts}>
          {site.facts.map((fact) => (
            <MetaRow key={fact.label} label={fact.label} value={fact.value} />
          ))}
        </View>
      ) : null}

      {site.story && site.story.length > 0 ? (
        <>
          <Divider />
          <View style={styles.storyBlock}>
            <Text variant="heading">Stories within this place</Text>
            <Text variant="body" tone="secondary">
              Walk the complex monument by monument. Each chapter explains what to notice and why it matters.
            </Text>
            {site.story.map((chapter) => (
              <Card key={chapter.title} style={styles.storyCard}>
                {chapter.eyebrow ? (
                  <Text variant="label" tone="sandstone" uppercase>{chapter.eyebrow}</Text>
                ) : null}
                <Text variant="heading">{chapter.title}</Text>
                <Text variant="body" tone="secondary">{chapter.body}</Text>
              </Card>
            ))}
          </View>
        </>
      ) : null}

      <Button
        label="Walk this place in demo"
        variant="secondary"
        onPress={simulateHere}
      />

      {localQuests.length > 0 ? (
        <Button
          label={localQuests.length === 1 ? 'Try this place’s unique quest' : `Explore ${localQuests.length} monument quests`}
          variant="secondary"
          onPress={() => localQuests.length === 1
            ? router.push(`/(main)/tirtha/quests/${localQuests[0].id}`)
            : router.push('/(main)/tirtha/quests')}
        />
      ) : null}

      <Button
        label="Reflect from this place"
        variant="secondary"
        onPress={() =>
          router.push({
            pathname: '/(main)/dhamma/reflect',
            params: { siteId: site.id },
          } as never)
        }
      />

      {/* Never automatic here: opening a site's page is reading, and reading
          is not a reason to start talking. The arrival sheet is the surface
          that plays on its own, because reaching a place is a different act. */}
      {narration || audioSource ? (
        <>
          <Divider />
          <NarrationPlayer siteId={site.id} />
        </>
      ) : null}

      <Divider />

      <View style={styles.meta}>
        <MetaRow label="Position" value={formatCoordinate(site.coordinate)} />
        {site.elevation != null ? (
          <MetaRow label="Elevation" value={`${site.elevation} m`} />
        ) : null}
        {distanceM != null ? (
          <MetaRow label="Distance" value={formatDistance(distanceM, preferences.distanceUnit)} />
        ) : null}
      </View>

      {historical.length > 0 ? (
        <>
          <Divider />
          <View style={styles.sourceBlock}>
            <Text variant="heading">Then / Now</Text>
            <Text variant="body" tone="secondary">
              {historical.length === 1
                ? 'One historical image has been matched to this site.'
                : `${historical.length} historical images have been matched to this site.`}{' '}
              Compare them against the view today.
            </Text>
            <Button
              label="Compare across time"
              variant="secondary"
              onPress={() =>
                router.push({
                  pathname: '/(main)/tirtha/then-now/[siteId]',
                  params: { siteId: site.id },
                })
              }
            />
          </View>
        </>
      ) : null}

      {depth.sources && sources.length > 0 ? (
        <>
          <Divider />
          <View style={styles.sourceBlock}>
            <Text variant="heading">
              {sources.length === 1 ? 'Source' : 'Sources'}
            </Text>
            {/*
              The same SourceCard the Dhamma surface uses. A reader who has
              learned to read a citation on one surface can read it on the
              other — which is the entire reason the registry is shared.
            */}
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                onPress={() => setOpenSource(source)}
              />
            ))}
          </View>
        </>
      ) : null}

      {scripture.length > 0 ? (
        <>
          <Divider />
          <View style={styles.sourceBlock}>
            <Text variant="heading">In the canon</Text>
            <Text variant="body" tone="secondary">
              {scripture.length === 1
                ? 'This place is named in one canonical text the app carries in full.'
                : `This place is named in ${scripture.length} canonical texts the app carries in full.`}{' '}
              Ask about it on the Dhamma surface and the answer will cite them.
            </Text>
            {scripture.map((text) => (
              <View key={text.uid} style={styles.scripture}>
                <Text variant="body">{text.titleEn}</Text>
                <Text variant="body" tone="secondary">
                  {text.titlePi}
                </Text>
                <Text variant="caption" tone="muted">
                  {text.collection} · {text.segmentCount} passages · tr. {text.translator} · {text.licence}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {depth.ask ? (
        <>
          <Divider />
          <AskThisPlace site={site} />
        </>
      ) : null}

      <Divider />

      <View style={styles.vantageBlock}>
        <Text variant="heading">Vantage points</Text>
        {vantages.length === 0 ? (
          <Text variant="body" tone="secondary">
            No fixed viewpoint has been established here yet. Until one is surveyed, observations
            from this site cannot be compared over time.
          </Text>
        ) : (
          <View style={styles.vantageList}>
            {vantages.map((vantage) => (
              <VantageListItem
                key={vantage.id}
                vantage={vantage}
                distanceM={coordinate ? distanceMeters(coordinate, vantage.coordinate) : null}
                onPress={() =>
                  router.push({
                    pathname: '/(main)/sakshi/vantage',
                    params: { vantageId: vantage.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </View>

      <SourceDetailSheet source={openSource} onClose={() => setOpenSource(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  description: { paddingBottom: spacing.lg },
  facts: { paddingBottom: spacing.lg },
  scripture: {
    gap: spacing.xs,
    paddingVertical: spacing.sm,
  },
  meta: { paddingVertical: spacing.lg },
  sourceBlock: { paddingVertical: spacing.lg, gap: spacing.md },
  storyBlock: { paddingVertical: spacing.lg, gap: spacing.md },
  storyCard: { gap: spacing.sm },
  vantageBlock: { paddingTop: spacing.lg, gap: spacing.md },
  vantageList: { gap: spacing.md },
});
