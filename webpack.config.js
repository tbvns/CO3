const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// These node_modules contain JSX/Flow/TypeScript that must be compiled by Babel
const compileNodeModules = [
  'react-native-vector-icons',
  'react-native-ratings',
  'react-native-calendars',
  'react-native-linear-gradient',
  'react-native-reanimated',
  'react-native-toast-message',
  'react-native-swipe-gestures',
  '@react-native',
].join('|');

module.exports = {
  optimization: {
    moduleIds: 'named',
  },
  target: 'electron-renderer',

  entry: path.resolve(__dirname, 'index.web.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.web.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: new RegExp(`node_modules\/(?!(${compileNodeModules})\/).*`),
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react',
              '@babel/preset-typescript',
            ],
            envName: 'web',
          },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff2?|ttf|eot)$/,
        type: 'asset/resource',
      },
      {
        test: /\.m?js$/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  resolve: {
    alias: {
      'react-native$': 'react-native-web',
      'react-native-fs': path.resolve(__dirname, 'web-mocks/react-native-fs.js'),
      '@react-native-documents/picker': path.resolve(__dirname, 'web-mocks/picker.js'),
      'react-native-notify-kit': path.resolve(__dirname, 'web-mocks/notifee.js'),
      'react-native-sqlite-storage': path.resolve(__dirname, 'web-mocks/sqlite.js'),

      'react-native-webview': path.resolve(__dirname, 'web-mocks/webview.js'),
      'react-native-gesture-handler': path.resolve(__dirname, 'web-mocks/gesture-handler.js'),
      'react-native-screens': path.resolve(__dirname, 'web-mocks/screens.js'),
      '@react-native-community/slider': path.resolve(__dirname, 'web-mocks/slider.js'),
      // No native bridge available in Electron renderer
      'react-native-keychain': path.resolve(__dirname, 'web-mocks/keychain.js'),
      'react-native-background-actions': path.resolve(__dirname, 'web-mocks/background-actions.js'),
      'react-native-system-navigation-bar': path.resolve(__dirname, 'web-mocks/navigation-bar.js'),
      '@react-native-cookies/cookies': path.resolve(__dirname, 'web-mocks/cookies.js'),
      '@react-native-picker/picker': path.resolve(__dirname, 'web-mocks/rn-picker.js'),
      '@react-native-async-storage/async-storage': path.resolve(__dirname, 'web-mocks/async-storage.js'),
      'react-native-safe-area-context': path.resolve(__dirname, 'web-mocks/safe-area-context.js'),
      'react-native-linear-gradient': path.resolve(__dirname, 'web-mocks/linear-gradient.js'),
    },
    extensions: [
      '.web.tsx',
      '.web.ts',
      '.web.jsx',
      '.web.js',
      '.tsx',
      '.ts',
      '.jsx',
      '.js',
    ],
  },
  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'node_modules/react-native-vector-icons/Fonts'),
        to: path.resolve(__dirname, 'dist/fonts'),
      }],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
    new webpack.ProvidePlugin({
      setImmediate: ['setimmediate', 'default'],
      React: 'react',
    }),
    new webpack.DefinePlugin({
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
      __BUNDLE_START_TIME__: JSON.stringify(Date.now()),
      __VERSION__: JSON.stringify('0.80.1'),
      global: 'globalThis',
    }),
  ],
  devServer: {
    historyApiFallback: true,
    port: 3000,
    hot: true,
  },
};