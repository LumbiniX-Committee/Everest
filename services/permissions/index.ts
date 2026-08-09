import { Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Camera } from 'expo-camera';
import { DeviceMotion, Magnetometer } from 'expo-sensors';

import type { PermissionKind, PermissionState, PermissionMap } from '@/types';

/**
 * Permission service.
 *
 * One shape for every permission, whatever module actually backs it, so screens
 * never branch on "is this the camera or the compass". Two rules hold
 * throughout:
 *
 *   1. Nothing is requested at launch. A permission is asked for at the moment
 *      the user reaches the feature that needs it, or from the onboarding
 *      screen where the reason has just been explained.
 *   2. A refusal is a valid outcome, never an error. Callers get a state and
 *      decide what to degrade to.
 */

/**
 * The subset of Expo's PermissionResponse we depend on. Declared structurally
 * so this file does not couple to any one module's re-export path.
 */
type ExpoPermissionResponse = {
  status: string;
  canAskAgain: boolean;
  granted: boolean;
};

/** Normalise Expo's response into our richer model. */
function fromExpo(kind: PermissionKind, res: ExpoPermissionResponse): PermissionState {
  if (res.status === 'granted') {
    return { kind, status: 'granted', canAskAgain: false };
  }
  if (res.status === 'undetermined') {
    return { kind, status: 'undetermined', canAskAgain: true };
  }
  // Denied. The OS tells us whether a further prompt is even possible.
  return {
    kind,
    status: res.canAskAgain ? 'denied' : 'blocked',
    canAskAgain: res.canAskAgain,
  };
}

function unavailable(kind: PermissionKind): PermissionState {
  return { kind, status: 'unavailable', canAskAgain: false };
}

/**
 * Motion is the awkward one. iOS gates DeviceMotion behind a real permission;
 * Android has no motion permission at all but the hardware may be missing. We
 * report "unavailable" only when there is genuinely no sensor to read.
 */
async function motionState(request: boolean): Promise<PermissionState> {
  try {
    const available = await Magnetometer.isAvailableAsync();
    if (!available) return unavailable('motion');
  } catch {
    return unavailable('motion');
  }

  if (Platform.OS !== 'ios') {
    // No runtime permission exists; the sensor answered, so we can use it.
    return { kind: 'motion', status: 'granted', canAskAgain: false };
  }

  try {
    const res = request
      ? await DeviceMotion.requestPermissionsAsync()
      : await DeviceMotion.getPermissionsAsync();
    return fromExpo('motion', res);
  } catch {
    return unavailable('motion');
  }
}

async function locationState(request: boolean): Promise<PermissionState> {
  try {
    const res = request
      ? await Location.requestForegroundPermissionsAsync()
      : await Location.getForegroundPermissionsAsync();
    return fromExpo('location', res);
  } catch {
    return unavailable('location');
  }
}

async function cameraState(request: boolean): Promise<PermissionState> {
  try {
    const res = request
      ? await Camera.requestCameraPermissionsAsync()
      : await Camera.getCameraPermissionsAsync();
    return fromExpo('camera', res);
  } catch {
    return unavailable('camera');
  }
}

/** Read the current status without showing any system dialog. */
export function check(kind: PermissionKind): Promise<PermissionState> {
  switch (kind) {
    case 'location':
      return locationState(false);
    case 'camera':
      return cameraState(false);
    case 'motion':
      return motionState(false);
  }
}

/**
 * Ask. Shows a system dialog only when one is actually possible — on a blocked
 * permission this resolves to the blocked state without any visible no-op.
 */
export function request(kind: PermissionKind): Promise<PermissionState> {
  switch (kind) {
    case 'location':
      return locationState(true);
    case 'camera':
      return cameraState(true);
    case 'motion':
      return motionState(true);
  }
}

export const ALL_KINDS: PermissionKind[] = ['location', 'camera', 'motion'];

/** Check every permission at once. Used to hydrate the store on resume. */
export async function checkAll(): Promise<PermissionMap> {
  const states = await Promise.all(ALL_KINDS.map(check));
  return Object.fromEntries(states.map((s) => [s.kind, s])) as PermissionMap;
}

/** The escape hatch for a blocked permission: hand them to the OS. */
export async function openSettings(): Promise<void> {
  await Linking.openSettings();
}

/** Copy for the permission primer. Kept beside the service so the two agree. */
export const PERMISSION_COPY: Record<
  PermissionKind,
  { title: string; reason: string; withoutIt: string }
> = {
  location: {
    title: 'Location',
    reason: 'Find nearby heritage sites and viewpoints.',
    withoutIt: 'You can still browse every site: the list just will not sort by distance.',
  },
  camera: {
    title: 'Camera',
    reason: "Compare today's view with historical imagery.",
    withoutIt: 'You can read observations others have recorded, but not add your own.',
  },
  motion: {
    title: 'Motion',
    reason: 'Help align your device with a fixed viewpoint.',
    withoutIt: 'Alignment falls back to written bearings instead of a live reticle.',
  },
};
