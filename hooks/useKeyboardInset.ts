import { useEffect, useRef, useState } from 'react';
import { Dimensions, Keyboard, Platform } from 'react-native';

/**
 * How much bottom padding a pinned input needs to clear the keyboard.
 *
 * `KeyboardAvoidingView` is the obvious answer and it is not a reliable one
 * here. Its `padding` behaviour is an iOS assumption: on Android the platform is
 * supposed to resize the window instead, so the usual spelling is
 * `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` — which on Android
 * makes the component do *nothing at all* and quietly depends on the window
 * actually resizing. Under the edge-to-edge layout Android now requires, it
 * frequently does not, and the keyboard simply covers the pinned input: the
 * person types and cannot see a word of what they wrote.
 *
 * Rather than guess which platform resizes, this measures it.
 *
 * The window height while the keyboard is closed is the baseline. When the
 * keyboard opens, whatever the window lost is the part the system already
 * handled, and only the remainder needs padding:
 *
 *     inset = keyboardHeight − (baselineWindowHeight − currentWindowHeight)
 *
 * On iOS the window never shrinks, so the shrink term is 0 and the full keyboard
 * height is returned. On a resizing Android window the two terms cancel and it
 * returns ~0, so nothing is double-counted. On a non-resizing Android window it
 * returns the full height, which is the case that was broken. The same code
 * covers all three without a `Platform.OS` branch deciding the outcome, and it
 * needs no native configuration — so it takes effect on a reload rather than
 * requiring a new development build.
 */
export function useKeyboardInset(): number {
  const [inset, setInset] = useState(0);
  // The window height with no keyboard on screen. Re-read on every hide so
  // rotation and split-screen do not leave a stale baseline behind.
  const baseline = useRef(Dimensions.get('window').height);

  useEffect(() => {
    // iOS emits `will*` in step with the keyboard animation, which keeps the
    // input attached to it rather than jumping after it lands. Android only
    // emits `did*` dependably.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (event) => {
      const keyboardHeight = event.endCoordinates?.height ?? 0;
      const shrink = Math.max(0, baseline.current - Dimensions.get('window').height);
      setInset(Math.max(0, keyboardHeight - shrink));
    });

    const hide = Keyboard.addListener(hideEvent, () => {
      baseline.current = Dimensions.get('window').height;
      setInset(0);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return inset;
}
