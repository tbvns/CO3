import React, { useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PreferencesScreen from './more/Preferences';
import LoginScreen from './more/LoginScreen';
import KudoHistory from './more/KudoHistory';
import KudoHistoryScreen from './more/KudoHistory';
import CategoryScreen from './more/CategoryScreen';
import AboutScreen from './more/AboutScreen';
import HelpScreen from './more/HelpScreen';
import BookmarksScreen from './more/BookmarksScreen';
import ReadLaterScreen from './more/ReadLaterScreen';

const MoreScreen = ({ currentTheme, setScreens, screens, theme, setTheme, viewMode, setViewMode, isIncognitoMode, toggleIncognitoMode, settingsDAO,
                      workDAO,
                      libraryDAO,
                      historyDAO,
                      progressDAO,
                      kudoHistoryDAO }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const handlePress = (screenName) => {
    switch (screenName) {
      case "Preferences":
        setScreens(prev => [...prev,
          <PreferencesScreen
            currentTheme={currentTheme}
            theme={theme}
            setTheme={setTheme}
            viewMode={viewMode}
            setViewMode={setViewMode}
            isIncognitoMode={isIncognitoMode}
            toggleIncognitoMode={toggleIncognitoMode}
            settingsDAO={settingsDAO}
            setScreens={setScreens}
          />
        ]);
        break;
      case "Account":
        setScreens(prev => [...prev,
          <LoginScreen
            currentTheme={currentTheme}
            setScreens={setScreens}
          />
        ]);
        break;
      case "KudosHistory":
        setScreens(prev => [...prev,
          <KudoHistoryScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break;
      case "Bookmarks":
        setScreens(prev => [...prev,
          <BookmarksScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            screens={screens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break
      case "ReadLater":
        setScreens(prev => [...prev,
          <ReadLaterScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            screens={screens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break
      case "Categories":
        setScreens(prev => [...prev,
          <CategoryScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break
      case "About":
        setScreens(prev => [...prev,
          <AboutScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break
      case "Help":
        setScreens(prev => [...prev,
          <HelpScreen
            currentTheme={currentTheme}
            workDAO={workDAO}
            libraryDAO={libraryDAO}
            setScreens={setScreens}
            historyDAO={historyDAO}
            settingsDAO={settingsDAO}
            progressDAO={progressDAO}
            kudoHistoryDAO={kudoHistoryDAO}
          />
        ]);
        break
    }
    console.log(`${screenName} pressed`);
  };

  const menuItems = [
    {
      name: 'Preferences',
      icon: 'settings',
      handler: () => handlePress('Preferences')
    },
    {
      name: 'Account',
      icon: 'account-circle',
      handler: () => handlePress('Account')
    },
    {
      name: 'Kudos history',
      icon: 'favorite',
      handler: () => handlePress('KudosHistory')
    },
    {
      name: 'Bookmarks',
      icon: 'bookmarks',
      handler: () => handlePress('Bookmarks')
    },
    {
      name: 'Marked for later',
      icon: 'watch-later',
      handler: () => handlePress('ReadLater')
    },
    {
      name: 'Categories',
      icon: 'category',
      handler: () => handlePress('Categories')
    },
    {
      name: 'Statistics',
      icon: 'bar-chart',
      handler: () => handlePress('Statistics')
    },
    {
      name: 'Data and Storage',
      icon: 'storage',
      handler: () => handlePress('Data and Storage')
    },
    {
      name: 'About',
      icon: 'info',
      handler: () => handlePress('About')
    },
    {
      name: 'Help',
      icon: 'help',
      handler: () => handlePress('Help')
    },
  ];

  return (
    <ScrollView
      style={[styles.mainContent, { backgroundColor: currentTheme.backgroundColor }]}
    >
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          More Options
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          Additional settings and features
        </Text>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <Animated.View
              key={item.name}
              style={[
                {
                  opacity: fadeAnim,
                  transform: [{
                    translateX: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }],
                }
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.menuItem,
                  {
                    backgroundColor: currentTheme.cardBackground,
                    borderBottomColor: currentTheme.borderColor,
                  },
                  index === menuItems.length - 1 && styles.lastItem
                ]}
                onPress={item.handler}
                activeOpacity={0.7}
              >
                <View style={styles.iconContainer}>
                  <Icon
                    name={item.icon}
                    size={24}
                    color={currentTheme.primaryColor}
                  />
                </View>
                <Text style={[styles.menuText, { color: currentTheme.textColor }]}>
                  {item.name}
                </Text>
                <Icon
                  name="chevron-right"
                  size={24}
                  color={currentTheme.placeholderColor}
                />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    margin: 16,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  menuContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: -16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  menuText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '500',
  },
});

export default MoreScreen;
