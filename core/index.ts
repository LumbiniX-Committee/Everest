/**
 * core/index.ts — the public API of the device-independent logic layer.
 *
 * Lane B: import everything you need from here, e.g.
 *
 *   import { MeritLedger, awardResurvey, GeofenceWatcher, toCoords } from '@/core';
 *
 * `@/core` resolves through the app's `@/*` path alias. Do not reach into
 * `core/<module>/...` directly — this barrel is the contract, and it is the
 * only surface guaranteed to stay stable. See core/INTEGRATION.md for wiring
 * recipes for each module.
 *
 * Everything re-exported here is pure TypeScript: no react, no react-native, no
 * network. It computes; the app decides what to render and when to persist.
 */

// --- Shared vocabulary: domain types, geo primitives, the merit table --------
export * from '../shared/types.ts';
export * from '../shared/geo.ts';
export * from '../shared/merit.ts';

// --- Merit: append-only ledger, daily cap, earning rules ---------------------
export * from './merit/ledger.ts';
export * from './merit/cap.ts';
export * from './merit/rules.ts';

// --- Map: proximity/darśana geofencing and clockwise pradakṣiṇā --------------
export * from './map/geofence.ts';
export * from './map/pradakshina.ts';

// --- Quests: availability, stillness, observation riddles --------------------
export * from './quests/registry.ts';
export * from './quests/stillness.ts';
export * from './quests/riddles.ts';

// --- Session: close ritual, notification suppression ------------------------
export * from './session/closeRitual.ts';
export * from './session/notifications.ts';

// --- Chaityāvalī register and directed dāna ---------------------------------
export * from './chaityavali/register.ts';
export * from './dana/allocation.ts';

// --- Unpunishing copy (riddle hints) ----------------------------------------
export * from './copy/failure-lines.ts';

// --- The coordinate seam: {latitude,longitude} <-> {lat,lon} -----------------
export * from './adapters/coords.ts';
