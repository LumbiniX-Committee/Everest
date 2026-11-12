import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { BackBar, EmptyState } from '@/components/common';
import { ScanPlayer } from '@/components/models';
import { Button, Icon, Screen, Text } from '@/components/ui';
import { findPlace, findSite, SCANS } from '@/data';
import { useSafeBack } from '@/hooks';
import { application } from '@/services';
import { colors, radii, spacing } from '@/theme';

/**
 * One real scan. The player loads from Sketchfab when this screen opens; the
 * credit and the licence are shown here as well as in the player, and a scan
 * that is not openly licensed is never copied to the phone.
 */
export function ScanScreen({ scanId }: { scanId: string }) {
  const router = useRouter();
  const goBack = useSafeBack();
  const scan = SCANS.find((item) => item.id === scanId);
  if (!scan) {
    return (
      <Screen>
        <EmptyState title="No such scan" body="This scan is not in the list." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }
  const places = scan.targets
    .map((id) => {
      const site = findSite(id);
      if (site) return { id, name: site.name, kind: 'site' as const };
      const place = findPlace(id);
      return place ? { id, name: place.name, kind: 'place' as const } : null;
    })
    .filter((item): item is { id: string; name: string; kind: 'site' | 'place' } => item !== null);

  return (
    <Screen scroll>
      <BackBar />
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          {scan.kind}
        </Text>
        <Text variant="title" translate={false}>
          {scan.label}
        </Text>
        <Text variant="body" tone="secondary" translate={false}>
          {scan.note}
        </Text>
      </View>

      <ScanPlayer id={scan.id} />

      <View style={styles.tips}>
        <View style={styles.tip}>
          <Icon name="gesture-swipe" size={18} color={colors.primary} />
          <Text variant="caption" tone="secondary" style={styles.flex}>
            Drag to turn, pinch to zoom. Tap a surface to fly to it.
          </Text>
        </View>
        <View style={styles.tip}>
          <Icon name="virtual-reality" size={18} color={colors.primary} />
          <Text variant="caption" tone="secondary" style={styles.flex}>
            The player’s VR button works with a headset or a phone viewer, where your phone supports it.
          </Text>
        </View>
      </View>

      <View style={styles.credit}>
        <Text variant="label" tone="muted" uppercase>
          Credit
        </Text>
        <Text variant="bodyStrong" translate={false}>
          {`“${scan.title}” by ${scan.creator}`}
        </Text>
        <Text variant="caption" tone="secondary" translate={false}>
          {scan.openLicence ? `${scan.licence}, via Sketchfab` : 'Shown in Sketchfab’s player. Not offered for download, so it is not copied or kept on this phone.'}
        </Text>
        {scan.captured ? (
          <Text variant="caption" tone="secondary" translate={false}>
            {`Captured ${scan.captured}`}
          </Text>
        ) : null}
        <View style={styles.actions}>
          <Button label="Open on Sketchfab" variant="secondary" icon="open-in-new" onPress={() => void application.openExternal(scan.viewerUrl)} />
          <Button label="The creator" variant="quiet" onPress={() => void application.openExternal(scan.creatorUrl)} />
        </View>
      </View>

      {places.length ? (
        <View style={styles.places}>
          <Text variant="label" tone="muted" uppercase>
            The place
          </Text>
          {places.map((place) => (
            <Button
              key={place.id}
              label={place.name}
              variant="quiet"
              icon="map-marker-outline"
              onPress={() =>
                place.kind === 'site'
                  ? router.push({ pathname: '/(main)/tirtha/site/[siteId]', params: { siteId: place.id } })
                  : router.push({ pathname: '/(main)/tirtha/place/[placeId]', params: { placeId: place.id } })
              }
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { gap: spacing.xs, marginBottom: spacing.md },
  tips: { gap: spacing.xs, marginTop: spacing.md },
  tip: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
  credit: {
    gap: spacing.xxs,
    marginTop: spacing.lg,
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  places: { gap: spacing.xxs, marginTop: spacing.lg, marginBottom: spacing.xl },
});
