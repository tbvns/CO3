module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  env: {
    web: {
      plugins: ['react-native-web'],
    },
  },
};