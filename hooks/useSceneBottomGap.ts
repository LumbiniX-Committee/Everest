import { useCallback, useRef, useState } from 'react';
import { Dimensions, type View } from 'react-native';

/**
 * How far a view's bottom edge already sits above the bottom of the window.
 *
 * `useKeyboardInset` measures the keyboard against the *window*, which is right
 * for a view that reaches the window's bottom edge and wrong for one that does
 * not. Both Dhamma chats render inside the tab navigator, so their scene ends
 * roughly 95 to 120 points above the window bottom, and padding by the whole
 * keyboard height left a dead band of exactly the tab bar's height between the
 * composer and the keys. That band is what the screenshots show.
 *
 * Measuring rather than subtracting a constant: the bar's height depends on the
 * safe area, on whether the sync banner is showing, and on the font scale. A
 * number typed here would be wrong on the first phone that disagreed.
 *
 * Usage:
 *
 *     const { ref, onLayout, gap } = useSceneBottomGap();
 *     <View ref={ref} onLayout={onLayout}
 *           style={{ paddingBottom: Math.max(0, keyboardInset - gap) }} />
 *
 * The measurement is of the view's own frame, so its internal padding cannot
 * feed back into it.
 */
export function useSceneBottomGap() {
  const ref = useRef<View>(null);
  const [gap, setGap] = useState(0);

  const onLayout = useCallback(() => {
    ref.current?.measureInWindow((_x, y, _width, height) => {
      if (!Number.isFinite(y) || !Number.isFinite(height)) return;
      const next = Math.max(0, Dimensions.get('window').height - (y + height));
      // Whole points only: a sub-pixel difference re-rendering on every layout
      // pass is a loop, not a measurement.
      setGap((current) => (Math.abs(current - next) < 1 ? current : Math.round(next)));
    });
  }, []);

  return { ref, onLayout, gap };
}
