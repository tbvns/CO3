import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  DeviceEventEmitter,
  Image,
  Linking,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';

import SideMenu from './components/app/SideMenu';
import { database } from './storage/DatabaseManager';
import { HistoryDAO } from './storage/dao/HistoryDAO';
import { WorkDAO } from './storage/dao/WorkDAO';
import { SettingsDAO } from './storage/dao/SettingsDAO';

import { themes } from './utils/themes';
import { STORAGE_KEYS } from './utils/constants';

import LibraryScreen from './screens/Library';
import UpdateScreen from './screens/Update';
import BrowseScreen from './screens/Browse';
import HistoryScreen from './screens/History';
import MoreScreen from './screens/More';
import ChapterInfoScreen, { ReaderWrapper } from './screens/workScreen';
import { LibraryDAO } from './storage/dao/LibraryDAO';
import { ProgressDAO } from './storage/dao/ProgressDAO';
import { KudoHistoryDAO } from './storage/dao/KudosHistoryDAO';
import CustomToast from './components/common/CustomToast';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import SystemNavigationBar from 'react-native-system-navigation-bar';
import { setup, setupNotificationListeners } from './web/updater';
import { getJsonSettings, saveJsonSettings } from './storage/jsonSettings';
import { UpdateDAO } from './storage/dao/UpdateDAO';
import notifee from 'react-native-notify-kit';
import { ChapterDAO } from './storage/dao/ChapterDAO';
import GlobalSearchScreen from './screens/GlobalSearchScreen';
import { Host } from 'react-native-portalize';
import WebviewFetcher from './web/WebviewFetcher';
import MainOnboardScreen from './onboard/MainOnboardScreen';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';
import './storage/LanguageManager';
import { useTranslation } from 'react-i18next';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import UserInfoScreen from './screens/UserInfo';
import UserWorkScreen from './screens/more/UserWorkScreen';
import StorageScreen from './screens/more/StorageScreen';
import StatsScreen from './screens/more/StatsScreen';
import ReadLaterScreen from './screens/more/ReadLaterScreen';
import PreferencesScreen from './screens/more/Preferences';
import LoginScreen from './screens/more/LoginScreen';
import KudoHistoryScreen from './screens/more/KudoHistory';
import HelpScreen from './screens/more/HelpScreen';
import DebugScreen from './screens/more/DebugScreen';
import CategoryScreen from './screens/more/CategoryScreen';
import BookmarksScreen from './screens/more/BookmarksScreen';
import AboutScreen from './screens/more/AboutScreen';

const Stack = createNativeStackNavigator();

const AppWrapper = () => {
  const wrapperStyle = Platform.OS === 'web'
    ? { flex: 1, width: '100%', height: '100%' }
    : { flex: 1 };

  return (
    <View style={wrapperStyle}>
      <Host>
        <GestureHandlerRootView>
          <SafeAreaProvider style={{ flex: 1 }}>
            <NavigationContainer>
              <Stack.Navigator
                screenOptions={{ headerShown: false }}
                initialRouteName={'Home'}
              >
                <Stack.Screen name={'Home'} component={App} />
                <Stack.Screen name={'Work'} component={ChapterInfoScreen} />
                <Stack.Screen name={'Reader'} component={ReaderWrapper} />
                <Stack.Screen name={'User'} component={UserInfoScreen} />
                <Stack.Screen name={'UserWork'} component={UserWorkScreen} />
                <Stack.Screen name={'Storage'} component={StorageScreen} />
                <Stack.Screen name={'Statistics'} component={StatsScreen} />
                <Stack.Screen name={'ReadLater'} component={ReadLaterScreen} />
                <Stack.Screen name={'Preferences'} component={PreferencesScreen} />
                <Stack.Screen name={'Account'} component={LoginScreen} />
                <Stack.Screen name={'KudosHistory'} component={KudoHistoryScreen} />
                <Stack.Screen name={'Help'} component={HelpScreen} />
                <Stack.Screen name={'Debug'} component={DebugScreen} />
                <Stack.Screen name={'Categories'} component={CategoryScreen} />
                <Stack.Screen name={'Bookmarks'} component={BookmarksScreen} />
                <Stack.Screen name={'About'} component={AboutScreen} />
              </Stack.Navigator>
            </NavigationContainer>
          </SafeAreaProvider>
        </GestureHandlerRootView>
        <WebviewFetcher />
      </Host>
    </View>
  );
};

const TopBar = ({ currentTheme, activeScreen, setIsSideMenuOpen, searchTerm, setSearchTerm, setActiveScreen }) => {
  const insets = useSafeAreaInsets();
  const showSearch = activeScreen === 'library' || activeScreen === 'search' || activeScreen === 'browse';

  const { t } = useTranslation();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: currentTheme.headerBackground,
          paddingTop: insets.top,
        },
      ]}
    >
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
              },
            ]}
            placeholder={t('general_global_search_placeholder')}
            placeholderTextColor={currentTheme.placeholderColor}
            value={searchTerm}
            onPress={() => {
              setActiveScreen('search');
            }}
            onChangeText={setSearchTerm}
          />
        </View>
      ) : (
        <View style={styles.titleHeader}>
          <Text style={[styles.headerTitle, { color: currentTheme.textColor }]}>
            {t("navigation_" + activeScreen)}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.menuButton,
          { backgroundColor: currentTheme.buttonBackground },
        ]}
        onPress={() => setIsSideMenuOpen(true)}
      >
        <Icon name="menu" size={24} color={currentTheme.iconColor} />
      </TouchableOpacity>
    </View>
  );
};

const BottomNavigation = ({ activeScreen, setActiveScreen, currentTheme, onDoubleTap }) => {
  const { t } = useTranslation();

  const navItems = [
    { key: 'library', icon: 'library-books', label: t('navigation_library') },
    { key: 'update', icon: 'update', label: t('navigation_update') },
    { key: 'browse', icon: 'book', label: t('navigation_browse') },
    { key: 'history', icon: 'bookmark', label: t('navigation_history') },
    { key: 'more', icon: 'more-horiz', label: t('navigation_more') },
  ];

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bottomNav, { backgroundColor: currentTheme.headerBackground, paddingBottom: insets.bottom, }]}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.key}
          style={styles.navItemContainer}
          onPress={() => {
            if (activeScreen === item.key) {
              onDoubleTap(item.key);
            } else {
              setActiveScreen(item.key);
            }
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
  const insets = useSafeAreaInsets();

  const [searchTerm, setSearchTerm] = useState('');
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [theme, setTheme] = useState('light');
  const [isIncognitoMode, setIsIncognitoMode] = useState(false);
  const [viewMode, setViewMode] = useState('full');
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeScreen, setActiveScreen] = useState('library');

  const [linkingUrl, setLinkingUrl] = useState();

  const [databaseObj, setDatabaseObj] = useState(null);
  const [workDAO, setWorkDAO] = useState(null);
  const [historyDAO, setHistoryDAO] = useState(null);
  const [settingsDAO, setSettingsDAO] = useState(null);
  const [libraryDAO, setLibraryDAO] = useState(null);
  const [progressDAO, setProgressDAO] = useState(null);
  const [kudoDAO, setKudoDAO] = useState(null);
  const [kudoHistoryDAO, setKudoHistoryDAO] = useState(null);
  const [updateDAO, setupdateDAO] = useState(null);
  const [chapterDAO, setChapterDAO] = useState(null);
  const [jsonSettings, setJsonSettings] = useState();

  const [screens, setScreens] = useState([]);
  const screensCount = useSharedValue(0);
  const activeScreenShared = useSharedValue('library');

  const [selectedTag, setSelectedTag] = useState();
  const [selectedPreset, setSelectedPreset] = useState();
  const [selectedCollection, setSelectedCollection] = useState();

  const { t } = useTranslation();

  const currentTheme = useMemo(() => {
    return (themes && themes[theme]) ? themes[theme] : (themes?.light || {
      backgroundColor: 'white',
      textColor: 'black',
      headerBackground: '#f8f8f8',
      iconColor: '#333',
      inputBackground: '#eee',
      borderColor: '#e0e0e0',
      primaryColor: '#8b5cf6',
      buttonBackground: '#eee',
      placeholderColor: '#999',
      cardBackground: '#fff',
      secondaryTextColor: '#666',
    });
  }, [theme]);

  const contextRef = useRef({
    workDAO, libraryDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, currentTheme
  });

  const hasAddedInitialScreen = useRef(false);

  const navigation = useNavigation();

  useEffect(() => {
    if (loading || !libraryDAO || !progressDAO || !settingsDAO || !workDAO || hasAddedInitialScreen.current) {
      return;
    }

    if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
      return;
    }

    const handleUrl = async (url) => {
      hasAddedInitialScreen.current = true;
      const workId = url.split('/')[4];

      navigation.push("Work", {
        key: `url_work_${workId}`,
        workId: workId,
        currentTheme: currentTheme,
        libraryDAO: libraryDAO,
        workDAO: workDAO,
        setScreens: setScreens,
        settingsDAO: settingsDAO,
        historyDAO: historyDAO,
        progressDAO: progressDAO,
        kudoHistoryDAO: kudoHistoryDAO,
        openTagSearch: openTagSearch,
        url: url,
        chapterDAO: chapterDAO
      })
    };

    Linking.getInitialURL().then((url) => {
      if (url != null) {
        handleUrl(url);
      }
    });

    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => subscription.remove();
  }, [loading, libraryDAO, progressDAO, settingsDAO, workDAO]);

  useEffect(() => {
    screensCount.value = screens.length;
  }, [screens]);

  useEffect(() => {
    activeScreenShared.value = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    contextRef.current = {
      workDAO, libraryDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, currentTheme
    };
  }, [workDAO, libraryDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, currentTheme]);


  useEffect(() => {
    initializeApp();

    function unsubscribeForeground() {
      setupNotificationListeners(
        setActiveScreen,
        setScreens,
        (workId, chapterId) => handleNotificationOpen(workId, chapterId)
      )
    }

    const checkInitialNotification = async () => {
      const initialNotification = await notifee.getInitialNotification();

      if (initialNotification) {
        if (initialNotification.notification.id === 'updateComplete') {
          setActiveScreen('update');
        } else if (initialNotification.notification.data?.action === 'OPEN_WORK') {
          const { workId, chapterId } = initialNotification.notification.data;
          setTimeout(() => handleNotificationOpen(workId, chapterId), 1000);
        }
      }
    };

    checkInitialNotification();

    return () => {
      if (database) {
        database.close();
      }
      unsubscribeForeground();
    };
  }, []);

  const handleDoubleTap = (screenId) => {
    DeviceEventEmitter.emit('doubleTap', screenId);
  }

  const handleNotificationOpen = async (workId, chapterNumber) => {
    const ctx = contextRef.current;

    if (!ctx.workDAO) return;

    try {
      const { fetchWorkFromWorkID } = require('./web/worksScreen/fetchWork');
      const work = await fetchWorkFromWorkID(workId, workDAO, chapterDAO);

      if (!work) return;

      let loadChapterIndex = null;

      if (chapterNumber && work.chapters && work.chapters.length > 0) {
        const targetNum = parseInt(chapterNumber);

        const foundIndex = work.chapters.findIndex(c => c.number === targetNum);

        if (foundIndex !== -1) {
          loadChapterIndex = foundIndex;
        }
        else if (targetNum <= work.chapters.length && targetNum > 0) {
          loadChapterIndex = targetNum - 1;
        }
      }

      console.log(`[Notification] Opening Work: ${work.title}, Index: ${loadChapterIndex}`);
      navigation.push("Work", {
        key: `notif_${workId}_${Date.now()}`,
        workId: workId,
        currentTheme: ctx.currentTheme,
        libraryDAO: ctx.libraryDAO,
        workDAO: ctx.workDAO,
        setScreens: setScreens,
        settingsDAO: ctx.settingsDAO,
        historyDAO: ctx.historyDAO,
        progressDAO: ctx.progressDAO,
        kudoHistoryDAO: ctx.kudoHistoryDAO,
        openTagSearch: openTagSearch,
        loadChapter: loadChapterIndex,
        chapterDAO: ctx.chapterDAO,
      })

      setActiveScreen('update');

    } catch (e) {
      console.error("Failed to open work from notification", e);
    }
  };

  useEffect(() => {
    const backAction = () => {
      console.log(screens);
      if (screens.length > 0) {
        return true;
      } else if (activeScreen === "search") {
        setActiveScreen("library")
        console.log("Back on search, opening library as fallback"); //For some reason if I remove this, it doesn't work. Might be the first heisenbug of this codebase
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [screens]);

  const exitApp = () => BackHandler.exitApp();

  const popScreen = () => navigation.goBack();

  const swipeBack = Platform.OS === 'ios' || Platform.OS === 'android' ? ( Gesture.Pan()
    .enabled(Platform.OS === 'ios')
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onEnd((e) => {
      'worklet';
      if (Math.abs(e.translationX) > 50 && e.velocityX > 200) {
        if (screensCount.value > 0) {
          runOnJS(popScreen)();
        } else if (activeScreenShared.value === 'search') {
          runOnJS(setActiveScreen)('library');
        } else {
          runOnJS(exitApp)();
        }
      }
    }) ) : () => console.log("gesture is ignored in windows");

  const initializeApp = async () => {
    const jsonSettings = await getJsonSettings();
    setJsonSettings(jsonSettings)
    setup(jsonSettings.time)

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
      } catch (err) {
        console.error(err);
      }
    }

    try {
      const db = await database.open();
      const newWorkDAO = new WorkDAO(db);
      const newHistoryDAO = new HistoryDAO(db);
      const newSettingsDAO = new SettingsDAO(db);
      const newLibraryDAO = new LibraryDAO(db);
      const newProgressDAO = new ProgressDAO(db);
      const newKudoHistoryDAO = new KudoHistoryDAO(db);
      const newUpdateDAO = new UpdateDAO(db);
      const newChapterDAO = new ChapterDAO(db);

      setDatabaseObj(db)
      setWorkDAO(newWorkDAO);
      setHistoryDAO(newHistoryDAO);
      setSettingsDAO(newSettingsDAO);
      setLibraryDAO(newLibraryDAO);
      setProgressDAO(newProgressDAO);
      setKudoHistoryDAO(newKudoHistoryDAO)
      setupdateDAO(newUpdateDAO);
      setChapterDAO(newChapterDAO);

      const loadedSettings = await newSettingsDAO.getSettings();
      setTheme(loadedSettings.theme);
      setIsIncognitoMode(loadedSettings.isIncognitoMode);
      setViewMode(loadedSettings.viewMode);

      const booksData = await newWorkDAO.getAll();
      setBooks(booksData);
    } catch (error) {
      console.error('Error initializing app:', error);
      Alert.alert('Error', 'Failed to initialize app');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (workDAO) {
      loadBooks();
    }
  }, [workDAO]);

  useEffect(() => {
    const navBarColor = screens.length === 0 ? currentTheme.headerBackground : currentTheme.backgroundColor;
    const isDark = theme === 'dark' || theme === 'black';

    SystemNavigationBar.setNavigationColor(navBarColor, isDark ? "dark" : "light");
  }, [currentTheme, theme, screens]);

  const loadBooks = async () => {
    try {
      if (workDAO) {
        const booksData = await workDAO.getAll();
        setBooks(booksData);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    }
  };

  const saveTheme = async (newTheme) => {
    try {
      if (settingsDAO) {
        const currentSettings = await settingsDAO.getSettings();
        currentSettings.theme = newTheme;
        await settingsDAO.saveSettings(currentSettings);
        setTheme(newTheme);
      } else {
        console.warn('SettingsDAO not initialized, cannot save theme.');
        await AsyncStorage.setItem(STORAGE_KEYS.THEME, newTheme);
        setTheme(newTheme);
      }
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const saveIncognitoMode = async (mode) => {
    try {
      if (settingsDAO) {
        const currentSettings = await settingsDAO.getSettings();
        currentSettings.isIncognitoMode = mode;
        await settingsDAO.saveSettings(currentSettings);
        setIsIncognitoMode(mode);
      } else {
        console.warn('SettingsDAO not initialized, cannot save incognito mode.');
        await AsyncStorage.setItem(STORAGE_KEYS.INCOGNITO_MODE, JSON.stringify(mode));
        setIsIncognitoMode(mode);
      }
    } catch (error) {
      console.error('Error saving incognito mode:', error);
    }
  };

  const saveViewMode = async (mode) => {
    try {
      if (settingsDAO) {
        const currentSettings = await settingsDAO.getSettings();
        currentSettings.viewMode = mode;
        await settingsDAO.saveSettings(currentSettings);
        setViewMode(mode);
      } else {
        console.warn('SettingsDAO not initialized, cannot save view mode.');
        await AsyncStorage.setItem(STORAGE_KEYS.VIEW_MODE, mode);
        setViewMode(mode);
      }
    } catch (error) {
      console.error('Error saving view mode:', error);
    }
  };

  const openTagSearch = (tag) => {
    setSelectedTag(tag);
    setActiveScreen("browse")
    navigation.reset()
  }

  const renderScreen = () => {
    const screenProps = {
      currentTheme: currentTheme,
      searchTerm,
      setSearchTerm,
      books,
      viewMode,
      loadBooks,
      workDAO,
      historyDAO,
      progressDAO,
      settingsDAO,
      screens,
      setScreens,
      libraryDAO,
      setActiveScreen,
      setTheme,
      theme,
      setViewMode,
      kudoDAO,
      kudoHistoryDAO,
      openTagSearch,
      selectedTag,
      setSelectedTag,
      updateDAO,
      databaseObj,
      chapterDAO,
      selectedPreset,
      setSelectedPreset,
      setSelectedCollection,
      selectedCollection,
      setJsonSettings
    };

    switch (activeScreen) {
      case 'library':
        return <LibraryScreen {...screenProps} />;
      case 'update':
        return <UpdateScreen {...screenProps} />;
      case 'browse':
        return <BrowseScreen {...screenProps} />;
      case 'history':
        return <HistoryScreen {...screenProps} />;
      case 'more':
        return <MoreScreen {...screenProps} />;
      case 'search':
        return <GlobalSearchScreen {...screenProps} />
      default:
        return <LibraryScreen {...screenProps} />;
    }
  };

  if (loading || !currentTheme) {
    return (
      <>
        <SafeAreaView
          style={[
            styles.container,
            { backgroundColor: currentTheme?.backgroundColor || 'white' },
          ]}
        >
          <View style={styles.loadingContainer}>
            <Image
              style={{ width: 200, height: 200, marginBottom: 50 }}
              source={require('./res/CO3.png')}
            />
            <ActivityIndicator size="50" color={currentTheme.primaryColor} />
            <Text style={{ color: currentTheme.textColor }}>
              {t('general_loading')}
            </Text>
          </View>
        </SafeAreaView>
        <CustomToast currentTheme={currentTheme} />
      </>
    );
  }

  if (!jsonSettings.finishedOnboarding) {
    return (
      <>
        <StatusBar
          barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
          backgroundColor={currentTheme.backgroundColor}
        />
        <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
          <MainOnboardScreen
            setTheme={saveTheme}
            currentTheme={currentTheme}
            onFinish={() => {
              jsonSettings.finishedOnboarding = true;
              saveJsonSettings(jsonSettings).then(
                getJsonSettings().then(setJsonSettings)
              )
            }}
          />
        </View>
      </>
    )
  }

  if (screens.length !== 0) {
    return (
      <>
        <GestureDetector gesture={swipeBack}>
          <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
            <StatusBar
              barStyle={theme === 'light' ? 'dark-content' : 'light-content'}
              backgroundColor={currentTheme.backgroundColor}
            />
            <View style={[
              styles.screenWrapper,
              {
                flex: 1,
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
              }
            ]}>
              {screens[screens.length - 1]}
            </View>
          </View>
        </GestureDetector>
        <CustomToast currentTheme={currentTheme} />
      </>
    )
  }

  return (
    <GestureDetector gesture={swipeBack} >
      <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
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
            setActiveScreen={setActiveScreen}
          />

          {renderScreen()}

          <BottomNavigation
            activeScreen={activeScreen}
            setActiveScreen={setActiveScreen}
            currentTheme={currentTheme}
            onDoubleTap={handleDoubleTap}
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
            historyDAO={historyDAO}
            workDAO={workDAO}
            settingsDAO={settingsDAO}
          />
        </SafeAreaView>

        <CustomToast currentTheme={currentTheme} />
      </View>
    </GestureDetector>
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

export default AppWrapper;
