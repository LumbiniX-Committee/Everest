// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite ships a WASM build for web; Metro must treat .wasm as an asset.
// expo-audio ships opus files; Metro must treat .opus as an asset.
config.resolver.assetExts.push('wasm', 'opus');

// wa-sqlite needs SharedArrayBuffer, which requires cross-origin isolation.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

module.exports = config;
