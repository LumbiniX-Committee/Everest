import * as FileSystem from 'expo-file-system/legacy';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { Linking } from 'react-native';
import type { Coordinate, QuestSubmission } from '@/types';
import { saveQuestSubmission } from './database';
import { syncData } from './supabase/sync';

export async function choosePhoto(): Promise<string | undefined> {
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.9 });
  return result.canceled ? undefined : result.assets[0]?.uri;
}

export async function keepPhoto(uri: string): Promise<string> {
  const directory = `${FileSystem.documentDirectory}quest-memories/`;
  await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
  const destination = `${directory}${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  // Library photos may be PNG or HEIC; encode JPEG before assigning its file
  // extension so the cloud upload's content type matches the actual bytes.
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const photo = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.9 });
  await FileSystem.copyAsync({ from: photo.uri, to: destination });
  return destination;
}

export async function save(submission: QuestSubmission): Promise<void> {
  await saveQuestSubmission(submission);
  // The durable local memory is available immediately, even without signal.
  void syncData().catch(() => undefined);
}

export function walkingDirections(destination: Coordinate): Promise<unknown> {
  return Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=walking`);
}
