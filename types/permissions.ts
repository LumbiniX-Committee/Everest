/**
 * Permission model.
 *
 * Deliberately richer than a boolean. The difference between "denied" (ask
 * again) and "blocked" (the OS will no longer show a prompt — send them to
 * Settings) determines what the UI can offer, and getting it wrong strands the
 * user in a button that silently does nothing.
 */
export type PermissionKind = 'location' | 'camera' | 'motion';

export type PermissionStatus =
  /** Never asked. */
  | 'undetermined'
  /** Asked, and the user said yes. */
  | 'granted'
  /** Asked, the user said no, but the OS will prompt again. */
  | 'denied'
  /** The OS will not prompt again. Only Settings can change this. */
  | 'blocked'
  /** The device or platform has no such capability. */
  | 'unavailable';

export type PermissionState = {
  kind: PermissionKind;
  status: PermissionStatus;
  /** True when a request would show a system dialog. */
  canAskAgain: boolean;
};

export type PermissionMap = Record<PermissionKind, PermissionState>;

/** True when the feature gated by this permission can run right now. */
export function isUsable(state: PermissionState | undefined): boolean {
  return state?.status === 'granted';
}

/** True when showing a "Grant" button would actually produce a system prompt. */
export function canPrompt(state: PermissionState | undefined): boolean {
  if (!state) return false;
  if (state.status === 'unavailable' || state.status === 'granted') return false;
  return state.canAskAgain;
}

/** True when the only remaining route is the OS Settings app. */
export function needsSettings(state: PermissionState | undefined): boolean {
  return state?.status === 'blocked';
}
