import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { Image, StyleSheet, View } from 'react-native';

import { Button, ConditionBadge, Divider, MetaRow, Screen, SourceBadge, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { NarrationPlayer, VantageListItem } from '@/components/site';
import { SourceCard, SourceDetailSheet } from '@/components/source';
import { audioForSite, findSite, historicalImagesForSite, narrationForSite, nowImageForSite, resolveSources, vantagesForSite } from '@/data';
import { useCurrentPosition } from '@/hooks';
import { database } from '@/services';
import { usePreferences } from '@/store';
import { SITE_VISIT_RADIUS_M } from '@/constants';
import { colors, spacing } from '@/theme';
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
  const sources = resolveSources(site.sourceIds ?? []);
  const historical = historicalImagesForSite(site.id);
  const currentImage = nowImageForSite(site.id);
  const audioSource = audioForSite(site.id);
  const narration = narrationForSite(site.id);
  const { preferences } = usePreferences();
  const distanceM = coordinate ? distanceMeters(coordinate, site.coordinate) : null;

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

      {currentImage ? (
        <Image
          source={typeof currentImage === 'string' ? { uri: currentImage } : currentImage}
          style={styles.hero}
          resizeMode="cover"
          accessibilityLabel={`${site.name} current view`}
        />
      ) : null}

      <Text variant="label" tone="muted" uppercase style={styles.sectionLabel}>About</Text>

      <Text variant="body" style={styles.description}>
        {site.description}
      </Text>

      {narration || audioSource ? (
        <>
          <Divider />
          <NarrationPlayer audioSource={audioSource} narration={narration} />
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

      <View style={styles.whyBlock}>
        <Text variant="heading">Why this matters</Text>
        <Text variant="body" tone="secondary">
          Continuous observations help conservation teams understand change between formal inspections.
          One careful frame from a known viewpoint can become part of a long-term record.
        </Text>
      </View>

      {vantages[0] ? (
        <Button
          label="Become a witness"
          block
          onPress={() => router.push({ pathname: '/(main)/sakshi/vantage', params: { vantageId: vantages[0].id } })}
        />
      ) : null}

      {sources.length > 0 ? (
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
  hero: { width: '100%', aspectRatio: 16 / 10, borderRadius: 12, backgroundColor: colors.surfaceSecondary, marginBottom: spacing.lg },
  sectionLabel: { marginBottom: spacing.sm },
  badges: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  description: { paddingBottom: spacing.lg },
  meta: { paddingVertical: spacing.lg },
  sourceBlock: { paddingVertical: spacing.lg, gap: spacing.md },
  vantageBlock: { paddingTop: spacing.lg, gap: spacing.md },
  vantageList: { gap: spacing.md },
  whyBlock: { paddingVertical: spacing.lg, gap: spacing.sm },
});
