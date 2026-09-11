/** @type {import('jest').Config} */
const jestExpoPreset = require('jest-expo/jest-preset');

module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  testMatch: ['<rootDir>/tests/native/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/native/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    ...jestExpoPreset.transform,
    // jest-expo's default asset extension list (mirroring Metro's) does not
    // include .opus, which data/audio.ts requires for site narration. Reuse
    // the same asset transformer the other audio formats already go through.
    '^.+\\.opus$': require.resolve('jest-expo/src/preset/assetFileTransformer.js'),
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|@react-navigation/.*|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-gesture-handler)',
  ],
};
