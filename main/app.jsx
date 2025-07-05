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

import BookCard from './components/BookCard';
import SideMenu from './components/SideMenu';
import NavItem from './components/NavItem';
import AddWorkModal from './components/AddWorkModal';
import DatabaseManager from './database/DatabaseManager';
import { themes } from './utils/themes';
import { STORAGE_KEYS } from './utils/constants';

const App = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isAddWorkModalOpen, setIsAddWorkModalOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isIncognitoMode, setIsIncognitoMode] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      await DatabaseManager.initializeDatabase();
      await loadSettings();
      await loadBooks();
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

  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <View style={[styles.header, { backgroundColor: currentTheme.headerBackground }]}>
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

        <TouchableOpacity
          style={[styles.menuButton, { backgroundColor: currentTheme.buttonBackground }]}
          onPress={() => setIsSideMenuOpen(true)}
        >
          <Icon name="menu" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.mainContent}>
        <View style={styles.contentContainer}>
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: currentTheme.textColor }]}>Your Library</Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: currentTheme.primaryColor }]}
              onPress={() => setIsAddWorkModalOpen(true)}
            >
              <Icon name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {filteredBooks.length > 0 ? (
            filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                viewMode={viewMode}
                theme={currentTheme}
                onUpdate={loadBooks}
              />
            ))
          ) : (
            <Text style={[styles.noBooks, { color: currentTheme.placeholderColor }]}>
              No books found matching your search.
            </Text>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomNav, { backgroundColor: currentTheme.headerBackground }]}>
        <NavItem icon="library-books" label="Library" active theme={currentTheme} />
        <NavItem icon="update" label="Update" theme={currentTheme} />
        <NavItem icon="book" label="Browse" theme={currentTheme} />
        <NavItem icon="bookmark" label="History" theme={currentTheme} />
        <NavItem icon="more-horiz" label="More" theme={currentTheme} />
      </View>

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
});

export default App;
