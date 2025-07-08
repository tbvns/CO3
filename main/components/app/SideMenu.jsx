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
                    historyDAO,
                    workDAO,
                    settingsDAO,
                  }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (isOpen && historyDAO && workDAO) {
      loadHistory();
    }
  }, [isOpen, historyDAO, workDAO]);

  const loadHistory = async () => {
    try {
      const historyData = await historyDAO.getAll();

      const historyWithWorkDetails = await Promise.all(
          historyData.map(async (item) => {
            const work = await workDAO.get(item.workId);
            return {
              ...item,
              book_title: work ? work.title : 'Unknown Title',
              book_author: work ? work.author : 'Unknown Author',
            };
          })
      );

      const limitedHistory = historyWithWorkDetails.sort((a, b) => b.date - a.date).slice(0, 10);
      setHistory(limitedHistory);

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
                if (historyDAO) {
                  await historyDAO.deleteAll();
                  setHistory([]);
                  Alert.alert('Success', 'History cleared successfully');
                }
              } catch (error) {
                console.error('Error clearing history:', error);
                Alert.alert('Error', 'Failed to clear history');
              }
            },
          },
        ]
    );
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = now - date;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatChapterInfo = (chapterStart, chapterEnd) => {
    if (chapterEnd && chapterEnd !== chapterStart) {
      return `Ch. ${chapterStart}-${chapterEnd}`;
    }
    return `Ch. ${chapterStart}`;
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

  // Fixed theme button handler
  const handleThemeChange = (newTheme) => {
    console.log('Theme change requested:', newTheme);
    if (setTheme && typeof setTheme === 'function') {
      setTheme(newTheme);
    }
  };

  // Fixed view mode handler
  const handleViewModeChange = (newMode) => {
    console.log('View mode change requested:', newMode);
    if (setViewMode && typeof setViewMode === 'function') {
      setViewMode(newMode);
    }
  };

  // Fixed incognito toggle handler
  const handleIncognitoToggle = () => {
    console.log('Incognito toggle requested, current state:', isIncognitoMode);
    if (toggleIncognitoMode && typeof toggleIncognitoMode === 'function') {
      toggleIncognitoMode();
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
          transparent={true}
          animationType="slide"
          onRequestClose={onClose}
      >
        <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={onClose}
        >
          <TouchableOpacity
              style={[styles.sideMenu, { backgroundColor: currentTheme.cardBackground }]}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.header, { borderBottomColor: currentTheme.borderColor }]}>
              <Text style={[styles.title, { color: currentTheme.textColor }]}>Settings</Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="close" size={24} color={currentTheme.iconColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                      onPress={() => handleThemeChange('light')}
                  />
                  <ThemeButton
                      themeKey="dark"
                      label="Dark"
                      isActive={theme === 'dark'}
                      onPress={() => handleThemeChange('dark')}
                  />
                  <ThemeButton
                      themeKey="black"
                      label="Black"
                      isActive={theme === 'black'}
                      onPress={() => handleThemeChange('black')}
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
                      onPress={() => handleViewModeChange('full')}
                  />
                  <ViewModeButton
                      mode="med"
                      label="Med"
                      isActive={viewMode === 'med'}
                      onPress={() => handleViewModeChange('med')}
                  />
                  <ViewModeButton
                      mode="small"
                      label="Small"
                      isActive={viewMode === 'small'}
                      onPress={() => handleViewModeChange('small')}
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
                      onValueChange={handleIncognitoToggle}
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
                            <View style={styles.historyItemContent}>
                              <Text
                                  style={[styles.historyTitle, { color: currentTheme.textColor }]}
                                  numberOfLines={1}
                              >
                                {item.book_title || `Work ID: ${item.workId}`}
                              </Text>
                              <Text
                                  style={[styles.historyAuthor, { color: currentTheme.secondaryTextColor }]}
                                  numberOfLines={1}
                              >
                                by {item.book_author || 'Unknown Author'}
                              </Text>
                              <Text style={[styles.historyChapter, { color: currentTheme.secondaryTextColor }]}>
                                {formatChapterInfo(item.chapter, item.chapterEnd)}
                              </Text>
                            </View>
                            <View style={styles.historyMeta}>
                              <Text style={[styles.historyDate, { color: currentTheme.secondaryTextColor }]}>
                                {formatDate(item.date)}
                              </Text>
                            </View>
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
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
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
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  historyItemContent: {
    flex: 1,
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  historyAuthor: {
    fontSize: 12,
    marginBottom: 2,
  },
  historyChapter: {
    fontSize: 12,
    fontWeight: '500',
  },
  historyMeta: {
    alignItems: 'flex-end',
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