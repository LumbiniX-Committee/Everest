import { createElement, forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/theme';

import { parsePanoramaEvent, type PanoramaViewHandle, type PanoramaViewProps } from './bridge';
import { buildPanoramaHtml } from './panoramaHtml';

/**
 * The web build's viewer: the same page in an iframe. It is not shipped, but it
 * lets the screen be walked and checked in a desktop browser.
 */
export const PanoramaView = forwardRef<PanoramaViewHandle, PanoramaViewProps>(
  function PanoramaView({ config, onEvent }, ref) {
    const frame = useRef<HTMLIFrameElement | null>(null);
    const html = useMemo(() => buildPanoramaHtml(config), [config]);
    const handler = useRef(onEvent);
    useEffect(() => {
      handler.current = onEvent;
    });

    useImperativeHandle(ref, () => ({
      send: (command) => frame.current?.contentWindow?.postMessage(JSON.stringify(command), '*'),
    }));

    useEffect(() => {
      const listen = (event: MessageEvent) => {
        if (event.source !== frame.current?.contentWindow) return;
        const message = parsePanoramaEvent(event.data);
        if (message) handler.current(message);
      };
      window.addEventListener('message', listen);
      return () => window.removeEventListener('message', listen);
    }, []);

    return (
      <View style={styles.frame}>
        {createElement('iframe', {
          ref: frame,
          srcDoc: html,
          title: 'Look around',
          style: { border: 0, width: '100%', height: '100%' },
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  frame: { flex: 1, overflow: 'hidden', backgroundColor: colors.backgroundDeep },
});
