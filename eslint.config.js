// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // eslint-config-expo carries `import/resolver` in its legacy `default.js`
    // but not in `flat.js`, so under the flat config import/no-unresolved falls
    // back to a bare node resolver that does not know React Native's platform
    // extensions. That is why `expo lint` reported expo-audio as unresolvable
    // while `tsc` and a direct `eslint` run both resolved it: same code, two
    // different resolvers.
    //
    // Restoring the extension list makes the two agree, and makes ESLint
    // resolve modules the way the bundler and the compiler actually do.
    settings: {
      'import/extensions': [
        '.js',
        '.jsx',
        '.mjs',
        '.cjs',
        '.ts',
        '.tsx',
        '.d.ts',
        '.android.js',
        '.android.jsx',
        '.android.ts',
        '.android.tsx',
        '.ios.js',
        '.ios.jsx',
        '.ios.ts',
        '.ios.tsx',
        '.native.js',
        '.native.jsx',
        '.native.ts',
        '.native.tsx',
        '.web.js',
        '.web.jsx',
        '.web.ts',
        '.web.tsx',
      ],
      'import/resolver': {
        node: {
          extensions: [
            '.js',
            '.jsx',
            '.mjs',
            '.cjs',
            '.ts',
            '.tsx',
            '.d.ts',
            '.android.js',
            '.android.ts',
            '.android.tsx',
            '.ios.js',
            '.ios.ts',
            '.ios.tsx',
            '.native.js',
            '.native.ts',
            '.native.tsx',
            '.web.js',
            '.web.ts',
            '.web.tsx',
          ],
        },
      },
    },
  },
  {
    ignores: ['dist/*'],
  },
]);
