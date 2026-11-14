import { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { WebView } from 'react-native-webview';

import { colors } from '@/theme';

import { parsePanoramaEvent, type PanoramaViewHandle, type PanoramaViewProps } from './bridge';
import { buildPanoramaHtml } from './panoramaHtml';

/** The 360° viewer, in a WebView. The page is rebuilt only when the panorama changes. */
export const PanoramaView = forwardRef<PanoramaViewHandle, PanoramaViewProps>(function PanoramaView({ config, onEvent }, ref) {
  const web = useRef<WebView>(null);
  const html = useMemo(() => buildPanoramaHtml(config), [config]);

  useImperativeHandle(ref, () => ({
    send: (command) => {
      web.current?.injectJavaScript(`window.saksi && window.saksi.command(${JSON.stringify(command)}); true;`);
    },
  }));

  return (
    <WebView
      ref={web}
      // The photograph is fetched cross-origin as a WebGL texture; Commons
      // serves it with `Access-Control-Allow-Origin: *`, so no base URL is needed.
      source={{ html }}
      originWhitelist={['*']}
      javaScriptEnabled
      scrollEnabled={false}
      bounces={false}
      overScrollMode="never"
      textZoom={100}
      style={styles.web}
      onMessage={(event) => {
        const message = parsePanoramaEvent(event.nativeEvent.data);
        if (message) onEvent(message);
      }}
      onError={() => onEvent({ type: 'error', reason: 'webview' })}
    />
  );
});

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: colors.backgroundDeep },
});
