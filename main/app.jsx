import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import SideMenu from './components/SideMenu';
import AddWorkModal from './components/AddWorkModal';
import DatabaseManager from './database/DatabaseManager';
import { themes } from './utils/themes';
import { STORAGE_KEYS } from './utils/constants';

import LibraryScreen from './screens/Library';
import UpdateScreen from './screens/Update';
import BrowseScreen from './screens/Browse';
import HistoryScreen from './screens/History';
import MoreScreen from './screens/More';
import databaseManager from './database/DatabaseManager';

const TopBar = ({ currentTheme, activeScreen, setIsSideMenuOpen, searchTerm, setSearchTerm }) => {
  const showSearch = activeScreen === 'library';

  return (
    <View style={[styles.header, { backgroundColor: currentTheme.headerBackground }]}>
      {showSearch ? (
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={currentTheme.iconColor} />
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: currentTheme.inputBackground,
                color: currentTheme.textColor,
                borderColor: currentTheme.borderColor,
              }
            ]}
            placeholder="Search books, authors..."
            placeholderTextColor={currentTheme.placeholderColor}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
      ) : (
        <View style={styles.titleHeader}>
          <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>
            {activeScreen.charAt(0).toUpperCase() + activeScreen.slice(1)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.menuButton, { backgroundColor: currentTheme.buttonBackground }]}
        onPress={() => setIsSideMenuOpen(true)}
      >
        <Icon name="menu" size={24} color={currentTheme.iconColor} />
      </TouchableOpacity>
    </View>
  );
};

const BottomNavigation = ({ activeScreen, setActiveScreen, currentTheme }) => {
  const navItems = [
    { key: 'library', icon: 'library-books', label: 'Library' },
    { key: 'update', icon: 'update', label: 'Update' },
    { key: 'browse', icon: 'book', label: 'Browse' },
    { key: 'history', icon: 'bookmark', label: 'History' },
    { key: 'more', icon: 'more-horiz', label: 'More' },
  ];

  return (
    <View style={[styles.bottomNav, { backgroundColor: currentTheme.headerBackground }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.navItemContainer}
          onPress={() => {
            // console.log('Pressed:', item.key); // Debug log
            setActiveScreen(item.key);
          }}
          activeOpacity={0.7}
        >
          <View style={styles.navItemContent}>
            <Icon
              name={item.icon}
              size={24}
              color={activeScreen === item.key ? currentTheme.primaryColor : currentTheme.iconColor}
            />
            <Text style={[
              styles.navItemLabel,
              {
                color: activeScreen === item.key ? currentTheme.primaryColor : currentTheme.iconColor,
                fontSize: 12,
                marginTop: 4,
              }
            ]}>
              {item.label}
            </Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isIncognitoMode, setIsIncognitoMode] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState('library');

  useEffect(() => {
    initializeApp();
    }, []);

  const initializeApp = async () => {
    try {
      await DatabaseManager.initializeDatabase();
      await loadSettings();
      await loadBooks();
      DatabaseManager.addToHistory(65484, 1, 65465, "bookTitle", "bookAuthor").then(r => console.log(r));
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEYS.THEME);
      const savedIncognito = await AsyncStorage.getItem(STORAGE_KEYS.INCOGNITO_MODE);
      const savedViewMode = await AsyncStorage.getItem(STORAGE_KEYS.VIEW_MODE);

      if (savedTheme) setTheme(savedTheme);
      if (savedIncognito) setIsIncognitoMode(JSON.parse(savedIncognito));
      if (savedViewMode) setViewMode(savedViewMode);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadBooks = async () => {
    try {
      const booksData = await DatabaseManager.getAllBooks();
      setBooks(booksData);
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const saveTheme = async (newTheme) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
      setTheme(newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const saveIncognitoMode = async (mode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INCOGNITO_MODE, JSON.stringify(mode));
      setIsIncognitoMode(mode);
    } catch (error) {
      console.error('Error saving incognito mode:', error);
    }
  };

  const saveViewMode = async (mode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
      setViewMode(mode);
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  const handleAddWork = async (workData) => {
    try {
      await DatabaseManager.addBook(workData);
      await loadBooks();
      setIsAddWorkModalOpen(false);
      Alert.alert('Success', 'Work added successfully');
    } catch (error) {
      console.error('Error adding work:', error);
      Alert.alert('Error', 'Failed to add work');
    }
  };

  const renderScreen = () => {
    const screenProps = {
      currentTheme: themes[theme],
      searchTerm,
      setSearchTerm,
      books,
      viewMode,
      loadBooks,
      setIsAddWorkModalOpen,
    };

    switch (activeScreen) {
      case 'library':
        return <LibraryScreen {...screenProps} />;
      case 'update':
        return <UpdateScreen currentTheme={themes[theme]} />;
      case 'browse':
        return <BrowseScreen currentTheme={themes[theme]} />;
      case 'history':
        return <HistoryScreen currentTheme={themes[theme]} />;
      case 'more':
        return <MoreScreen currentTheme={themes[theme]} />;
      default:
        return <LibraryScreen {...screenProps} />;
    }
  };

  const currentTheme = themes[theme];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
        backgroundColor={currentTheme.headerBackground}
      />

      <TopBar
        currentTheme={currentTheme}
        activeScreen={activeScreen}
        setIsSideMenuOpen={setIsSideMenuOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      {renderScreen()}

      <BottomNavigation
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        currentTheme={currentTheme}
      />

      <SideMenu
        isOpen={isSideMenuOpen}
        onClose={() => setIsSideMenuOpen(false)}
        theme={theme}
        setTheme={saveTheme}
        isIncognitoMode={isIncognitoMode}
        toggleIncognitoMode={() => saveIncognitoMode(!isIncognitoMode)}
        viewMode={viewMode}
        setViewMode={saveViewMode}
        currentTheme={currentTheme}
      />

      <AddWorkModal
        isOpen={isAddWorkModalOpen}
        onClose={() => setIsAddWorkModalOpen(false)}
        onAdd={handleAddWork}
        theme={currentTheme}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  titleHeader: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBooks: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  navItemContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  navItemContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navItemLabel: {
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default App;
