import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  FlatList,
  Linking,
  Modal,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import BookDetailsModal from '../components/Library/BookDetailsModal';
import { fetchWorkFromWorkID } from '../web/worksScreen/fetchWork';
import { fetchChapterWithTheme } from '../web/worksScreen/fetchChapter';
import ChapterReader from './chapterReader';
import {
  navigateToNextChapter,
  navigateToPreviousChapter,
} from '../utils/ChapterNavigationHelpers';
import sendKudo from '../web/other/kudoRequest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CategorySelectionModal from '../components/WorkScreen/CategorySelectionModal';
import { markForLater } from '../web/other/markedLater';
import Toast from 'react-native-toast-message';
import { bookmark } from '../web/other/bookmarks';
import { normalizeWorkData } from '../storage/dao/WorkDAO';
import { getJsonSettings } from '../storage/jsonSettings';
import UserInfoScreen from './UserInfo';
import { processQueue } from '../downloads/DownloadManager';
import {
  addToDownloadQueue,
  getDownloadQueue,
} from '../downloads/DownloadQueue';
import {
  deleteDownloaded,
  isDownloaded,
} from '../downloads/Downloader';
import { WorkDescription } from '../components/WorkScreen/DescriptionComponent';

const ITEM_HEIGHT_COMPACT = 56;
const ITEM_HEIGHT_EXPANDED = 72;

const ChapterItem = React.memo(({ chapter, index, currentTheme, onPress, showDate }) => {
  const [isInQueue, setIsInQueue] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isDownloadedFile, setIsDownloadedFile] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const isMounted = useRef(true);

  const hasProgress = chapter.progress !== undefined && chapter.progress !== null;
  const isRead = hasProgress && chapter.progress >= 0.98;

  const dateText = chapter.date || "";
  const progressText = hasProgress ? `${(chapter.progress * 100).toFixed(0)}%` : "";

  const subtitleParts = [];
  if (dateText) {
    const date = new Date(parseInt(dateText, 10));
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    subtitleParts.push(`${month}/${day}/${year}`); //TODO: Modify this if not in the US cuz ima go crazy, I can't read that fr
  }
  if (showDate && hasProgress) subtitleParts.push(progressText);
  const subtitleToRender = subtitleParts.join(" | ");

  useEffect(() => {
    isMounted.current = true;
    const checkStatus = async () => {
      if (!chapter.workId || !chapter.id) return;
      const queue = await getDownloadQueue();
      const failedJson = await AsyncStorage.getItem('failedDownloads');
      const failedList = failedJson ? JSON.parse(failedJson) : [];
      const exists = await isDownloaded(chapter.workId, chapter.id);

      if (isMounted.current) {
        setIsInQueue(queue.some(q => String(q.chapterId) === String(chapter.id)));
        setHasFailed(failedList.some(f => String(f.chapterId) === String(chapter.id)));
        setIsDownloadedFile(exists);
      }
    };
    checkStatus();

    const qSub = DeviceEventEmitter.addListener('queue_updated', (q) => {
      if (isMounted.current) {
        setIsInQueue(q.some(item => String(item.chapterId) === String(chapter.id)));
      }
    });

    const fSub = DeviceEventEmitter.addListener('failures_updated', (f) => {
      if (isMounted.current) {
        setHasFailed(f.some(item => String(item.chapterId) === String(chapter.id)));
      }
    });

    const cSub = DeviceEventEmitter.addListener('download_completed', (data) => {
      if (isMounted.current && String(data.chapterId) === String(chapter.id)) {
        setIsInQueue(false);
        setIsDownloadedFile(data.success);
        if (!data.success) setHasFailed(true);
      }
    });

    const rSub = DeviceEventEmitter.addListener('chapter_deleted', (data) => {
      if (isMounted.current && String(data.chapterId) === String(chapter.id)) {
        setIsInQueue(false);
        setIsDownloadedFile(!data.success);
        if (!data.success) setHasFailed(true);
      }
    });

    return () => {
      isMounted.current = false;
      qSub.remove();
      fSub.remove();
      cSub.remove();
      rSub.remove();
    };
  }, [chapter.id, chapter.workId]);

  const handleDownloadPress = async () => {
    if (isInQueue) return;
    if (isDownloadedFile) {
      if (showDelete) {
        try {
          setIsInQueue(true);
          await deleteDownloaded(chapter.workId, chapter.id);
          setIsDownloadedFile(false);
          setShowDelete(false);
        } catch (error) {
          Toast.show({ type: "error", text1: "Error deleting", text2: error.message });
        } finally {
          if (isMounted.current) setIsInQueue(false);
        }
      } else {
        setShowDelete(true);
        setTimeout(() => {
          if (isMounted.current) setShowDelete(false);
        }, 3000);
      }
      return;
    }

    if (hasFailed) {
      const failedJson = await AsyncStorage.getItem('failedDownloads');
      const failedList = failedJson ? JSON.parse(failedJson) : [];
      const newList = failedList.filter(f => String(f.chapterId) !== String(chapter.id));
      await AsyncStorage.setItem('failedDownloads', JSON.stringify(newList));
      setHasFailed(false);
      DeviceEventEmitter.emit('failures_updated', newList);
    }

    setIsInQueue(true);
    await addToDownloadQueue({ workId: chapter.workId, chapterId: chapter.id });
    processQueue();
  };

  const renderDownloadIcon = () => {
    if (isInQueue) return <ActivityIndicator size="small" color={currentTheme.primaryColor} />;
    if (isDownloadedFile && showDelete) return <Icon name="delete" size={24} color={currentTheme.warningBackground} />;
    if (isDownloadedFile) return <Icon name="check-circle" size={24} color={currentTheme.primaryColor} />;
    if (hasFailed) return <Icon name="error-outline" size={24} color="#ef4444" />;
    return <Icon name="download" size={24} color={currentTheme.secondaryTextColor} />;
  };

  return (
    <TouchableOpacity
      style={[
        styles.chapterItem,
        {
          borderBottomColor: currentTheme.inputBackground,
          borderBottomWidth: 1,
          height: showDate ? ITEM_HEIGHT_EXPANDED : ITEM_HEIGHT_COMPACT
        }
      ]}
      onPress={onPress}
    >
      <View style={styles.chapterContent}>
        <Text
          numberOfLines={1}
          style={[
            styles.chapterTitle,
            { color: isRead ? currentTheme.secondaryTextColor : currentTheme.textColor }
          ]}
        >
          {chapter.name || `Chapter ${index + 1}`}
        </Text>
        {showDate && (
          <Text
            numberOfLines={1}
            style={[styles.chapterDate, { color: currentTheme.secondaryTextColor }]}
          >
            {subtitleToRender || " "}
          </Text>
        )}
      </View>

      <View style={styles.rightActionContainer}>
        {!showDate && hasProgress && (
          <Text style={[styles.progressRight, { color: currentTheme.secondaryTextColor }]}>
            {progressText}
          </Text>
        )}

        <TouchableOpacity
          hitSlop={{ top: 20, bottom: 20, left: 10, right: 10 }}
          onPress={handleDownloadPress}
          disabled={isInQueue}
          style={styles.downloadIconWrapper}
        >
          {renderDownloadIcon()}
        </TouchableOpacity>

        <Icon name="chevron-right" size={20} color={currentTheme.iconColor} style={styles.chevron} />
      </View>
    </TouchableOpacity>
  );
});


const ReaderWrapper = ({
                         initialChapterData,
                         currentTheme,
                         setScreens,
                         screens,
                         chapterList,
                         historyDAO,
                         progressDAO,
                         settingsDAO,
                         jsonSettings,
                         libraryDAO,
                         chapterDAO,
                         kudoHistoryDAO,
                         workDAO,
                       }) => {
  const [chapterData, setChapterData] = useState(initialChapterData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(undefined);

  const handleBack = () => {
    setScreens(prev => prev.slice(0, -1));
  };

  const handleChapterChange = (newChapterData) => {
    setError(false)
    if (newChapterData) {
      setChapterData(prevData => ({
        ...newChapterData,
        workTitle: prevData.workTitle
      }));
    }
    setLoading(false);
  };

  const handleNextChapter = useCallback(async () => {
    try {
      if (loading || !chapterData.hasNextChapter) return;
      setError();
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

      if (jsonSettings.downloadWhileReading && await libraryDAO.isInLibrary(chapterData.workId)) {
        for (let i = 0; i < jsonSettings.downloadWhileReading; i++) {
          const index = chapterData.chapterIndex + 2 + i;
          if (chapterList.length <= index) break;
          await addToDownloadQueue({ workId: chapterData.workId, chapterId: chapterList[index].id });
        }
        processQueue();
      }

    } catch (error) {
      console.log(error);
      setError(error);
    }
  }, [loading, chapterData, chapterList, currentTheme, historyDAO, settingsDAO]);

  const handlePreviousChapter = useCallback(async () => {
    try {
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
    } catch (error) {
      console.log(error);
      setError(error);
    }
  }, [loading, chapterData, chapterList, currentTheme, historyDAO, settingsDAO]);

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.errorContainer}>
          <Icon name="error-outline" size={48} color={currentTheme.iconColor} />
          <Text style={[styles.errorText, { color: currentTheme.textColor }]}>
            {error.toString()}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => handleChapterChange(chapterData)}
          >
            <Text style={styles.retryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          chapterDAO={chapterDAO}
          kudoHistoryDAO={kudoHistoryDAO}
          libraryDAO={libraryDAO}
          setScreens={setScreens}
          workDAO={workDAO}
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
                             openTagSearch,
                             url,
                             chapterDAO
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
  const [downloadMenuVisible, setDownloadMenuVisible] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [loadChapterRef, setLoadChapterRef] = useState(loadChapter);

  const [jsonSettings, setJsonSettings] = useState();

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
    getJsonSettings().then((settings) => {
      if (settings?.showChapterDate !== undefined) {
        setShowDate(settings.showChapterDate);
      }
      setJsonSettings(settings);
    });
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
        await workDAO.add(normalizeWorkData(work));
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

      const [workData, progressData] = await Promise.all([
        fetchWorkFromWorkID(workId, workDAO, chapterDAO),
        progressDAO.getProgressList(workId),
      ]);

      if (!workData) throw new Error("Could not fetch work data");

      setWork(workData);
      setChapters(workData.chapters);

      const progressMap = progressData.reduce((acc, item) => {
        acc[item.chapterID] = item.progress;
        return acc;
      }, {});
      setChapterProgress(progressMap);

      const hasLoadChapterIndex = typeof loadChapter === 'number';

      const chapterUrlMatch = url ? url.match(/\/chapters\/(\d+)/) : null;
      const hasUrlTrigger = !!chapterUrlMatch;

      if ((hasLoadChapterIndex && workData.chapters && workData.chapters[loadChapter]) || hasUrlTrigger) {

        let chapterToLoad;
        let actualIndex = -1;

        if (hasLoadChapterIndex) {
          chapterToLoad = workData.chapters[loadChapter];
          actualIndex = loadChapter;
        }
        else if (hasUrlTrigger) {
          const chapterId = chapterUrlMatch[1];

          chapterToLoad = workData.chapters.find((ch) => String(ch.id) === String(chapterId));
          actualIndex = workData.chapters.findIndex((ch) => String(ch.id) === String(chapterId));

          console.log("URL Load Debug:", { url, extractedId: chapterId, found: !!chapterToLoad });
        }

        if (chapterToLoad && actualIndex !== -1 && actualIndex !== 0) {
          const chapterContent = await fetchChapterWithTheme(workId, chapterToLoad.id, currentTheme, settingsDAO);

          if (chapterContent) {
            const initialChapterData = {
              workId: workId,
              workTitle: workData.title,
              chapterId: chapterToLoad.id,
              chapterTitle: chapterToLoad.name,
              htmlContent: chapterContent,
              chapterIndex: actualIndex,
              hasNextChapter: actualIndex < workData.chapters.length - 1,
              hasPreviousChapter: actualIndex > 0,
            };

            const chapterListForNav = workData.chapters.map((c) => ({ id: c.id, title: c.name }));

            setScreens((prevScreens) => {
              const stackWithoutCurrent = prevScreens.slice(0, -1);

              const cleanHistoryScreen = (
                <ChapterInfoScreen
                  key={`${workId}_clean`}
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
                  loadChapter={null}
                  url={null}
                  chapterDAO={chapterDAO}
                />
              );

              const readerScreen = (
                <ReaderWrapper
                  key={`reader_${chapterToLoad.id}`}
                  initialChapterData={initialChapterData}
                  currentTheme={currentTheme}
                  setScreens={setScreens}
                  chapterList={chapterListForNav}
                  settingsDAO={settingsDAO}
                  historyDAO={historyDAO}
                  progressDAO={progressDAO}
                  jsonSettings={jsonSettings}
                  libraryDAO={libraryDAO}
                  chapterDAO={chapterDAO}
                  kudoHistoryDAO={kudoHistoryDAO}
                  workDAO={workDAO}
                />
              );

              return [...stackWithoutCurrent, cleanHistoryScreen, readerScreen];
            });

            return;
          }
        } else {
          console.log("Could not find chapter from URL. Staying on Info Screen.");
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
      chapterContent = await fetchChapterWithTheme(workId, chapter.id, currentTheme, settingsDAO);

      if (!chapterContent) {
        showToast('Failed to load chapter', 'error')
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
          jsonSettings={jsonSettings}
          libraryDAO={libraryDAO}
          chapterDAO={chapterDAO}
          kudoHistoryDAO={kudoHistoryDAO}
          workDAO={workDAO}
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
    descriptionHTML: work.descriptionHTML,
    lastUpdated: work.updated ? new Date(work.updated).toLocaleDateString() : 'Unknown',
    likes: work.kudos,
    bookmarks: work.bookmarks,
    views: work.hits,
    language: work.language,
  }), []);

  function getTextForNb(nb) {
    switch (nb) {
      case 1:
        return "Next chapter"
      case -1:
        return "Unread"
      case -2:
        return "All"
      default:
        return `Next ${nb} chapters`
    }
  }

  const menuDownloadButton = (nb) => {
    return (
      <TouchableOpacity
        style={styles.menuItem}
        onPress={() => downloadNextChapters(nb)}
        key={nb}
      >
        <Icon name="download" size={20} color={currentTheme.textColor} />
        <Text style={[styles.menuItemText, { color: currentTheme.textColor }]}>{getTextForNb(nb)}</Text>
      </TouchableOpacity>
    )
  }

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

  const renderDownloadHeaderMenu = () => (
    <Modal
      transparent={true}
      visible={downloadMenuVisible}
      onRequestClose={() => setDownloadMenuVisible(false)}
      animationType="fade"
    >
      <Pressable
        style={styles.menuOverlay}
        onPress={() => setDownloadMenuVisible(false)}
      >
        <View
          style={[
            styles.menuContainer,
            { backgroundColor: currentTheme.headerBackground, borderColor: currentTheme.borderColor }
          ]}
        >

          {[1, 5, 10, 25, -1, -2].map(menuDownloadButton)}

          <View style={[styles.menuDivider, { backgroundColor: currentTheme.borderColor }]} />

          <TouchableOpacity
            style={styles.menuItem}
            onPress={deleteAllChapters}
          >
            <Icon name="delete" size={20} color={currentTheme.textColor} />
            <Text style={[styles.menuItemText, { color: currentTheme.textColor }]}>Delete all</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );

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
      chapter={{ ...item, workId: workId, progress: chapterProgress[item.id] }}
      index={item.originalIndex}
      currentTheme={currentTheme}
      onPress={() => handleChapterPress(item, item.originalIndex)}
      showDate={showDate}
    />
  ), [currentTheme, handleChapterPress, chapterProgress, showDate, workId]);

  const getItemLayout = useCallback((data, index) => {
    const itemHeight = showDate ? ITEM_HEIGHT_EXPANDED : ITEM_HEIGHT_COMPACT;
    return { length: itemHeight, offset: itemHeight * index, index };
  }, [showDate]);

  const ListHeaderComponent = useMemo(() => (
    <View style={styles.workInfo}>
      <Text style={[styles.workTitle, { color: currentTheme.textColor }]}>
        {work?.title}
      </Text>
      <TouchableOpacity
        onPress={() => {
          setScreens(p => [...p,
            <UserInfoScreen
              username={work?.author}
              currentTheme={currentTheme}
              setScreens={setScreens}
              onBack={() => setScreens(prev => prev.slice(0, -1))}
              settingsDAO={settingsDAO}
              historyDAO={historyDAO}
              progressDAO={progressDAO}
              kudoHistoryDAO={kudoHistoryDAO}
              libraryDAO={libraryDAO}
              workDAO={workDAO}
              chapterDAO={chapterDAO}
            />
          ])
        }}
      >
        <Text style={[styles.workAuthor, { color: currentTheme.secondaryTextColor }]}>
          by {work?.author}
        </Text>
      </TouchableOpacity>

      {renderActionButtons()}
      <WorkDescription
        work={work}
        currentTheme={currentTheme}
        jsonSettings={jsonSettings}
      />

      <View style={[styles.sectionHeader, { borderBottomColor: currentTheme.borderColor, marginTop: 8 }]}>
        <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
          Chapters
        </Text>
        <Text style={[styles.chapterCount, { color: currentTheme.secondaryTextColor }]}>
          {chapters.length} chapters
        </Text>
      </View>
    </View>
  ), [work, currentTheme, chapters, jsonSettings, inLibrary, liked, likeLoading, setScreens]);

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

  async function getContinueChapter() {
    for (let i = 0; i < chapters.length; i++) {
      let chapter = chapters[i];
      let progress = await progressDAO.get(workId, chapter.id);
      if (progress < 0.97) {
        return [chapter, i];
      }
    }
  }

  async function downloadNextChapters(nb) {
    setDownloadMenuVisible(false);
    let startIndex = 0;

    if (nb === -2) {
      startIndex = 0;
    } else {
      const result = await getContinueChapter();
      if (!result) {
        console.log("Book is finished or fully read.");
        return;
      }
      startIndex = result[1];
    }

    const chapToDl = [];
    let chaptersFound = 0;
    let currentIndex = startIndex;

    while (currentIndex < chapters.length) {

      if (nb > 0 && chaptersFound >= nb) {
        break;
      }

      const chapter = chapters[currentIndex];
      const chId = chapter.id;
      console.log(chapter);

      const alreadyDownloaded = await isDownloaded(workId, chId);

      if (!alreadyDownloaded) {
        chapToDl.push({ workId: workId, chapterId: chId });
        chaptersFound++;
      }

      currentIndex++;
    }

    if (chapToDl.length > 0) {
      console.log(`Adding ${chapToDl.length} chapters to queue.`);
      await addToDownloadQueue(chapToDl);
      showToast(`Added ${chapToDl.length} chapters to dl list.`, 'success');
      await processQueue();
    } else {
      showToast("No new chapters to download", 'error');
    }

    setDownloadMenuVisible(false);
  }

  async function deleteAllChapters() {
    setDownloadMenuVisible(false);
    for (const chapter of chapters) {
      if (await isDownloaded(workId, chapter.id)) {
        await deleteDownloaded(workId, chapter.id);
      }
    }
  }

  const continueReading = async function()  {
    setIsLoadingContinue(true);

    const result = await getContinueChapter();

    if (result) {
      const [chapter, toLoad] = result;
      await handleChapterPress(chapter, toLoad);
      setIsLoadingContinue(false);
      return;
    }

    let lastChapter = chapters[chapters.length - 1];
    await handleChapterPress(lastChapter, chapters.length - 1);
    setIsLoadingContinue(false);
  };

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
        <TouchableOpacity onPress={() => setDownloadMenuVisible(true)} style={styles.menuButton}>
          <Icon name="download" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setMenuVisible(true)} style={styles.menuButton}>
          <Icon name="more-vert" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
      </View>

      {renderHeaderMenu()}
      {renderDownloadHeaderMenu()}

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
    marginTop: 10,
    paddingHorizontal: 16,
    position: 'relative',
    // Ensure no 'flex: 1' here usually
  },
  hiddenMeasurer: {
    position: 'absolute',
    top: 0,
    left: 16, // Must match paddingHorizontal of container
    right: 16,
    opacity: 0,
    zIndex: -10,
  },
  descriptionWrapper: {
    width: '100%',
    overflow: 'hidden', // Essential for the fold effect
    position: 'relative',
  },
  contentPadding: {
    paddingBottom: 10,
  },
  innerContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  measureHelper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
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
    height: 60,
    zIndex: 2,
  },
  expandButton: {
    alignSelf: 'center',
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
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
    justifyContent: 'space-between',
  },
  chapterContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  rightProgressContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginRight: 4,
  },
  progressRight: {
    fontSize: 12,
    fontWeight: '500',
    marginRight: 8,
    minWidth: 35,
    textAlign: 'right',
  },
  chapterTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 0,
  },
  chapterDate: {
    fontSize: 12,
    marginTop: 4,
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
  },
  downloadContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  downloadIconWrapper: {
    padding: 4,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
});

export default ChapterInfoScreen;