import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const CustomDropdown = ({
                          selectedValue,
                          onValueChange,
                          children,
                          style,
                          theme,
                          placeholder = 'Select an option',
                          maxHeight = 300,
                          disabled = false
                        }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [dropdownLayout, setDropdownLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const dropdownRef = useRef(null);

  const options = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && child.props) {
      return {
        label: child.props.label,
        value: child.props.value,
      };
    }
    return null;
  }).filter(Boolean);

  const selectedOption = options.find(option => option.value === selectedValue);
  const displayText = selectedOption ? selectedOption.label : placeholder;

  const handlePress = () => {
    if (disabled) return;

    dropdownRef.current?.measure((x, y, width, height, pageX, pageY) => {
      setDropdownLayout({
        x: pageX,
        y: pageY,
        width: width,
        height: height,
      });
      setIsVisible(true);
    });
  };

  const handleOptionPress = (value) => {
    onValueChange(value);
    setIsVisible(false);
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Calculate modal position
  const getModalStyle = () => {
    const { x, y, width, height } = dropdownLayout;
    const modalTop = y + height + 2; // Add small gap
    const modalLeft = x;

    // Calculate actual content height
    const itemHeight = 48; // Approximate height per item
    const actualContentHeight = Math.min(options.length * itemHeight, maxHeight);

    const adjustedTop = modalTop + actualContentHeight > screenHeight ?
      y - actualContentHeight - 2 : modalTop;
    const adjustedLeft = modalLeft + width > screenWidth ?
      screenWidth - width - 10 : modalLeft;

    return {
      position: 'absolute',
      top: Math.max(10, adjustedTop),
      left: Math.max(10, adjustedLeft),
      width: width,
      maxHeight: maxHeight,
    };
  };

  return (
    <>
      <TouchableOpacity
        ref={dropdownRef}
        style={[
          styles.dropdown,
          {
            backgroundColor: theme?.inputBackground || '#fff',
            borderColor: theme?.borderColor || '#ddd',
          },
          style,
          disabled && styles.disabled
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.dropdownText,
            !selectedOption && styles.placeholderText,
            {
              color: selectedOption ? (theme?.textColor || '#000') : (theme?.placeholderColor || '#999')
            }
          ]}
          numberOfLines={1}
        >
          {displayText}
        </Text>
        <View style={styles.iconContainer}>
          <Text style={[styles.dropdownIcon, { color: theme?.textColor || '#666' }]}>
            {isVisible ? '▲' : '▼'}
          </Text>
        </View>
      </TouchableOpacity>

      <Modal
        visible={isVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleClose}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleClose}
        >
          <View style={[
            styles.modalContent,
            {
              backgroundColor: theme?.cardBackground || '#fff',
              borderColor: theme?.borderColor || '#ddd',
            },
            getModalStyle()
          ]}>
            <ScrollView
              showsVerticalScrollIndicator={true}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.option,
                    selectedValue === option.value && [
                      styles.selectedOption,
                      { backgroundColor: theme?.primaryColor ? `${theme.primaryColor}20` : '#f0f8ff' }
                    ],
                    index === options.length - 1 && styles.lastOption,
                    { borderBottomColor: theme?.borderColor || '#eee' }
                  ]}
                  onPress={() => handleOptionPress(option.value)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: theme?.textColor || '#000' },
                      selectedValue === option.value && [
                        styles.selectedOptionText,
                        { color: theme?.primaryColor || '#007AFF' }
                      ],
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedValue === option.value && (
                    <Text style={[styles.checkmark, { color: theme?.primaryColor || '#007AFF' }]}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
  },
  disabled: {
    opacity: 0.5,
  },
  dropdownText: {
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    fontStyle: 'italic',
  },
  iconContainer: {
    marginLeft: 8,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  modalContent: {
    borderRadius: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
    borderWidth: 1,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
    borderBottomWidth: 1,
  },
  lastOption: {
    borderBottomWidth: 0,
  },
  selectedOption: {
    // Background color applied inline with theme
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  selectedOptionText: {
    fontWeight: '500',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

export default CustomDropdown;
