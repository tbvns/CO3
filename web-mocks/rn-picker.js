// @react-native-picker/picker mock for Electron/web
import React from 'react';

const Picker = ({ selectedValue, onValueChange, children, style, enabled = true }) => (
  <select
    value={selectedValue}
    onChange={e => onValueChange && onValueChange(e.target.value, e.target.selectedIndex)}
    style={style}
    disabled={!enabled}
  >
    {children}
  </select>
);

Picker.Item = ({ label, value }) => <option value={value}>{label}</option>;

Picker.MODE_DIALOG = 'dialog';
Picker.MODE_DROPDOWN = 'dropdown';

export { Picker };
export default Picker;
