import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, View } from 'react-native';

import { Mascot } from '@/components/mascot';
import { BackBar, EmptyState, ProGate } from '@/components/common';
import { ModelView, ScanCards } from '@/components/models';
import { Button, Card, Screen, Text } from '@/components/ui';
import { findModel, scansFor } from '@/data';
import { useSafeBack } from '@/hooks';
import { application, models } from '@/services';
import { colors, radii, spacing } from '@/theme';

/** A monument in 3D, labelled as the schematic it is, with its features to explore. */
export function ModelScreen({ modelId }: { modelId: string }) {
  const goBack = useSafeBack();
  const model = findModel(modelId);
  const [gltf, setGltf] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [focus, setFocus] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!model) return;
    let active = true;
    setFailed(false);
    models
      .loadModel(model.id)
      .then((text) => active && setGltf(text))
      .catch(() => active && setFailed(true));
    return () => {
      active = false;
    };
  }, [model, attempt]);

  if (!model) {
    return (
      <Screen>
        <EmptyState title="No such model" body="There is no 3D view for this place." actionLabel="Back" onAction={goBack} />
      </Screen>
    );
  }

  const viewer = failed ? (
    <Card style={styles.gap}>
      <Text variant="body">The 3D view needs a connection the first time. After that it stays on this phone.</Text>
      <Button label="Try again" variant="secondary" onPress={() => setAttempt((n) => n + 1)} />
    </Card>
  ) : gltf ? (
    <ModelView model={model} gltf={gltf} focusIndex={focus} onHotspot={setFocus} />
  ) : (
    <Card>
      <Text variant="body" tone="secondary">
        Preparing the 3D view…
      </Text>
    </Card>
  );

  return (
    <Screen scroll>
      <BackBar />
      <View style={styles.carverRow}>
        <Mascot name="woodcarver" height={96} />
        <Text variant="caption" tone="secondary" style={styles.carverNote}>
          A schematic model: the shapes are drawn from photographs and published descriptions. Sizes that no source gives are estimates, and the points below say which.
        </Text>
      </View>
      <View style={styles.head}>
        <Text variant="label" tone="muted" uppercase>
          3D
        </Text>
        <Text variant="title" translate={false}>
          {model.title}
        </Text>
        <Text variant="caption" tone="seeking">
          Schematic model: shapes and proportions are approximate, built from photographs and published descriptions. Nothing here is measured.
        </Text>
      </View>

      {model.free ? (
        viewer
      ) : (
        <ProGate feature="3d-views" title="3D monument views" body="Pro opens 3D views of monuments across Nepal. Swayambhunath is free to try.">
          {viewer}
        </ProGate>
      )}

      {Platform.OS === 'android' && models.arIntentUrl(model.id, model.title) ? (
        <View style={styles.ar}>
          <Button
            label="View in your space"
            icon="cube-scan"
            variant="secondary"
            onPress={() => void Linking.openURL(models.arIntentUrl(model.id, model.title)!).catch(() => undefined)}
          />
          <Text variant="caption" tone="secondary">
            Places the model in the room through your camera, with Google’s Scene Viewer. It opens at its real size, so step back or pinch to shrink it.
          </Text>
        </View>
      ) : null}

      <View style={styles.scans}>
        <ScanCards scans={scansFor(...model.targets)} title="Real scans of this place" />
      </View>

      <View style={styles.list}>
        <Text variant="heading">What to look for</Text>
        {model.hotspots.map((spot, index) => (
          <Pressable
            key={spot.label}
            accessibilityRole="button"
            onPress={() => setFocus(index)}
            style={({ pressed }) => [styles.spot, focus === index && styles.spotSelected, pressed && styles.pressed]}
          >
            <View style={styles.badge}>
              <Text variant="bodyStrong" style={styles.badgeText}>
                {index + 1}
              </Text>
            </View>
            <View style={styles.spotText}>
              <Text variant="bodyStrong" translate={false}>
                {spot.label}
              </Text>
              <Text variant="body" tone="secondary" translate={false}>
                {spot.note}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={styles.sources}>
        <Text variant="label" tone="muted" uppercase>
          Sources
        </Text>
        {model.sources.map((source) => (
          <Button key={source.url} label={source.title} variant="quiet" onPress={() => void application.openExternal(source.url)} />
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  carverRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.sm },
  carverNote: { flex: 1 },
  head: { gap: spacing.xs, marginBottom: spacing.md },
  gap: { gap: spacing.sm },
  list: { gap: spacing.sm, marginTop: spacing.lg },
  ar: { gap: spacing.xs, marginTop: spacing.md },
  scans: { marginTop: spacing.lg },
  spot: { flexDirection: 'row', gap: spacing.md, padding: spacing.md, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  spotSelected: { borderColor: colors.borderStrong, backgroundColor: colors.surfaceSelected },
  pressed: { opacity: 0.7 },
  badge: { width: 28, height: 28, borderRadius: radii.full, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.accent },
  badgeText: { color: colors.onAccent },
  spotText: { flex: 1, gap: spacing.xxs },
  sources: { gap: spacing.xs, marginTop: spacing.lg, marginBottom: spacing.xl },
});
