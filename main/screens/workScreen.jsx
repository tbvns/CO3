import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  FlatList,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LinearGradient } from 'react-native-linear-gradient';
import BookDetailsModal from '../components/Library/BookDetailsModal';
import { fetchChapters } from '../web/browse/fetchChapters';
import { fetchWorkFromWorkID } from '../web/browse/fetchWork';

const ChapterItem = React.memo(({ chapter, index, currentTheme, onPress }) => (
  <TouchableOpacity
    style={[styles.chapterItem, { borderBottomColor: currentTheme.borderColor }]}
    onPress={onPress}
  >
    <View style={styles.chapterContent}>
      <Text style={[styles.chapterTitle, { color: currentTheme.textColor }]}>
        {chapter.name || `Chapter ${index + 1}`}
      </Text>
      {chapter.date && (
        <Text style={[styles.chapterDate, { color: currentTheme.secondaryTextColor }]}>
          {chapter.date}
        </Text>
      )}
    </View>
    <Icon
      name="chevron-right"
      size={20}
      color={currentTheme.iconColor}
    />
  </TouchableOpacity>
));

const ChapterInfoScreen = ({
                             workId,
                             currentTheme,
                           }) => {
  const [work, setWork] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState('summary');
  const [inLibrary, setInLibrary] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    loadWorkData();
  }, [workId]);

  const loadWorkData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [workData, chaptersData] = await Promise.all([
        fetchWorkFromWorkID(workId),
        fetchChapters(workId)
      ]);

      setWork(workData);
      setChapters(chaptersData);

    } catch (err) {
      console.error('Error loading work data:', err);
      setError(err.message || 'Failed to load work data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToLibrary = useCallback(() => {
    setInLibrary(prevInLibrary => !prevInLibrary);
    //todo Add to library
  }, []); // Depend on nothing for functional update

  const handleLike = useCallback(() => {
    setLiked(prevLiked => !prevLiked);
    //todo Kudo request and all of that...
  }, []); // Depend on nothing for functional update

  const handleMoreInfo = useCallback(() => {
    setModalMode('full');
    setModalVisible(true);
  }, []);

  const handleShowAllTags = useCallback(() => {
    setModalMode('allTags');
    setModalVisible(true);
  }, []);

  const handleOpenWebView = useCallback(() => {
    //todo Open a webview
  }, []);

  const handleChapterPress = useCallback((chapter, index) => {
    //todo open a webview
    console.log(`Opening chapter: ${chapter.name || `Chapter ${index + 1}`}`);
  }, []);

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
        style={styles.actionButton}
        onPress={handleLike}
      >
        <Icon
          name={liked ? 'favorite' : 'favorite-border'}
          size={48}
          color={liked ? '#ef4444' : currentTheme.iconColor}
        />
        <Text style={[
          styles.actionButtonText,
          { color: liked ? '#ef4444' : currentTheme.textColor }
        ]}>
          {liked ? 'Liked' : 'Like'}
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

  // Helper function to render each chapter item for FlatList
  const renderChapterItem = useCallback(({ item, index }) => (
    <ChapterItem
      chapter={item}
      index={index}
      currentTheme={currentTheme}
      onPress={() => handleChapterPress(item, index)}
    />
  ), [currentTheme, handleChapterPress]); // Dependencies for useCallback

  // Calculate item layout for FlatList performance
  const getItemLayout = useCallback((data, index) => (
    // Assuming each chapter item has a consistent height. Adjust '60' if needed.
    // This value includes padding, text height, etc. You might need to measure it accurately.
    { length: 60, offset: 60 * index, index }
  ), []);

  // Header component for FlatList to include work details
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      <View style={[styles.header, { backgroundColor: currentTheme.backgroundColor, borderBottomColor: currentTheme.borderColor }]}>
        <TouchableOpacity /*todo implement back button*/ /*onPress={}*/ style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={currentTheme.iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: currentTheme.textColor }]} numberOfLines={1}>
          {work.title}
        </Text>
      </View>

      {/* Replaced ScrollView for chapters with FlatList */}
      <FlatList
        data={chapters}
        renderItem={renderChapterItem}
        keyExtractor={(item, index) => item.id ? String(item.id) : String(index)}
        ListHeaderComponent={ListHeaderComponent} // The top section now acts as the header for the FlatList
        // Performance optimizations
        initialNumToRender={10} // Render more items initially to fill the screen
        maxToRenderPerBatch={5} // Control how many items are rendered in each batch
        windowSize={21} // Maintain a certain number of items in memory (current + 10 above/below)
        getItemLayout={getItemLayout} // Essential for smooth scrolling with many items
        contentContainerStyle={styles.chaptersListContentContainer} // Apply styles to the content container
        showsVerticalScrollIndicator={false}
      />

      <BookDetailsModal
        book={work ? formatWork(work) : null}
        isOpen={modalVisible}
        onClose={() => setModalVisible(false)}
        mode={modalMode}
        theme={currentTheme}
        onShowAllTags={handleShowAllTags}
      />
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
  chaptersListContentContainer: { // Added style for FlatList content
    paddingBottom: 16, // Add some padding at the bottom of the list
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
});

export default ChapterInfoScreen;
