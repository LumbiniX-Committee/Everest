import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState as RNAppState } from 'react-native';

import { permissions as permissionService } from '@/services';
import type { PermissionKind, PermissionMap, PermissionState } from '@/types';

/**
 * Permission state, shared app-wide.
 *
 * Held centrally for one reason: a user can leave for Settings, flip a switch,
 * and come back. Nothing in the app would notice unless someone is watching
 * foreground transitions — so this provider does, and re-checks on resume.
 */

const initialState = (kind: PermissionKind): PermissionState => ({
  kind,
  status: 'undetermined',
  canAskAgain: true,
});

const initialMap: PermissionMap = {
  location: initialState('location'),
  camera: initialState('camera'),
  motion: initialState('motion'),
};

type PermissionsContextValue = {
  /** False until the first check has come back. */
  hydrated: boolean;
  states: PermissionMap;
  /** Show a system prompt if one is possible; returns the resulting state. */
  request: (kind: PermissionKind) => Promise<PermissionState>;
  /** Silent re-read. */
  refresh: (kind?: PermissionKind) => Promise<void>;
  openSettings: () => Promise<void>;
};

const PermissionsContext = createContext<PermissionsContextValue | null>(null);

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [states, setStates] = useState<PermissionMap>(initialMap);
  const [hydrated, setHydrated] = useState(false);

  const refresh = useCallback(async (kind?: PermissionKind) => {
    if (kind) {
      const next = await permissionService.check(kind);
      setStates((prev) => ({ ...prev, [kind]: next }));
      return;
    }
    setStates(await permissionService.checkAll());
  }, []);

  useEffect(() => {
    let active = true;

    permissionService.checkAll().then((map) => {
      if (!active) return;
      setStates(map);
      setHydrated(true);
    });

    // Someone may grant in Settings and come back; re-read on every resume.
    const subscription = RNAppState.addEventListener('change', (status) => {
      if (status === 'active') void refresh();
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [refresh]);

  const request = useCallback(async (kind: PermissionKind) => {
    const next = await permissionService.request(kind);
    setStates((prev) => ({ ...prev, [kind]: next }));
    return next;
  }, []);

  const value = useMemo(
    () => ({ hydrated, states, request, refresh, openSettings: permissionService.openSettings }),
    [hydrated, states, request, refresh],
  );

  return <PermissionsContext.Provider value={value}>{children}</PermissionsContext.Provider>;
}

export function usePermissions(): PermissionsContextValue {
  const value = useContext(PermissionsContext);
  if (!value) throw new Error('usePermissions must be used inside <PermissionsProvider>');
  return value;
}

/** Narrowed accessor for a screen that cares about exactly one permission. */
export function usePermission(kind: PermissionKind) {
  const { states, request, refresh, openSettings, hydrated } = usePermissions();
  return useMemo(
    () => ({
      hydrated,
      state: states[kind],
      request: () => request(kind),
      refresh: () => refresh(kind),
      openSettings,
    }),
    [hydrated, states, kind, request, refresh, openSettings],
  );
}
