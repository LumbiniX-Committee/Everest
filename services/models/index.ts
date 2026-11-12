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

/**
 * Opens a model in Google's Scene Viewer, which places it in the room through
 * the camera (Android with Google Play Services for AR). The model is the same
 * file the website serves. Without Scene Viewer, Android falls back to the
 * website's 3D page, which has its own AR button.
 */
export function arIntentUrl(id: string, title: string): string | null {
  if (!SAFE_ID.test(id)) return null;
  const file = encodeURIComponent(`${BASE_URL}/${id}.gltf`);
  const fallback = encodeURIComponent(`${BASE_URL.replace(/\/models$/, '')}/en/3d#${id}`);
  return (
    `intent://arvr.google.com/scene-viewer/1.0?file=${file}&mode=ar_preferred&title=${encodeURIComponent(title)}` +
    `#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${fallback};end;`
  );
}
