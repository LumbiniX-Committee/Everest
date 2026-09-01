import { useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import * as FileSystem from 'expo-file-system/legacy';
import { Image, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/common';
import { Button, Screen, Text } from '@/components/ui';
import { camera as cameraService, database } from '@/services';
import { usePermission, usePreferences } from '@/store';
import { useQuests } from '@/store/quests';
import { colors, radii, spacing } from '@/theme';

/**
 * A casual quest camera, intentionally separate from Sākṣī's aligned vantage
 * instrument. It has no compass, reticle or observation record: it only saves
 * a personal memory tied to the quest task.
 */
export function QuestMemoryCameraScreen() {
  const router = useRouter();
  const { questId, taskId } = useLocalSearchParams<{ questId: string; taskId: string }>();
  const { getQuestById, completeTask } = useQuests();
  const { preferences } = usePreferences();
  const { state: permission, request: requestCamera, openSettings } = usePermission('camera');
  const cameraRef = useRef<CameraView>(null);
  const [photoUri, setPhotoUri] = useState<string>();
  const [saving, setSaving] = useState(false);

  const quest = getQuestById(questId);
  const task = quest?.tasks.find((item) => item.id === taskId);
  if (!quest || !task || task.evidence !== 'photo') {
    return <Screen><EmptyState title="Memory task not found" body="Return to the quest and choose a photo task." actionLabel="Back" onAction={() => router.back()} /></Screen>;
  }

  if (permission.status !== 'granted') {
    return (
      <Screen><View style={styles.gate}>
        <Text variant="title" center>Allow the Memory Camera</Text>
        <Text variant="body" tone="secondary" center>This camera saves a personal quest memory. It does not make a Sākṣī vantage observation.</Text>
        <Button label={permission.status === 'blocked' ? 'Open settings' : 'Allow camera'} onPress={permission.status === 'blocked' ? openSettings : requestCamera} />
        <Button label="Back" variant="quiet" onPress={() => router.back()} />
      </View></Screen>
    );
  }

  const capture = async () => {
    const photo = await cameraRef.current?.takePictureAsync(cameraService.getCaptureOptions(preferences.photoQuality));
    if (photo?.uri) setPhotoUri(photo.uri);
  };

  const store = async () => {
    if (!photoUri || saving) return;
    setSaving(true);
    try {
      const directory = `${FileSystem.documentDirectory}quest-memories/`;
      const destination = `${directory}${questId}-${taskId}-${Date.now()}.jpg`;
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      await FileSystem.copyAsync({ from: photoUri, to: destination });
      await database.saveQuestSubmission({ questId, taskId, photoUri: destination, submittedAt: new Date().toISOString() });
      const result = await completeTask(questId, taskId);
      router.replace(result.questCompleted
        ? { pathname: '/(main)/tirtha/quests/completed/[questId]', params: { questId } }
        : { pathname: '/(main)/tirtha/quests/[questId]', params: { questId } });
    } finally { setSaving(false); }
  };

  return (
    <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
      {photoUri ? <Image source={{ uri: photoUri }} style={styles.camera} resizeMode="cover" /> : <CameraView ref={cameraRef} style={styles.camera} facing="back" />}
      <View style={styles.hud}><Text variant="label" uppercase style={styles.hudText}>Quest memory · {task.title}</Text><Button label="Back" variant="quiet" onPress={() => router.back()} /></View>
      <View style={styles.controls}>
        <Text variant="caption" tone="secondary" center>{photoUri ? 'Keep this moment, or take it again.' : 'This is a personal memory camera, not an aligned Sākṣī witness capture.'}</Text>
        {photoUri ? <View style={styles.actions}><Button label="Retake" variant="secondary" onPress={() => setPhotoUri(undefined)} /><Button label={saving ? 'Storing…' : 'Store in Memories'} disabled={saving} loading={saving} onPress={() => void store()} /></View> : <Pressable style={styles.shutter} onPress={() => void capture()} accessibilityRole="button" accessibilityLabel="Take memory photograph"><View style={styles.shutterCore} /></Pressable>}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  frame: { paddingHorizontal: 0, backgroundColor: colors.textPrimary }, camera: { flex: 1, width: '100%' }, gate: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.base }, hud: { position: 'absolute', top: spacing.lg, left: spacing.base, right: spacing.base, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, hudText: { color: colors.surface }, controls: { padding: spacing.lg, gap: spacing.md, backgroundColor: colors.background, alignItems: 'center' }, shutter: { width: 76, height: 76, borderRadius: radii.full, borderWidth: 2, borderColor: colors.sandstone, alignItems: 'center', justifyContent: 'center' }, shutterCore: { width: 60, height: 60, borderRadius: radii.full, backgroundColor: colors.sandstone }, actions: { alignSelf: 'stretch', gap: spacing.sm },
});
