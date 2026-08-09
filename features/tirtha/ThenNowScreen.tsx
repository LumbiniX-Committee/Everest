import { useState } from 'react';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { Button, Chip, Divider, Screen, Text } from '@/components/ui';
import { EmptyState } from '@/components/common';
import { SourceCard } from '@/components/source';
import { ThenNowCompare } from '@/components/thennow';
import { findSite, findSource, historicalImagesForSite, nowImageForSite, vantagesForSite } from '@/data';
import { spacing } from '@/theme';

/**
 * Then / Now.
 *
 * The screen that carries the product's central claim: this is the same place,
 * seen across time. Everything here is subordinate to the comparison itself,
 * which is why the frame sits above the fold and the metadata below it.
 *
 * When a site has more than one historical record the chips switch between
 * them, rather than stacking several comparisons down the page. Two frames on
 * one screen invite comparing the two historical images with each other, which
 * is not the comparison this screen is for.
 */
export function ThenNowScreen({ siteId }: { siteId: string }) {
  const router = useRouter();
  const site = findSite(siteId);
  const images = historicalImagesForSite(siteId);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!site) {
    return (
      <Screen>
        <EmptyState
          title="No such site"
          body="This site is not in the catalogue."
          // Just "Back": this screen is now reached from Sākṣī as well as
          // Tīrtha, and naming the wrong surface is worse than naming none.
          actionLabel="Back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  if (images.length === 0) {
    return (
      <Screen scroll>
        <Header name={site.name} />
        <EmptyState
          title="No historical record yet"
          body={`Nothing in the archive has been matched to ${site.name}. When an image is found and its viewpoint confirmed, the comparison will appear here.`}
          actionLabel="Back to the site"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const selected = images.find((image) => image.id === selectedId) ?? images[0];
  const source = findSource(selected.sourceId);
  const nowImage = nowImageForSite(siteId);
  const vantage = selected.vantageId
    ? vantagesForSite(siteId).find((v) => v.id === selected.vantageId)
    : undefined;

  return (
    <Screen scroll>
      <Header name={site.name} />

      <ThenNowCompare
        then={{
          image: selected.image,
          date: selected.date,
          placeholderNote: selected.caption,
          tier: selected.evidenceTier,
        }}
        now={{
          image: nowImage,
          date: 'Today',
          placeholderNote:
            'Your own photograph appears here once you have witnessed this site from the fixed viewpoint.',
        }}
      />

      {images.length > 1 ? (
        <View style={styles.chips}>
          {images.map((image) => (
            <Chip
              key={image.id}
              label={image.date}
              selected={image.id === selected.id}
              onPress={() => setSelectedId(image.id)}
            />
          ))}
        </View>
      ) : null}

      <Text variant="body" style={styles.caption}>
        {selected.caption}
      </Text>

      {/*
        The qualifier is not optional and not tucked away. Two photographs from
        slightly different positions can imply a change that is only a change of
        angle, and a reader who has not been told that will read the difference
        as history.
      */}
      {!selected.viewpointConfirmed ? (
        <View style={styles.qualifier}>
          <Text variant="label" tone="seeking" uppercase>
            Approximate viewpoint
          </Text>
          <Text variant="caption" tone="secondary">
            The historical image was not made from a surveyed point. Differences near the edges of
            the frame may be a change of angle rather than a change on the ground.
          </Text>
        </View>
      ) : null}

      <Divider />

      {source ? (
        <View style={styles.block}>
          <Text variant="label" tone="muted" uppercase>
            Source
          </Text>
          <SourceCard source={source} />
        </View>
      ) : null}

      {vantage ? (
        <>
          <Divider />
          <View style={styles.block}>
            <Text variant="heading">Add today&apos;s frame</Text>
            <Text variant="body" tone="secondary">
              {vantage.label} is the fixed viewpoint for this comparison. Standing there and
              recording what you see is what extends the series.
            </Text>
            <Button
              label="Witness this site"
              onPress={() =>
                router.push({
                  pathname: '/(main)/sakshi/vantage',
                  params: { vantageId: vantage.id },
                })
              }
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

function Header({ name }: { name: string }) {
  return (
    <View style={styles.head}>
      <Text variant="label" tone="muted" uppercase>
        Then / Now
      </Text>
      <Text variant="title">{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { paddingTop: spacing.lg, paddingBottom: spacing.lg, gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.base },
  caption: { marginTop: spacing.base },
  qualifier: { marginTop: spacing.base, gap: spacing.xs },
  block: { paddingVertical: spacing.lg, gap: spacing.md },
});
