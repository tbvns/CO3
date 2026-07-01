// react-native-linear-gradient mock for Electron/web
// Uses a real CSS linear-gradient so it actually looks correct
import React from 'react';
import { View } from 'react-native';

const LinearGradient = ({
  colors = [],
  start = { x: 0, y: 0 },
  end = { x: 1, y: 0 },
  locations,
  style,
  children,
  ...rest
}) => {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const angleDeg = Math.round(Math.atan2(dy, dx) * (180 / Math.PI)) + 90;

  const stops = colors
    .map((color, i) => {
      if (locations && locations[i] != null) {
        return `${color} ${Math.round(locations[i] * 100)}%`;
      }
      return color;
    })
    .join(', ');

  const gradientStyle = {
    backgroundImage: `linear-gradient(${angleDeg}deg, ${stops})`,
  };

  // react-native-web's View accepts a `style` prop that can include web-only
  // CSS properties, so we just merge them in.
  return (
    <View style={[style, gradientStyle]} {...rest}>
      {children}
    </View>
  );
};

export default LinearGradient;
