/**
 * Tearing down a location or heading watch without a console error.
 *
 * The error is `Call to function 'expoLocation.removeWatchAsync' has been
 * rejected`, and it is an unhandled promise rejection raised inside
 * expo-location rather than by anything here.
 *
 * `subscription.remove()` returns `undefined`. It synchronously calls
 * `Subscriber.unregisterCallback()`, which does this:
 *
 *     delete this.callbacks[id];
 *     ExpoLocation.removeWatchAsync(id);   // never awaited, never caught
 *
 * So the promise is created, dropped, and — when it rejects — surfaces as an
 * unhandled rejection. No try/catch at the call site can reach it, because the
 * call site is handed nothing to catch. The guard this replaces
 * (`const res = sub.remove() as any; if (res && res.catch) …`) was reading a
 * `.catch` off `undefined` every time: dead code that looked like a fix.
 *
 * Why it rejects at all is a race the library owns. Native location events are
 * already in flight when the watch is removed, and `Subscriber.trigger()`
 * handles an event whose callback has gone by calling `removeWatchAsync` a
 * second time — for a watch id the native side has by then forgotten. That
 * second call is the one that rejects. expo-location fixed exactly this shape
 * of double-removal in `watchMotionActivityAsync` (its `remove()` comments say
 * so) and did not apply the same fix to position or heading.
 *
 * The only place the rejection can be caught is where the promise is born, so
 * that is where this attaches — narrowly, to one function.
 *
 * Swallowing it loses nothing. A failed `removeWatchAsync` means the watch was
 * already gone or the module is unavailable; either way it is not actionable,
 * there is no fallback to run, and the watch is not left running — the callback
 * was already deleted on the JavaScript side before the call was made.
 */

type NativeLocationModule = {
  removeWatchAsync?: (watchId: number) => unknown;
};

let applied = false;

/**
 * Idempotent, and safe to call on every watch. Does nothing after the first
 * successful application, and nothing at all if the module's internals have
 * moved — a console warning is a much smaller problem than a crash taken while
 * trying to silence one.
 */
export function silenceWatchRemovalRejections(): void {
  if (applied) return;
  applied = true;

  try {
    // Deep import of an internal path, required lazily and behind a try. It is
    // the module object every call site shares, so wrapping it here covers both
    // watchPositionAsync and watchHeadingAsync. expo-location declares no
    // `exports` map, so the path resolves; if a future SDK changes that, this
    // throws here and is caught, leaving the library untouched.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const module = require('expo-location/build/ExpoLocation') as {
      default?: NativeLocationModule;
    };

    const native = module?.default;
    const original = native?.removeWatchAsync;
    if (!native || typeof original !== 'function') return;

    const wrapped = (watchId: number): unknown => {
      try {
        const result = original.call(native, watchId);
        if (result && typeof (result as Promise<unknown>).catch === 'function') {
          return (result as Promise<unknown>).catch(() => undefined);
        }
        return result;
      } catch {
        // A synchronous throw from the bridge. Same reasoning: nothing to do.
        return undefined;
      }
    };

    native.removeWatchAsync = wrapped;
  } catch {
    // Internals moved, or the native module is absent. Leave it alone.
  }
}

/**
 * Removes a watch subscription without letting its teardown throw.
 *
 * `remove()` is synchronous and returns nothing, so there is no promise to
 * chain — the asynchronous half is handled by
 * `silenceWatchRemovalRejections()` above. This only guards the synchronous
 * call, which can still throw if the native module has gone away.
 */
export function removeWatch(subscription: { remove: () => void } | null): void {
  if (!subscription) return;
  try {
    subscription.remove();
  } catch {
    // Already removed, or the module is unavailable. Either way it is gone.
  }
}
