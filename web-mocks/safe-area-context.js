// react-native-safe-area-context mock for Electron/web
// Safe areas are an iOS/Android concept — on desktop everything is zero insets
import React from 'react';
import { View } from 'react-native';

const NO_INSETS = { top: 0, right: 0, bottom: 0, left: 0 };

export const SafeAreaProvider = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const SafeAreaView = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const SafeAreaConsumer = ({ children }) => children(NO_INSETS);

export const SafeAreaInsetsContext = React.createContext(NO_INSETS);

export const useSafeAreaInsets = () => NO_INSETS;
export const useSafeAreaFrame = () => ({ x: 0, y: 0, width: window.innerWidth, height: window.innerHeight });

export const initialWindowMetrics = {
  insets: NO_INSETS,
  frame: { x: 0, y: 0, width: 0, height: 0 },
};

export default {
  SafeAreaProvider,
  SafeAreaView,
  SafeAreaConsumer,
  SafeAreaInsetsContext,
  useSafeAreaInsets,
  useSafeAreaFrame,
  initialWindowMetrics,
};
