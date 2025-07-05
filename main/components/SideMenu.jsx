import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  SafeAreaView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatabaseManager from '../database/DatabaseManager';

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
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadHistory();
    }
  }, [isOpen]);

  const loadHistory = async () => {
    try {
      const historyData = await DatabaseManager.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  };

  const clearHistory = async () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await DatabaseManager.clearHistory();
              setHistory([]);
              Alert.alert('Success', 'History cleared successfully');
            } catch (error) {
              console.error('Error clearing history:', error);
              Alert.alert('Error', 'Failed to clear history');
            }
          },
        },
      ]
    );
  };

  const getThemeIcon = () => {
    switch (theme) {
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

  // Theme Button Component with proper theming
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
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // View Mode Button Component with proper theming
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
      >
        <Text style={textStyle}>{label}</Text>
      </TouchableOpacity>
    );
  };

  // Purple switch colors for incognito mode
  const getSwitchColors = () => {
    const purpleColor = '#8b5cf6'; // Purple color for incognito

    if (theme === 'dark') {
      return {
        thumbColor: isIncognitoMode ? purpleColor : '#a0aec0',
        trackColor: { false: '#3b4a5f', true: purpleColor },
      };
    } else if (theme === 'black') {
      return {
        thumbColor: isIncognitoMode ? purpleColor : '#f9fafb',
        trackColor: { false: '#1a1a1a', true: purpleColor },
      };
    } else {
      return {
        thumbColor: isIncognitoMode ? purpleColor : '#f4f3f4',
        trackColor: { false: '#767577', true: purpleColor },
      };
    }
  };

  const switchColors = getSwitchColors();

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <View style={[styles.sideMenu, { backgroundColor: currentTheme.cardBackground }]}>
          <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
            <Text style={[styles.title, { color: currentTheme.textColor }]}>Settings</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color={currentTheme.iconColor} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Theme Section */}
            <View style={[styles.section, { borderBottomColor: currentTheme.borderColor }]}>
              <View style={styles.sectionHeader}>
                <Icon name={getThemeIcon()} size={20} color={currentTheme.iconColor} />
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                  Theme
                </Text>
              </View>
              <View style={[styles.themeContainer, { backgroundColor: currentTheme.inputBackground }]}>
                <ThemeButton
                  themeKey="light"
                  label="Light"
                  isActive={theme === 'light'}
                  onPress={() => setTheme('light')}
                />
                <ThemeButton
                  themeKey="dark"
                  label="Dark"
                  isActive={theme === 'dark'}
                  onPress={() => setTheme('dark')}
                />
                <ThemeButton
                  themeKey="black"
                  label="Black"
                  isActive={theme === 'black'}
                  onPress={() => setTheme('black')}
                />
              </View>
            </View>

            {/* View Mode Section */}
            <View style={[styles.section, { borderBottomColor: currentTheme.borderColor }]}>
              <View style={styles.sectionHeader}>
                <Icon name="view-module" size={20} color={currentTheme.iconColor} />
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                  View Mode
                </Text>
              </View>
              <View style={[styles.viewModeContainer, { backgroundColor: currentTheme.inputBackground }]}>
                <ViewModeButton
                  mode="full"
                  label="Full"
                  isActive={viewMode === 'full'}
                  onPress={() => setViewMode('full')}
                />
                <ViewModeButton
                  mode="med"
                  label="Med"
                  isActive={viewMode === 'med'}
                  onPress={() => setViewMode('med')}
                />
                <ViewModeButton
                  mode="small"
                  label="Small"
                  isActive={viewMode === 'small'}
                  onPress={() => setViewMode('small')}
                />
              </View>
            </View>

            {/* Incognito Mode Section */}
            <View style={[styles.section, { borderBottomColor: currentTheme.borderColor }]}>
              <View style={styles.switchContainer}>
                <View style={styles.switchLeft}>
                  <Icon
                    name={isIncognitoMode ? 'visibility-off' : 'visibility'}
                    size={20}
                    color={currentTheme.iconColor}
                  />
                  <Text style={[styles.switchText, { color: currentTheme.textColor }]}>
                    Incognito Mode
                  </Text>
                </View>
                <Switch
                  value={isIncognitoMode}
                  onValueChange={toggleIncognitoMode}
                  thumbColor={switchColors.thumbColor}
                  trackColor={switchColors.trackColor}
                  ios_backgroundColor={switchColors.trackColor.false}
                />
              </View>
            </View>

            {/* History Section */}
            <View style={[styles.section, { borderBottomColor: currentTheme.borderColor }]}>
              <View style={styles.historyHeader}>
                <View style={styles.sectionHeader}>
                  <Icon name="history" size={20} color={currentTheme.iconColor} />
                  <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                    Recent History
                  </Text>
                </View>
                {history.length > 0 && (
                  <TouchableOpacity onPress={clearHistory}>
                    <Text style={[styles.clearButton, { color: currentTheme.primaryColor }]}>
                      Clear
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              {history.length > 0 ? (
                <ScrollView style={styles.historyContainer} nestedScrollEnabled={true}>
                  {history.map((item) => (
                    <View
                      key={item.id}
                      style={[styles.historyItem, { backgroundColor: currentTheme.inputBackground }]}
                    >
                      <Text
                        style={[styles.historyTitle, { color: currentTheme.textColor }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={[styles.historyDate, { color: currentTheme.secondaryTextColor }]}>
                        {item.date}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <Text style={[styles.noHistoryText, { color: currentTheme.secondaryTextColor }]}>
                  No recent history.
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: currentTheme.borderColor }]}>
            <View style={styles.supportSection}>
              <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                Support us
              </Text>
              <View style={styles.supportContainer}>
                <TouchableOpacity
                  style={[styles.supportButton, { backgroundColor: '#22c55e' }]}
                  onPress={() => console.log('Support AO3 clicked')}
                >
                  <Text style={styles.supportButtonText}>AO3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.supportButton, { backgroundColor: '#6366f1' }]}
                  onPress={() => console.log('Support CO3 clicked')}
                >
                  <Text style={styles.supportButtonText}>CO3</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text style={[styles.version, { color: currentTheme.secondaryTextColor }]}>
              Version 1.0
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'transparent', // Removed dark overlay
    justifyContent: 'flex-end',
  },
  sideMenu: {
    height: '90%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    flex: 1,
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
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clearButton: {
    fontSize: 14,
    fontWeight: '500',
  },
  historyContainer: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyTitle: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  historyDate: {
    fontSize: 12,
  },
  noHistoryText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
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
