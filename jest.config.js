/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  clearMocks: true,
  testMatch: ['<rootDir>/tests/native/**/*.test.ts?(x)'],
  setupFilesAfterEnv: ['<rootDir>/tests/native/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|@react-navigation/.*|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-gesture-handler)',
  ],
};
