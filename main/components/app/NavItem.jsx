import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const NavItem = ({ icon, label, active, theme, onPress }) => {
  return (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Icon
        name={icon}
        size={24}
        color={active ? theme.primaryColor : theme.secondaryTextColor}
      />
      <Text
        style={[
          styles.navLabel,
          { color: active ? theme.primaryColor : theme.secondaryTextColor },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  navItem: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  navLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});

export default NavItem;
