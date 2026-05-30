import React from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';

// Self-contained stubs — no imports from RN internal library paths
// (those contain Flow types that break the webpack/babel pipeline)

export const GestureHandlerRootView = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const Swipeable = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const DrawerLayout = ({ children, style }) => (
  <View style={style}>{children}</View>
);

export const PanGestureHandler = ({ children }) => <>{children}</>;
export const TapGestureHandler = ({ children }) => <>{children}</>;
export const LongPressGestureHandler = ({ children }) => <>{children}</>;
export const PinchGestureHandler = ({ children }) => <>{children}</>;
export const RotationGestureHandler = ({ children }) => <>{children}</>;
export const FlingGestureHandler = ({ children }) => <>{children}</>;
export const NativeViewGestureHandler = ({ children }) => <>{children}</>;

export const RectButton = ({ children, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>
);
export const BorderlessButton = ({ children, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>
);
export const BaseButton = ({ children, onPress, style }) => (
  <TouchableOpacity onPress={onPress} style={style}>{children}</TouchableOpacity>
);

export const GestureDetector = ({ children }) => <>{children}</>;
export const Gesture = {
  Tap: () => ({ onStart: () => Gesture.Tap(), onEnd: () => Gesture.Tap(), runOnJS: () => Gesture.Tap() }),
  Pan: () => ({ onStart: () => Gesture.Pan(), onUpdate: () => Gesture.Pan(), onEnd: () => Gesture.Pan(), runOnJS: () => Gesture.Pan() }),
  Pinch: () => ({}),
  Rotation: () => ({}),
  Simultaneous: (...args) => args[0],
  Race: (...args) => args[0],
  Exclusive: (...args) => args[0],
};

export { ScrollView };

export const State = {
  UNDETERMINED: 0,
  FAILED: 1,
  BEGAN: 2,
  CANCELLED: 3,
  ACTIVE: 4,
  END: 5,
};

export const Directions = {
  RIGHT: 1,
  LEFT: 2,
  UP: 4,
  DOWN: 8,
};

export const GestureHandlerStateContext = React.createContext({});

export default {
  GestureHandlerRootView,
  Swipeable,
  DrawerLayout,
  PanGestureHandler,
  TapGestureHandler,
  State,
  Directions,
  Gesture,
  GestureDetector,
};