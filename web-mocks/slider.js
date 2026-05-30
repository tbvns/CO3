import React from 'react';
const Slider = ({ value, onValueChange, minimumValue = 0, maximumValue = 1, step = 0, style }) => (
  <input
    type="range"
    min={minimumValue}
    max={maximumValue}
    step={step}
    defaultValue={value}
    onChange={e => onValueChange && onValueChange(parseFloat(e.target.value))}
    style={style}
  />
);
export default Slider;