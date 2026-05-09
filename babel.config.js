module.exports = function (api) {
  api.cache(true);
  const isProduction = process.env.BABEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'react' }]],
    plugins: [
      // Strip all console.* calls except console.error in production builds.
      // Errors still surface so we can debug crashes via store-side bug reports.
      ...(isProduction
        ? [['transform-remove-console', { exclude: ['error', 'warn'] }]]
        : []),
      'react-native-worklets/plugin',
    ],
  };
};
