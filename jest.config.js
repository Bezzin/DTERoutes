module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '@env': '<rootDir>/__mocks__/@env.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-url-polyfill)/)',
  ],
};
