// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// expo-sqlite ships a WASM build for web; Metro must treat .wasm as an asset.
// expo-audio ships opus files; Metro must treat .opus as an asset.
// The damage detector's model files (.onnx now, .pte if we move to ExecuTorch)
// are bundled and require()d as assets, so Metro must not try to parse them.
config.resolver.assetExts.push('wasm', 'opus', 'onnx', 'pte');

// wa-sqlite needs SharedArrayBuffer, which requires cross-origin isolation.
config.server.enhanceMiddleware = (middleware) => (req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  return middleware(req, res, next);
};

// Exclude problematic directories from file watching (Windows permission issues)
config.watchman = {
  useWatchman: true,
  enableGlobSupport: true,
  ignoreNodeModules: false,
};

config.resolver.blockList = [
  /.*\.playwright-.*/,
  /node_modules\/\.playwright-.*/,
];

module.exports = config;
