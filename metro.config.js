const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow importing .wasm files (expo-sqlite/web pulls in wa-sqlite.wasm).
config.resolver.assetExts = [...config.resolver.assetExts, 'wasm', 'sql'];

// wa-sqlite uses SharedArrayBuffer, which browsers only expose on
// cross-origin-isolated pages. Inject the required headers on every
// response from the Expo dev server.
config.server = {
  ...(config.server ?? {}),
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
      res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
      return middleware(req, res, next);
    };
  },
};

module.exports = config;
