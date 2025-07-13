import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BookCard from '../components/Library/BookCard';

// Simple SVG Sort Icon
const SortIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.1, backgroundColor: color, borderRadius: size * 0.05, marginBottom: size * 0.15 }} />
    <View style={{ width: size * 0.6, height: size * 0.1, backgroundColor: color, borderRadius: size * 0.05, marginBottom: size * 0.15 }} />
    <View style={{ width: size * 0.4, height: size * 0.1, backgroundColor: color, borderRadius: size * 0.05 }} />
  </View>
);

const LibraryScreen = ({
                         searchTerm,
                         setSearchTerm,
                         currentTheme,
                         viewMode,
                         setIsAddWorkModalOpen,
                         libraryDAO,
                         workDAO,
                         setScreens,
                         screens,
                         setActiveScreen,
                         settingsDAO,
                         historyDAO,
                         progressDAO,
                       }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filter and sort state
  const [sortType, setSortType] = useState('lastRead');
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [collections, setCollections] = useState([]);
  const [showSortModal, setShowSortModal] = useState(false);

  const pageSize = 20;

  useEffect(() => {
    if (libraryDAO) {
      loadCollections();
    }
  }, [libraryDAO]);

  useEffect(() => {
    if (libraryDAO && workDAO) {
      loadWorks(true);
    }
  }, [searchTerm, sortType, selectedCollection, libraryDAO, workDAO]);

  const loadCollections = async () => {
    try {
      const collectionList = await libraryDAO.getCollections();
      setCollections(collectionList);
    } catch (err) {
      console.error('Error loading collections:', err);
    }
  };

  const loadWorks = async (reset = false) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setWorks([]);
        setError(null);
      } else {
        setLoadingMore(true);
      }

      const pageToLoad = reset ? 1 : currentPage + 1;

      // Get library entries with pagination and filtering
      let libraryEntries;
      let count;

      if (searchTerm && searchTerm.trim()) {
        setIsSearching(true);
        libraryEntries = await libraryDAO.search(
          searchTerm.trim(),
          pageToLoad,
          pageSize,
          sortType,
          selectedCollection
        );
        count = await libraryDAO.getSearchCount(
          searchTerm.trim(),
          selectedCollection
        );
      } else {
        setIsSearching(false);
        libraryEntries = await libraryDAO.getByPage(
          pageToLoad,
          pageSize,
          sortType,
          selectedCollection
        );
        console.log(libraryEntries);
        count = await libraryDAO.getTotalCount(selectedCollection);
      }

      // Fetch actual work data for each library entry
      const worksWithLibraryData = [];
      for (const entry of libraryEntries) {
        try {
          const work = await workDAO.get(entry.work.id);
          if (work) {
            worksWithLibraryData.push({
              work: work,
              library: entry.library
            });
          }
        } catch (err) {
          console.error(`Error fetching work ${entry.work.id}:`, err);
          // Skip this work if it can't be fetched
        }
      }

      if (reset) {
        setWorks(worksWithLibraryData);
        setTotalCount(count);
      } else {
        setWorks(prevWorks => [...prevWorks, ...worksWithLibraryData]);
      }

      setCurrentPage(pageToLoad);
      setHasMore(libraryEntries.length === pageSize && works.length + worksWithLibraryData.length < count);

    } catch (err) {
      console.error('Error loading worksScreen:', err);
      setError({
        message: err.message || 'Failed to load library',
        details: err.toString()
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorks(true);
  }, [searchTerm, sortType, selectedCollection]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && works.length > 0) {
      loadWorks(false);
    }
  }, [loadingMore, hasMore, works.length]);

  const handleWorkUpdate = useCallback(() => {
    // Reload the current page to reflect changes
    loadWorks(true);
  }, []);

  const handleGoToBrowse = () => {
    setActiveScreen('browse');
  };

  const formatWork = (workData) => {
    const { work, library } = workData;
    return {
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
      currentChapter: work.currentChapter,
      chapterCount: work.chapterCount,
      // Library-specific data
      dateAdded: library.dateAdded,
      collection: library.collection,
      readIndex: library.readIndex,
      lastRead: library.readIndex ? new Date(library.readIndex).toLocaleDateString() : 'Never'
    };
  };

  const handleSortChange = (newSortType) => {
    setSortType(newSortType);
    setShowSortModal(false);
  };

  const handleCollectionFilter = (collection) => {
    setSelectedCollection(collection === selectedCollection ? null : collection);
  };

  const getSortDisplayName = (sort) => {
    switch (sort) {
      case 'lastRead': return 'Last Read';
      case 'alphabetical': return 'Alphabetical';
      case 'dateAdded': return 'Date Added';
      default: return 'Last Read';
    }
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.titleContainer}>
        <View>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            Your Library
          </Text>
          <View style={styles.subtitleContainer}>
            <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
              {totalCount} work{totalCount === 1 ? '' : 's'}
              {selectedCollection && ` in ${selectedCollection}`}
              {isSearching && ` matching "${searchTerm}"`}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}
            onPress={() => setShowSortModal(true)}
          >
            <SortIcon color={currentTheme.textColor} size={16} />
            <Text style={[styles.sortButtonText, { color: currentTheme.textColor }]}>
              {getSortDisplayName(sortType)}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => setIsAddWorkModalOpen(true)}
          >
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Collections Filter */}
      {collections.length > 1 && (
        <View style={styles.collectionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsScroll}>
            <TouchableOpacity
              style={[
                styles.collectionChip,
                { backgroundColor: selectedCollection === null ? currentTheme.primaryColor : currentTheme.cardBackground },
                { borderColor: currentTheme.borderColor }
              ]}
              onPress={() => handleCollectionFilter(null)}
            >
              <Text style={[
                styles.collectionChipText,
                { color: selectedCollection === null ? 'white' : currentTheme.textColor }
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {collections.map((collection) => (
              <TouchableOpacity
                key={collection}
                style={[
                  styles.collectionChip,
                  { backgroundColor: selectedCollection === collection ? currentTheme.primaryColor : currentTheme.cardBackground },
                  { borderColor: currentTheme.borderColor }
                ]}
                onPress={() => handleCollectionFilter(collection)}
              >
                <Text style={[
                  styles.collectionChipText,
                  { color: selectedCollection === collection ? 'white' : currentTheme.textColor }
                ]}>
                  {collection}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
        <Text style={[styles.footerText, { color: currentTheme.secondaryTextColor }]}>
          Loading more works...
        </Text>
      </View>
    );
  };

  const renderSortModal = () => (
    <Modal
      transparent={true}
      visible={showSortModal}
      onRequestClose={() => setShowSortModal(false)}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setShowSortModal(false)}
      >
        <View style={[styles.sortModal, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
          <Text style={[styles.sortModalTitle, { color: currentTheme.textColor }]}>
            Sort by
          </Text>
          {[
            { key: 'lastRead', label: 'Last Read' },
            { key: 'alphabetical', label: 'Alphabetical' },
            { key: 'dateAdded', label: 'Date Added' }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                { backgroundColor: sortType === option.key ? currentTheme.primaryColor + '20' : 'transparent' }
              ]}
              onPress={() => handleSortChange(option.key)}
            >
              <Text style={[
                styles.sortOptionText,
                { color: sortType === option.key ? currentTheme.primaryColor : currentTheme.textColor }
              ]}>
                {option.label}
              </Text>
              {sortType === option.key && (
                <Icon name="check" size={20} color={currentTheme.primaryColor} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const isCloseToBottom = ({ layoutMeasurement, contentOffset, contentSize }) => {
    const paddingToBottom = 100;
    return layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading library...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={[styles.errorContainer, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
          <Text style={[styles.errorTitle, { color: currentTheme.textColor }]}>
            Failed to Load Library
          </Text>
          <Text style={[styles.errorMessage, { color: currentTheme.secondaryTextColor }]}>
            {error.message}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => loadWorks(true)}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: currentTheme.backgroundColor }}>
      <ScrollView
        style={styles.mainContent}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.primaryColor]}
            tintColor={currentTheme.primaryColor}
          />
        }
        onScroll={({ nativeEvent }) => {
          if (isCloseToBottom(nativeEvent)) {
            handleLoadMore();
          }
        }}
        scrollEventThrottle={400}
      >
        {renderHeader()}

        {works.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="library-books" size={64} color={currentTheme.placeholderColor} />
            <Text style={[styles.emptyTitle, { color: currentTheme.textColor }]}>
              {isSearching ? 'No matches found' : 'Your library is empty'}
            </Text>
            <Text style={[styles.emptyText, { color: currentTheme.secondaryTextColor }]}>
              {isSearching
                ? `No works found matching "${searchTerm}"`
                : 'Browse and add some worksScreen to get started!'
              }
            </Text>
            {!isSearching && (
              <TouchableOpacity
                style={[styles.addFirstButton, { backgroundColor: currentTheme.primaryColor }]}
                onPress={handleGoToBrowse}
              >
                <Text style={styles.addFirstButtonText}>Browse Works</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {works.map((workData) => (
              <BookCard
                key={workData.work.id}
                book={formatWork(workData)}
                viewMode={viewMode}
                theme={currentTheme}
                onUpdate={handleWorkUpdate}
                setScreens={setScreens}
                screens={screens}
                libraryDAO={libraryDAO}
                workDAO={workDAO}
                isInLibrary={true}
                settingsDAO={settingsDAO}
                historyDAO={historyDAO}
                progressDAO={progressDAO}
              />
            ))}
            {renderFooter()}
          </>
        )}
      </ScrollView>

      {renderSortModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  headerContainer: {
    marginBottom: 20,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleContainer: {
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  sortButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionsContainer: {
    marginBottom: 8,
  },
  collectionsScroll: {
    flexDirection: 'row',
  },
  collectionChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  collectionChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: '90%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFirstButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sortModal: {
    width: '80%',
    maxWidth: 300,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
  },
  sortModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  sortOptionText: {
    fontSize: 16,
  },
});

export default LibraryScreen;
