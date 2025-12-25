import React, {useState, useEffect, useCallback, useMemo, useRef} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  FlatList,
  StatusBar,
  Animated,
  Linking,
  Alert,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import BookDetailsModal from '../components/Library/BookDetailsModal';
import { fetchChapters } from '../web/worksScreen/fetchChapters';
import { fetchWorkFromWorkID } from '../web/worksScreen/fetchWork';
import { fetchChapter } from '../web/worksScreen/fetchChapter';
import ChapterReader from './chapterReader';
import { navigateToNextChapter, navigateToPreviousChapter } from '../utils/ChapterNavigationHelpers';
import sendKudo from '../web/other/kudoRequest';
import { ChapterDAO } from '../storage/dao/ChapterDAO';
import { ProgressDAO } from '../storage/dao/ProgressDAO';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CategorySelectionModal from '../components/WorkScreen/CategorySelectionModal';
import { markForLater } from '../web/other/markedLater';
import Toast from 'react-native-toast-message';
import { bookmark } from '../web/other/bookmarks';

const ChapterItem = React.memo(({ chapter, index, currentTheme, onPress }) => {
  const hasProgress = chapter.progress !== undefined && chapter.progress !== null;
  const isRead = hasProgress && chapter.progress >= 0.98; // 98% or more

  return (
    <TouchableOpacity
      style={[styles.chapterItem, { borderBottomColor: currentTheme.borderColor }]}
      onPress={onPress}
    >
      <View style={styles.chapterContent}>
        {/* Chapter title, color changes if read */}
        <Text
          style={[
            styles.chapterTitle,
            { color: isRead ? currentTheme.secondaryTextColor : currentTheme.textColor }
          ]}
        >
          {chapter.name || `Chapter ${index + 1}`}
        </Text>
        {/* Chapter date and progress */}
        {(chapter.date || hasProgress) && (
          <Text style={[styles.chapterDate, { color: currentTheme.secondaryTextColor }]}>
            {chapter.date}
            {/* Display progress if available, regardless of "read" status */}
            {hasProgress && ` | ${(chapter.progress * 100).toFixed(0)}%`}
          </Text>
        )}
      </View>
      <Icon
        name="chevron-right"
        size={20}
        color={currentTheme.iconColor}
      />
    </TouchableOpacity>
  );
});

/**
 * A wrapper component that manages the state and logic for the ChapterReader.
 * It handles chapter navigation and provides a consistent header with a back button.
 */
const ReaderWrapper = ({
                         initialChapterData,
                         currentTheme,
                         setScreens,
                         chapterList,
                         historyDAO,
                         progressDAO,
                         settingsDAO,
                       }) => {
  const [chapterData, setChapterData] = useState(initialChapterData);
  const [loading, setLoading] = useState(false);

  // Removes the reader from the screen stack to go back.
  const handleBack = () => {
    setScreens(prev => prev.slice(0, -1));
  };

  // Callback for when a new chapter's content has been fetched.
  const handleChapterChange = (newChapterData) => {
    if (newChapterData) {
      setChapterData(prevData => ({
        ...newChapterData,
        workTitle: prevData.workTitle
      }));
    }
    setLoading(false);
  };

  // Fetches and displays the next chapter.
  const handleNextChapter = useCallback(async (newChapterData) => {
    if (loading || !chapterData.hasNextChapter) return;
    setLoading(true);
    await navigateToNextChapter({
      workId: chapterData.workId,
      chapterList: chapterList,
      currentChapterIndex: chapterData.chapterIndex,
      currentTheme: currentTheme,
      onChapterChange: handleChapterChange,
      historyDAO,
      settingsDAO
    });
  }, [loading, chapterData, chapterList, currentTheme, historyDAO, settingsDAO]);

  // Fetches and displays the previous chapter.
  const handlePreviousChapter = useCallback(async () => {
    if (loading || !chapterData.hasPreviousChapter) return;
    setLoading(true);
    await navigateToPreviousChapter({
      workId: chapterData.workId,
      chapterList: chapterList,
      currentChapterIndex: chapterData.chapterIndex,
      currentTheme: currentTheme,
      onChapterChange: handleChapterChange,
      historyDAO,
      settingsDAO,
    });
  }, [loading, chapterData, chapterList, currentTheme, historyDAO, settingsDAO]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar backgroundColor={currentTheme.headerBackground} />
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        </View>
      ) : (
        <ChapterReader
          currentTheme={currentTheme}
          workId={chapterData.workId}
          workTitle={chapterData.workTitle}
          chapterTitle={chapterData.chapterTitle}
          chapterID={chapterData.chapterId}
          htmlContent={chapterData.htmlContent}
          currentChapterIndex={chapterData.chapterIndex}
          totalChapters={chapterList.length}
          hasNextChapter={chapterData.hasNextChapter}
          hasPreviousChapter={chapterData.hasPreviousChapter}
          onNextChapter={handleNextChapter}
          onPreviousChapter={handlePreviousChapter}
          settingsDAO={settingsDAO}
          progressDAO={progressDAO}
          historyDAO={historyDAO}
        />
      )}
    </SafeAreaView>
  );
};


const ChapterInfoScreen = ({
                             workId,
                             currentTheme,
                             libraryDAO,
                             workDAO,
                             setScreens,
                             settingsDAO,
                             historyDAO,
                             progressDAO,
                             loadChapter,
                             kudoHistoryDAO,
                             openTagSearch
                           }) => {
  const [work, setWork] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [chapterProgress, setChapterProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('summary');
  const [inLibrary, setInLibrary] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('error');
  const [isLoadingContinue, setIsLoadingContinue] = useState(false);
  const [categories, setCategories] = useState(['Default']);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryAction, setCategoryAction] = useState(null);
  const [menuVisible, setMenuVisible] = useState(false);

  const showToast = (message, type = 'error') => {
    Toast.show({
      type: type,
      text1: type === 'success' ? 'Success' : 'Error',
      text2: message,
      position: 'bottom',
      bottomOffset: 80,
    });
  };
  const hideToast = () => {
    setToastVisible(false);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const res = await AsyncStorage.getItem('Categories');
      if (res) {
        const loadedCategories = JSON.parse(res);
        if (!loadedCategories.includes('Default')) {
          setCategories(['Default', ...loadedCategories]);
        } else {
          setCategories(loadedCategories);
        }
      } else {
        setCategories(['Default']);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      setCategories(['Default']);
    }
  };

  const showCategorySelection = async (action = 'add') => {
    if (action === 'remove') {
      await libraryDAO.remove(workId);
      setInLibrary(false);
      showToast('Removed from library', 'success');
      return;
    }

    if (categories.length === 1) {
      await addToLibrary(categories[0]);
      return;
    }

    setCategoryAction('add');
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (collection) => {
    setShowCategoryModal(false);
    await addToLibrary(collection);
  };

  const addToLibrary = async (collection) => {
    try {
      const existingWork = await workDAO.get(workId);
      if (!existingWork) {
        await workDAO.add(work);
      }

      await libraryDAO.add(workId, collection);
      setInLibrary(true);
      showToast(
        `Added to library${collection !== 'Default' ? ` in "${collection}"` : ''}`,
        'success'
      );
    } catch (error) {
      console.error('Error adding to library:', error);
      showToast('Failed to add to library');
    }
  };

  useEffect(() => {
    loadWorkData();
  }, [workId]);

  const loadWorkData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workData, chaptersData, progressData] = await Promise.all([
        fetchWorkFromWorkID(workId),
        fetchChapters(workId),
        progressDAO.getProgressList(workId),
      ]);

      setWork(workData);
      setChapters(chaptersData);

      const progressMap = progressData.reduce((acc, item) => {
        acc[item.chapterID] = item.progress;
        return acc;
      }, {});
      setChapterProgress(progressMap);

      if (loadChapter !== null && chaptersData[loadChapter]) {
        setScreens(prev => {
          const newScreens = [...prev];
          newScreens.pop();
          setScreens([...newScreens,
            <ChapterInfoScreen
              key={workId}
              workId={workId}
              currentTheme={currentTheme}
              libraryDAO={libraryDAO}
              workDAO={workDAO}
              setScreens={setScreens}
              settingsDAO={settingsDAO}
              historyDAO={historyDAO}
              progressDAO={progressDAO}
              kudoHistoryDAO={kudoHistoryDAO}
              openTagSearch={openTagSearch}
            />
          ]);
          return newScreens;
        })

        const chapterToLoad = chaptersData[loadChapter];
        const chapterContent = await fetchChapter(
          workId,
          chapterToLoad.id,
          currentTheme,
          settingsDAO
        );

        if (chapterContent) {
          const initialChapterData = {
            workId: workId,
            workTitle: workData.title,
            chapterId: chapterToLoad.id,
            chapterTitle: chapterToLoad.name,
            htmlContent: chapterContent,
            chapterIndex: loadChapter,
            hasNextChapter: loadChapter < chaptersData.length - 1,
            hasPreviousChapter: loadChapter > 0,
          };

          const chapterListForNav = chaptersData.map((c) => ({
            id: c.id,
            title: c.name,
          }));

          setScreens((prevScreens) => [
            ...prevScreens,
            <ReaderWrapper
              key={chapterToLoad.id}
              initialChapterData={initialChapterData}
              currentTheme={currentTheme}
              setScreens={setScreens}
              chapterList={chapterListForNav}
              settingsDAO={settingsDAO}
              historyDAO={historyDAO}
              progressDAO={progressDAO}
            />,
          ]);
        }
      }
    } catch (err) {
      console.error('Error loading work data:', err);
      setError(err.message || 'Failed to load work data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkLibraryStatus = async () => {
      try {
        const isInLib = await libraryDAO.isInLibrary(workId);
        setInLibrary(isInLib);
      } catch (error) {
        console.error('Error checking library status:', error);
      }
    };
    checkLibraryStatus();
  }, [workId, libraryDAO]);

  const handleAddToLibrary = useCallback(async () => {
    if (inLibrary) {
      await showCategorySelection('remove');
    } else {
      await showCategorySelection('add');
    }
  }, [inLibrary, workId, libraryDAO, work, categories]);

  const handleLike = useCallback(async () => {
    if (likeLoading) return;

    setLikeLoading(true);
    try {
      const success = await sendKudo(workId);
      if (success) {
        setLiked(true);

        const kudoEntry = {
          workId: workId,
          date: Date.now()
        };
        await kudoHistoryDAO.add(kudoEntry);

        showToast('Kudo sent successfully!', 'success');
      } else {
        showToast('Failed to send kudo. Please try again.');
      }
    } catch (error) {
      console.error('Error sending kudo:', error);
      showToast('Failed to send kudo. Please try again.');
      setLiked(false);
    } finally {
      setLikeLoading(false);
    }
  }, [workId, likeLoading, kudoHistoryDAO]);

  const handleMoreInfo = useCallback(() => {
    setModalMode('full');
    setModalVisible(true);
  }, []);

  const handleShowAllTags = useCallback(() => {
    setModalMode('allTags');
    setModalVisible(true);
  }, []);

  const handleOpenWebView = useCallback(() => {
    Linking.openURL("https://archiveofourown.org/works/" + workId);
  }, [workId]);

  const handleBookmark = async () => {
    setMenuVisible(false);
    bookmark(work).then(() => {
      showToast('Added to bookmarks', 'success');
    }) .catch(error => {
      showToast(error, 'error');
    })
  };

  const handleMarkForLater = async () => {
    setMenuVisible(false);
    markForLater(work).then(() => {
      showToast('Marked for Later', 'success');
    }) .catch(error => {
      showToast(error, 'error');
    })
  };

  const handleChapterPress = useCallback(async (chapter, originalIndex) => {
    try {
      const existingWork = await workDAO.get(workId);
      if (!existingWork) {
        await workDAO.add(work);
      }

      let chapterContent;
      if (originalIndex === 0) {
        chapterContent = await fetchChapter(workId, null, currentTheme, settingsDAO);
      } else {
        chapterContent = await fetchChapter(workId, chapter.id, currentTheme, settingsDAO);
      }
      if (!chapterContent) {
        console.error("Could not fetch chapter content. Please try again.");
        return;
      }

      const initialChapterData = {
        workId: workId,
        workTitle: work.title,
        chapterId: chapter.id,
        chapterTitle: chapter.name,
        htmlContent: chapterContent,
        chapterIndex: originalIndex,
        hasNextChapter: originalIndex < chapters.length - 1,
        hasPreviousChapter: originalIndex > 0,
      };

      const chapterListForNav = chapters.map(c => ({ id: c.id, title: c.name }));

      setScreens(prevScreens => [
        ...prevScreens,
        <ReaderWrapper
          key={chapter.id}
          initialChapterData={initialChapterData}
          currentTheme={currentTheme}
          setScreens={setScreens}
          chapterList={chapterListForNav}
          settingsDAO={settingsDAO}
          historyDAO={historyDAO}
          progressDAO={progressDAO}
        />
      ]);

    } catch (error) {
      console.error('Error opening chapter reader:', error);
    }
  }, [workId, work, chapters, currentTheme, setScreens, settingsDAO, historyDAO, progressDAO, workDAO]);

  const formatWork = useCallback((work) => ({
    id: work.id,
    title: work.title,
    author: work.author,
    rating: work.rating,
    category: work.category,
    warningStatus: work.warningStatus,
    isCompleted: work.isCompleted,
    tags: work.tags,
    warnings: work.warnings,
    description: work.description,
    lastUpdated: work.updated ? new Date(work.updated).toLocaleDateString() : 'Unknown',
    likes: work.kudos,
    bookmarks: work.bookmarks,
    views: work.hits,
    language: work.language,
  }), []);

  const renderHeaderMenu = () => (
    <Modal
      transparent={true}
      visible={menuVisible}
      onRequestClose={() => setMenuVisible(false)}
      animationType="fade"
    >
      <Pressable
        style={styles.menuOverlay}
        onPress={() => setMenuVisible(false)}
      >
        <View
          style={[
            styles.menuContainer,
            { backgroundColor: currentTheme.headerBackground, borderColor: currentTheme.borderColor }
          ]}
        >
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleBookmark}
          >
            <Icon name="bookmark-add" size={20} color={currentTheme.textColor} />
            <Text style={[styles.menuItemText, { color: currentTheme.textColor }]}>Bookmark</Text>
          </TouchableOpacity>

          <View style={[styles.menuDivider, { backgroundColor: currentTheme.borderColor }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleMarkForLater}
          >
            <Icon name="watch-later" size={20} color={currentTheme.textColor} />
            <Text style={[styles.menuItemText, { color: currentTheme.textColor }]}>Mark for later</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

  const renderDescription = () => {
    if (!work?.description) return null;

    const maxLines = 3;
    const shouldShowGradient = !isDescriptionExpanded && work.description.length > 150;

    return (
      <View style={styles.descriptionContainer}>
        <View style={styles.descriptionWrapper}>
          <Text
            style={[
              styles.description,
              { color: currentTheme.textColor },
              !isDescriptionExpanded && { maxHeight: maxLines * 20 }
            ]}
            numberOfLines={isDescriptionExpanded ? undefined : maxLines}
          >
            {work.description}
          </Text>

          {shouldShowGradient && (
            <LinearGradient
              colors={[
                `${currentTheme.backgroundColor}00`,
                `${currentTheme.backgroundColor}CC`,
                currentTheme.backgroundColor
              ]}
              style={styles.descriptionGradient}
              pointerEvents="none"
            />
          )}
        </View>

        {(work.description.length > 150 || isDescriptionExpanded) && (
          <TouchableOpacity
            style={styles.expandButton}
            onPress={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
          >
            <Icon
              name={isDescriptionExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
              size={40}
              color={currentTheme.primaryColor}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderActionButtons = () => (
    <View style={styles.actionButtonsContainer}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleAddToLibrary}
      >
        <Icon
          name={inLibrary ? 'bookmark' : 'bookmark-border'}
          size={48}
          color={inLibrary ? currentTheme.primaryColor : currentTheme.iconColor}
        />
        <Text style={[
          styles.actionButtonText,
          { color: inLibrary ? currentTheme.primaryColor : currentTheme.textColor }
        ]}>
          {inLibrary ? 'In Library' : 'Add to Library'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, likeLoading && styles.actionButtonDisabled]}
        onPress={handleLike}
        disabled={likeLoading}
      >
        {likeLoading ? (
          <ActivityIndicator size={24} color={currentTheme.primaryColor} style={{ height: 48 }} />
        ) : (
          <Icon
            name={liked ? 'favorite' : 'favorite-border'}
            size={48}
            color={liked ? '#ef4444' : currentTheme.iconColor}
          />
        )}
        <Text style={[
          styles.actionButtonText,
          { color: liked ? '#ef4444' : currentTheme.textColor },
          likeLoading && { color: currentTheme.secondaryTextColor }
        ]}>
          {likeLoading ? 'Sending...' : (liked ? 'Liked' : 'Like')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleMoreInfo}
      >
        <Icon
          name="info-outline"
          size={48}
          color={currentTheme.iconColor}
        />
        <Text style={[styles.actionButtonText, { color: currentTheme.textColor }]}>
          More Info
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={handleOpenWebView}
      >
        <Icon
          name="open-in-browser"
          size={48}
          color={currentTheme.iconColor}
        />
        <Text style={[styles.actionButtonText, { color: currentTheme.textColor }]}>
          Open in Web
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChapterItem = useCallback(({ item }) => (
    <ChapterItem
      chapter={{ ...item, progress: chapterProgress[item.id] }}
      index={item.originalIndex}
      currentTheme={currentTheme}
      onPress={() => handleChapterPress(item, item.originalIndex)}
    />
  ), [currentTheme, handleChapterPress, chapterProgress]);

  const getItemLayout = useCallback((data, index) => (
    { length: 60, offset: 60 * index, index }
  ), []);

  const ListHeaderComponent = () => (
    <View style={styles.workInfo}>
      <Text style={[styles.workTitle, { color: currentTheme.textColor }]}>
        {work.title}
      </Text>
      <Text style={[styles.workAuthor, { color: currentTheme.secondaryTextColor }]}>
        by {work.author}
      </Text>

      {renderActionButtons()}
      {renderDescription()}

      <View style={[styles.sectionHeader, { borderBottomColor: currentTheme.borderColor, marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
          Chapters
        </Text>
        <Text style={[styles.chapterCount, { color: currentTheme.secondaryTextColor }]}>
          {chapters.length} chapters
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={currentTheme.primaryColor} />
          <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
            Loading work information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={currentTheme.iconColor} />
          <Text style={[styles.errorText, { color: currentTheme.textColor }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={loadWorkData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!work) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: currentTheme.textColor }]}>
            Work not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const continueReading = async function() {
    setIsLoadingContinue(true)
    for (let i = 0; i < chapters.length; i++) {
      let chapter = chapters[i]
      let progress = await progressDAO.get(workId, chapter.id)
      if (progress < 0.97) {
        await handleChapterPress(chapter, i)
        setIsLoadingContinue(false)
        return
      }
    }

    let lastChapter = chapters[chapters.length - 1]
    await handleChapterPress(lastChapter, chapters.length - 1)
    setIsLoadingContinue(false)
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <StatusBar
        backgroundColor={currentTheme.headerBackground}
      />
      <View style={[styles.header, { backgroundColor: currentTheme.headerBackground, borderBottomColor: currentTheme.borderColor }]}>
        <TouchableOpacity onPress={() => setScreens(prev => prev.slice(0, -1))} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.textColor }]} numberOfLines={1}>
          {work.title}
        </Text>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Icon name="more-vert" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
      </View>

      {renderHeaderMenu()}

      <FlatList
        data={[...chapters].map((chapter, originalIndex) => ({ ...chapter, originalIndex })).reverse()}
        renderItem={renderChapterItem}
        keyExtractor={(item) => item.id ? String(item.id) : String(item.originalIndex)}
        ListHeaderComponent={ListHeaderComponent}
        initialNumToRender={10}
        maxToRenderPerBatch={5}
        windowSize={21}
        getItemLayout={getItemLayout}
        contentContainerStyle={styles.chaptersListContentContainer}
        showsVerticalScrollIndicator={false}
      />

      <BookDetailsModal
        book={work ? formatWork(work) : null}
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        mode={modalMode}
        theme={currentTheme}
        onShowAllTags={handleShowAllTags}
        openTagSearch={openTagSearch}
      />

      <CategorySelectionModal
        visible={showCategoryModal}
        categories={categories}
        onSelect={handleCategorySelect}
        onCancel={() => setShowCategoryModal(false)}
        theme={currentTheme}
        title="Add to Collection"
      />

      <TouchableOpacity
        style={[styles.readButtonFab, { backgroundColor: currentTheme.primaryColor }]}
        onPress={() => continueReading()}
      >
        {isLoadingContinue ?
          <ActivityIndicator size="large" color="white" /> :
          <Icon name="play-arrow" size={24} color="white" />
        }
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  workInfo: {
    padding: 16,
    paddingBottom: 0,
  },
  workTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  workAuthor: {
    fontSize: 16,
    marginBottom: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
    minHeight: 80,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
    minWidth: 80,
    flex: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 14,
  },
  descriptionContainer: {
    marginBottom: 8,
  },
  descriptionWrapper: {
    position: 'relative',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  descriptionGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  expandButton: {
    alignSelf: 'center',
    padding: 8,
    marginTop: -15,
    zIndex: 1,
  },
  chaptersListContentContainer: {
    paddingBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  chapterCount: {
    fontSize: 14,
  },
  chapterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  chapterContent: {
    flex: 1,
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  chapterDate: {
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginVertical: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  toast: {
    position: 'absolute',
    top: 40,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  toastText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  readButtonFab: {
    position: 'absolute',
    right: 16,
    bottom: 25,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  floatingButton: {
    flexDirection: 'row',
    display: "flex"
  },
  menuButton: {
    padding: 8,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  menuContainer: {
    position: 'absolute',
    top: 50,
    right: 16,
    borderRadius: 8,
    borderWidth: 1,
    width: 180,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
  },
  menuDivider: {
    height: 1,
    width: '100%',
  }
});

export default ChapterInfoScreen;
