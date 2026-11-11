import * as FileSystem from 'expo-file-system/legacy';

/**
 * Monument models, downloaded once and kept on the phone.
 *
 * They are served by the website rather than bundled, so they cost no app size
 * until someone opens one, and work offline after that.
 */
const BASE_URL = process.env.EXPO_PUBLIC_MODELS_URL?.trim() || 'https://saksi-beta.vercel.app/models';
const DIR = `${FileSystem.documentDirectory}models/`;

/** Model ids are generated, but never let one reach outside the models folder. */
const SAFE_ID = /^[a-z0-9-]+$/;

export async function isSaved(id: string): Promise<boolean> {
  if (!SAFE_ID.test(id)) return false;
  return (await FileSystem.getInfoAsync(`${DIR}${id}.gltf`)).exists;
}

/** The model's glTF text: from the phone if saved, otherwise downloaded and saved. */
export async function loadModel(id: string): Promise<string> {
  if (!SAFE_ID.test(id)) throw new Error('Unknown model');
  const path = `${DIR}${id}.gltf`;
  if (!(await FileSystem.getInfoAsync(path)).exists) {
    await FileSystem.makeDirectoryAsync(DIR, { intermediates: true }).catch(() => undefined);
    const partial = `${path}.download`;
    const result = await FileSystem.downloadAsync(`${BASE_URL}/${id}.gltf`, partial);
    if (result.status !== 200) {
      await FileSystem.deleteAsync(partial, { idempotent: true });
      throw new Error(`Download failed (${result.status})`);
    }
    // Moved into place only when complete, so a dropped connection can't leave a broken model behind.
    await FileSystem.moveAsync({ from: partial, to: path });
  }
  return FileSystem.readAsStringAsync(path);
}
