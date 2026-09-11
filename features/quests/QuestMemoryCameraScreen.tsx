import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CameraView } from 'expo-camera';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { EmptyState } from '@/components/common';
import { Button, Icon, Screen, Text } from '@/components/ui';
import { areaForQuest, isVantageTask } from '@/data';
import { camera as cameraService, questMemories, location } from '@/services';
import { usePermission, usePreferences, useQuests } from '@/store';
import { colors, radii, spacing } from '@/theme';

export function QuestMemoryCameraScreen() {
  const router = useRouter();
  const { questId, taskId } = useLocalSearchParams<{ questId: string; taskId: string }>();
  const { hydrated, getQuestById, completeTask } = useQuests();
  const { preferences } = usePreferences();
  const { state: permission, request: requestCamera, openSettings } = usePermission('camera');
  const cameraRef = useRef<CameraView>(null);
  const live = useRef(true);
  const busyRef = useRef(false);
  const durablePhoto = useRef<string | undefined>(undefined);
  const [photoUri, setPhotoUri] = useState<string>();
  const [reflection, setReflection] = useState('');
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [timer, setTimer] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();
  const quest = getQuestById(questId);
  const task = quest?.tasks.find((item) => item.id === taskId);

  useEffect(() => {
    live.current = true;
    if (location.isDemoMode()) location.demo.pause();
    return () => { live.current = false; };
  }, []);
  useEffect(() => {
    if (permission.status === 'undetermined') void requestCamera();
  }, [permission.status, requestCamera]);

  if (!hydrated) return <Screen><Text>Loading camera…</Text></Screen>;
  if (!quest || !task || task.evidence !== 'photo' || isVantageTask(task)) {
    return <Screen><EmptyState title="Choose a memory activity" body="This camera is for your quest memories." actionLabel="Back" onAction={() => router.back()} /></Screen>;
  }

  const capture = async () => {
    if (!ready || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      if (timer) {
        for (let remaining = 5; remaining > 0; remaining -= 1) {
          if (!live.current) return;
          setCountdown(remaining);
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
      if (!live.current) return;
      setCountdown(0);
      const photo = await cameraRef.current?.takePictureAsync(cameraService.getCaptureOptions(preferences.photoQuality));
      if (!photo?.uri) throw new Error('No photo');
      durablePhoto.current = undefined;
      if (live.current) setPhotoUri(photo.uri);
    } catch {
      if (live.current) setError('The camera could not take that photo. Please try again.');
    } finally {
      busyRef.current = false;
      if (live.current) { setBusy(false); setCountdown(0); }
    }
  };

  const choose = async () => {
    if (busyRef.current) return;
    try {
      const uri = await questMemories.choosePhoto();
      if (uri && live.current) { durablePhoto.current = undefined; setPhotoUri(uri); setError(undefined); }
    } catch { setError('Could not open your photos. Please try again.'); }
  };

  const store = async () => {
    if (!photoUri || !reflection.trim() || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      // Keep the same durable file on retry; a completion failure must not lose
      // the photo or produce a second copy.
      durablePhoto.current ??= await questMemories.keepPhoto(photoUri);
      await questMemories.save({ questId, taskId, photoUri: durablePhoto.current, note: reflection.trim(), submittedAt: new Date().toISOString() });
      await completeTask(questId, taskId);
      if (live.current) setSaved(true);
    } catch {
      if (live.current) setError('Could not finish saving. Your photo and words are still here. Tap to retry.');
    } finally {
      busyRef.current = false;
      if (live.current) setBusy(false);
    }
  };

  return <Screen bleed edges={['top', 'bottom']} contentStyle={styles.frame}>
    <KeyboardAvoidingView style={styles.frame} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.preview}>
        {photoUri ? <Image source={{ uri: photoUri }} style={styles.camera} resizeMode="contain" /> : permission.status === 'granted' ?
          <CameraView ref={cameraRef} style={styles.camera} facing={facing} onCameraReady={() => setReady(true)} onMountError={() => setError('Camera unavailable. Close other camera apps and retry.')} /> :
          <View style={styles.gate}><Icon name="camera-outline" size={48} /><Text center>Allow camera to capture your memory</Text><Button label={permission.status === 'blocked' ? 'Open settings' : 'Allow camera'} onPress={permission.status === 'blocked' ? openSettings : requestCamera} /><Button label="Choose existing photo" variant="secondary" onPress={() => void choose()} /></View>}
        <View style={styles.hud}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back to quests" onPress={() => { if (!busy) router.back(); }} style={styles.round}><Icon name="close" /></Pressable>
          <View style={styles.title}><Text variant="caption" tone="sandstone">{areaForQuest(quest)?.name ?? 'Quest memory'}</Text><Text variant="heading" numberOfLines={2}>{task.title}</Text></View>
        </View>
        {countdown > 0 ? <View style={styles.countdown}><Text variant="title">{countdown}</Text></View> : null}
      </View>
      <ScrollView style={styles.sheet} contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
        {saved ? <>
          <Icon name="check-circle" size={36} color={colors.resolved} />
          <Text variant="heading">Memory saved · Activity complete</Text>
          <Text variant="caption" tone="secondary">Your photo and experience are saved on this phone. Upload will retry when a connection is available.</Text>
          <Button label="Back to adventures" onPress={() => router.back()} />
          <Button label="View my memories" variant="secondary" onPress={() => router.replace('/(main)/tirtha/memories')} />
        </> : photoUri ? <>
          <View style={styles.grip} />
          <Text variant="heading">How was it?</Text>
          <TextInput value={reflection} onChangeText={setReflection} placeholder="The taste, the feeling, your favourite detail…" placeholderTextColor={colors.textMuted} multiline maxLength={1000} editable={!busy} style={styles.reflection} accessibilityLabel="Your experience" />
          {error ? <Text tone="secondary">{error}</Text> : null}
          <Button label="Upload & save memory" loading={busy} disabled={busy || !reflection.trim()} onPress={() => void store()} />
          <Button label="Retake" variant="quiet" disabled={busy} onPress={() => { setPhotoUri(undefined); durablePhoto.current = undefined; setReady(false); }} />
        </> : <>
          <Text variant="caption" tone="secondary">{task.description}</Text>
          {task.safetyNote ? <Text variant="caption" tone="muted">{task.safetyNote}</Text> : null}
          {error ? <Text tone="secondary">{error}</Text> : null}
          <View style={styles.controls}>
            <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Choose existing photo" onPress={() => void choose()} style={styles.round}><Icon name="image-outline" /></Pressable>
            <Pressable disabled={busy || !ready} accessibilityRole="button" accessibilityLabel="Take memory photo" onPress={() => void capture()} style={[styles.shutter, (!ready || busy) && styles.dim]}><View style={styles.shutterCore} /></Pressable>
            <Pressable disabled={busy} accessibilityRole="button" accessibilityLabel="Switch front and back camera" onPress={() => { setReady(false); setFacing((value) => value === 'back' ? 'front' : 'back'); }} style={styles.round}><Icon name="camera-flip-outline" /></Pressable>
          </View>
          <Button label={timer ? '5-second timer on' : 'Turn on 5-second timer'} variant="quiet" disabled={busy} onPress={() => setTimer((value) => !value)} />
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  </Screen>;
}

const styles = StyleSheet.create({
  frame: { flex: 1, paddingHorizontal: 0, backgroundColor: colors.backgroundDeep },
  preview: { flex: 1, minHeight: 180 }, camera: { flex: 1, width: '100%' },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.md, paddingTop: spacing.xxl },
  hud: { position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center' },
  title: { flex: 1, padding: spacing.sm, backgroundColor: colors.overlay, borderRadius: radii.md },
  sheet: { flexGrow: 0, maxHeight: '52%', backgroundColor: colors.surface, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  sheetContent: { padding: spacing.lg, gap: spacing.sm },
  grip: { width: 40, height: 4, borderRadius: radii.full, backgroundColor: colors.borderStrong, alignSelf: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', gap: spacing.md },
  round: { width: 48, height: 48, borderRadius: radii.full, backgroundColor: colors.backgroundDeep, alignItems: 'center', justifyContent: 'center' },
  shutter: { width: 76, height: 76, borderRadius: radii.full, borderWidth: 2, borderColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  shutterCore: { width: 60, height: 60, borderRadius: radii.full, backgroundColor: colors.primary },
  dim: { opacity: 0.45 }, countdown: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  reflection: { minHeight: 88, maxHeight: 140, padding: spacing.md, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: radii.md, color: colors.textPrimary, textAlignVertical: 'top', backgroundColor: colors.background },
});
