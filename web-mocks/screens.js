import React from 'react';
import { View } from 'react-native';

// Self-contained stubs — no imports from RN internal library paths

export const Screen = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const ScreenContainer = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const ScreenStack = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const ScreenStackHeaderConfig = () => null;
export const ScreenStackHeaderSubview = ({ children }) => <>{children}</>;
export const NativeScreen = ({ children, style }) => (
  <View style={style}>{children}</View>
);
export const NativeScreenContainer = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const enableScreens = () => {};
export const screensEnabled = () => false;

export default {
  Screen,
  ScreenContainer,
  ScreenStack,
  enableScreens,
  screensEnabled,
};