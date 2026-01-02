import React, { useEffect, useState } from 'react';
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const SideMenu = ({
  isOpen,
  onClose,
  theme,
  setTheme,
  isIncognitoMode,
  toggleIncognitoMode,
  viewMode,
  setViewMode,
  currentTheme,
}) => {
  const [localTheme, setLocalTheme] = useState(theme);
  const [localIncognito, setLocalIncognito] = useState(isIncognitoMode);
  const [localViewMode, setLocalViewMode] = useState(viewMode);

  useEffect(() => {
    setLocalTheme(theme);
    setLocalIncognito(isIncognitoMode);
    setLocalViewMode(viewMode);
  }, [theme, isIncognitoMode, viewMode]);

  const getThemeIcon = () => {
    switch (localTheme) {
      case 'light':
        return 'wb-sunny';
      case 'dark':
        return 'brightness-3';
      case 'black':
        return 'brightness-1';
      default:
        return 'wb-sunny';
    }
  };

  const handleThemeChange = newTheme => {
    const previousTheme = localTheme;
    setLocalTheme(newTheme);

    try {
      if (setTheme) setTheme(newTheme);
    } catch (error) {
      setLocalTheme(previousTheme);
    }
  };

  const handleViewModeChange = newMode => {
    const previousMode = localViewMode;
    setLocalViewMode(newMode);

    try {
      if (setViewMode) setViewMode(newMode);
    } catch (error) {
      setLocalViewMode(previousMode);
    }
  };

  const handleIncognitoToggle = () => {
    const previousState = localIncognito;
    const newState = !localIncognito;
    setLocalIncognito(newState);

    try {
      if (toggleIncognitoMode) toggleIncognitoMode();
    } catch (error) {
      setLocalIncognito(previousState);
    }
  };

  const ThemeButton = ({ themeKey, label, isActive, onPress }) => {
    let buttonStyle = [styles.themeButton];
    let textStyle = [styles.themeButtonText];

    if (isActive) {
      if (themeKey === 'light') {
        buttonStyle.push({ backgroundColor: '#ffffff' });
        textStyle.push({ color: '#374151' });
      } else if (themeKey === 'dark') {
        buttonStyle.push({ backgroundColor: '#374151' });
        textStyle.push({ color: '#f3f4f6' });
      } else if (themeKey === 'black') {
        buttonStyle.push({ backgroundColor: '#000000' });
        textStyle.push({ color: '#f9fafb' });
      }
    } else {
      buttonStyle.push({ backgroundColor: 'transparent' });
      textStyle.push({ color: currentTheme.textColor });
    }

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const ViewModeButton = ({ mode, label, isActive, onPress }) => {
    let buttonStyle = [styles.viewModeButton];
    let textStyle = [styles.viewModeButtonText];

    if (isActive) {
      buttonStyle.push({ backgroundColor: currentTheme.primaryColor });
      textStyle.push({ color: '#ffffff' });
    } else {
      buttonStyle.push({ backgroundColor: 'transparent' });
      textStyle.push({ color: currentTheme.textColor });
    }

    return (
      <TouchableOpacity
        style={buttonStyle}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  const getSwitchColors = () => {
    const purpleColor = '#8b5cf6';

    if (localTheme === 'dark') {
      return {
        thumbColor: localIncognito ? purpleColor : '#a0aec0',
        trackColor: { false: '#3b4a5f', true: purpleColor },
      };
    } else if (localTheme === 'black') {
      return {
        thumbColor: localIncognito ? purpleColor : '#f9fafb',
        trackColor: { false: '#1a1a1a', true: purpleColor },
      };
    } else {
      return {
        thumbColor: localIncognito ? purpleColor : '#f4f3f4',
        trackColor: { false: '#767577', true: purpleColor },
      };
    }
  };

  const switchColors = getSwitchColors();

  return (
    <Modal
      visible={isOpen}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlayContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.menuLayout} pointerEvents="box-none">
          <View
            style={[
              styles.sideMenu,
              { backgroundColor: currentTheme.cardBackground },
            ]}
          >
            <View
              style={[
                styles.header,
                { borderBottomColor: currentTheme.borderColor },
              ]}
            >
              <Text style={[styles.title, { color: currentTheme.textColor }]}>
                Settings
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color={currentTheme.iconColor} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.content}
              contentContainerStyle={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.section,
                  { borderBottomColor: currentTheme.borderColor },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Icon
                    name={getThemeIcon()}
                    size={20}
                    color={currentTheme.iconColor}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: currentTheme.textColor },
                    ]}
                  >
                    Theme
                  </Text>
                </View>
                <View
                  style={[
                    styles.themeContainer,
                    { backgroundColor: currentTheme.inputBackground },
                  ]}
                >
                  <ThemeButton
                    themeKey="light"
                    label="Light"
                    isActive={localTheme === 'light'}
                    onPress={() => handleThemeChange('light')}
                  />
                  <ThemeButton
                    themeKey="dark"
                    label="Dark"
                    isActive={localTheme === 'dark'}
                    onPress={() => handleThemeChange('dark')}
                  />
                  <ThemeButton
                    themeKey="black"
                    label="Black"
                    isActive={localTheme === 'black'}
                    onPress={() => handleThemeChange('black')}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.section,
                  { borderBottomColor: currentTheme.borderColor },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <Icon
                    name="view-module"
                    size={20}
                    color={currentTheme.iconColor}
                  />
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: currentTheme.textColor },
                    ]}
                  >
                    View Mode
                  </Text>
                </View>
                <View
                  style={[
                    styles.viewModeContainer,
                    { backgroundColor: currentTheme.inputBackground },
                  ]}
                >
                  <ViewModeButton
                    mode="full"
                    label="Full"
                    isActive={localViewMode === 'full'}
                    onPress={() => handleViewModeChange('full')}
                  />
                  <ViewModeButton
                    mode="med"
                    label="Med"
                    isActive={localViewMode === 'med'}
                    onPress={() => handleViewModeChange('med')}
                  />
                  <ViewModeButton
                    mode="small"
                    label="Small"
                    isActive={localViewMode === 'small'}
                    onPress={() => handleViewModeChange('small')}
                  />
                </View>
              </View>

              <View
                style={[
                  styles.section,
                  {
                    borderBottomColor: currentTheme.borderColor,
                    borderBottomWidth: 0,
                  },
                ]}
              >
                <View style={styles.switchContainer}>
                  <View style={styles.switchLeft}>
                    <Icon
                      name={localIncognito ? 'visibility-off' : 'visibility'}
                      size={20}
                      color={currentTheme.iconColor}
                    />
                    <Text
                      style={[
                        styles.switchText,
                        { color: currentTheme.textColor },
                      ]}
                    >
                      Incognito Mode
                    </Text>
                  </View>
                  <Switch
                    value={localIncognito}
                    onValueChange={handleIncognitoToggle}
                    thumbColor={switchColors.thumbColor}
                    trackColor={switchColors.trackColor}
                    ios_backgroundColor={switchColors.trackColor.false}
                  />
                </View>
              </View>
            </ScrollView>

            <View
              style={[
                styles.footer,
                { borderTopColor: currentTheme.borderColor },
              ]}
            >
              <View style={styles.supportSection}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: currentTheme.textColor },
                  ]}
                >
                  Support us
                </Text>
                <View style={styles.supportContainer}>
                  <TouchableOpacity
                    style={[
                      styles.supportButton,
                      { backgroundColor: '#22c55e' },
                    ]}
                    onPress={() =>
                      Linking.openURL('https://archiveofourown.org/donate')
                    }
                  >
                    <Text style={styles.supportButtonText}>AO3</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.supportButton,
                      { backgroundColor: '#6366f1' },
                    ]}
                    onPress={() => Linking.openURL('https://ko-fi.com/tbvns')}
                  >
                    <Text style={styles.supportButtonText}>CO3</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text
                style={[
                  styles.version,
                  { color: currentTheme.secondaryTextColor },
                ]}
              >
                Version 1.0
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  menuLayout: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sideMenu: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flexGrow: 0,
  },
  contentContainer: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  themeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  themeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  themeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 4,
  },
  viewModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 1,
  },
  viewModeButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  switchText: {
    fontSize: 16,
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  supportSection: {
    marginBottom: 12,
  },
  supportContainer: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12,
  },
  supportButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  supportButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
  },
});

export default SideMenu;