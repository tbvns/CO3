import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchFilteredWorks } from '../web/browse/fetchWorks';
import BookCard from '../components/Library/BookCard';
import AdvancedSearchScreen from './advancedSearch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FilterIcon = ({ color, size }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <View
      style={{
        width: size,
        height: size * 0.15,
        backgroundColor: color,
        borderRadius: size * 0.05,
        marginBottom: size * 0.1,
      }}
    />
    <View
      style={{
        width: size * 0.66,
        height: size * 0.15,
        backgroundColor: color,
        borderRadius: size * 0.05,
        marginBottom: size * 0.1,
      }}
    />
    <View
      style={{
        width: size * 0.33,
        height: size * 0.15,
        backgroundColor: color,
        borderRadius: size * 0.05,
      }}
    />
  </View>
);

const ClearIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size * 0.8, height: size * 0.1, backgroundColor: color, borderRadius: size * 0.05, transform: [{ rotate: '45deg' }] }} />
    <View style={{ width: size * 0.8, height: size * 0.1, backgroundColor: color, borderRadius: size * 0.05, transform: [{ rotate: '-45deg' }], position: 'absolute' }} />
  </View>
);

const BrowseScreen = ({ currentTheme, viewMode = 'med', setScreens, screens, libraryDAO, workDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, openTagSearch, selectedTag, setSelectedTag }) => {
  const insets = useSafeAreaInsets();

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState({});
  const [hasFilters, setHasFilters] = useState(false);

  const loadWorks = useCallback(async (reset = false) => {
    if (!reset && Object.keys(appliedFilters).length === 0) return;

    if (loadingMore && !reset) return;
    if (!reset && !hasMore) return;

    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
        setWorks([]);
        setHasMore(true);
      } else {
        setLoadingMore(true);
      }

      setError(null);

      const pageToLoad = reset ? 1 : currentPage + 1;

      const result = await fetchFilteredWorks(appliedFilters, pageToLoad);
      const newWorks = result.works || [];

      const isLastPage = newWorks.length < 20;

      if (reset) {
        setWorks(newWorks);
      } else {
        setWorks(prevWorks => {
          const existingIds = new Set(prevWorks.map(w => w.id));
          const uniqueNewWorks = newWorks.filter(w => !existingIds.has(w.id));
          return [...prevWorks, ...uniqueNewWorks];
        });
      }

      setCurrentPage(pageToLoad);

      if (Object.keys(appliedFilters).length === 0) {
        setHasMore(false);
      } else if (isLastPage) {
        setHasMore(false);
      }

    } catch (err) {
      console.error('Error loading worksScreen:', err);
      if (reset) {
        setError({
          message: err.message || 'Failed to load worksScreen',
          status: err.response?.status || 'Unknown',
          statusText: err.response?.statusText || 'Network Error'
        });
      } else {
        setHasMore(false);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, [appliedFilters, currentPage, hasMore, loadingMore]);

  useEffect(() => {
    loadWorks(true);
  }, [appliedFilters]);

  useEffect(() => {
    if (selectedTag != null) {
      const filters = {};
      filters["work_search[freeform_names]"] = selectedTag;
      setAppliedFilters(filters);
      setHasFilters(true);
      setSelectedTag(null)
    }
  }, [openTagSearch, selectedTag, setSelectedTag]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorks(true);
  }, [loadWorks]);

  const handleLoadMore = useCallback(() => {
    if (Object.keys(appliedFilters).length === 0) return;

    if (!loading && !loadingMore && hasMore && works.length > 0) {
      loadWorks(false);
    }
  }, [loading, loadingMore, hasMore, works.length, loadWorks, appliedFilters]);

  const handleSearchFilters = (filters) => {
    setAppliedFilters(filters);
    setHasFilters(Object.keys(filters).length > 0);
    setIsSearchVisible(false);
  };

  const handleClearFilters = () => {
    Alert.alert(
      "Clear Filters",
      "Are you sure you want to clear all filters?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: () => {
            setAppliedFilters({});
            setHasFilters(false);
          }
        }
      ]
    );
  };

  const formatWork = (work) => {
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
    };
  };

  const getFilterSummary = () => {
    if (!hasFilters) return '';
    const filterCount = Object.keys(appliedFilters).length;
    return `${filterCount} filter${filterCount === 1 ? '' : 's'} applied`;
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          Browse Works
        </Text>
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
            {works.length} works loaded
          </Text>
          {hasFilters && (
            <Text style={[styles.filterStatus, { color: currentTheme.primaryColor }]}>
              • {getFilterSummary()}
            </Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderFooter = () => {
    if (loadingMore) {
      return (
        <View style={styles.footerLoader}>
          <ActivityIndicator size="small" color={currentTheme.primaryColor} />
          <Text style={[styles.footerText, { color: currentTheme.secondaryTextColor }]}>
            Loading next page...
          </Text>
        </View>
      );
    }

    if (!hasMore && works.length > 0 && hasFilters) {
      return (
        <View style={styles.footerLoader}>
          <Text style={[styles.footerText, { color: currentTheme.placeholderColor }]}>
            No more works to load
          </Text>
        </View>
      );
    }

    return null;
  };

  const renderItem = ({ item }) => (
    <BookCard
      book={formatWork(item)}
      viewMode={viewMode}
      theme={currentTheme}
      onUpdate={() => {}}
      setScreens={setScreens}
      screens={screens}
      libraryDAO={libraryDAO}
      workDAO={workDAO}
      settingsDAO={settingsDAO}
      historyDAO={historyDAO}
      progressDAO={progressDAO}
      kudoHistoryDAO={kudoHistoryDAO}
      openTagSearch={openTagSearch}
    />
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading works...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={[styles.errorContainer, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
          <Text style={[styles.errorTitle, { color: currentTheme.textColor }]}>
            Failed to Load Works
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
    <View style={{flex: 1, backgroundColor: currentTheme.backgroundColor}}>
      <FlatList
        data={works}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.contentContainer}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[currentTheme.primaryColor]}
            tintColor={currentTheme.primaryColor}
          />
        }
      />

      {/* Filter FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: currentTheme.primaryColor, bottom: 100 + insets.bottom }]}
        onPress={() => setIsSearchVisible(true)}
      >
        <FilterIcon color="white" size={24} />
      </TouchableOpacity>

      {/* Clear Filters FAB */}
      {hasFilters && (
        <TouchableOpacity
          style={[styles.clearFab, { backgroundColor: currentTheme.secondaryColor || '#ff6b6b', bottom: 170 + insets.bottom }]}
          onPress={handleClearFilters}
        >
          <ClearIcon color="white" size={20} />
        </TouchableOpacity>
      )}

      <Modal
        transparent={false}
        visible={isSearchVisible}
        onRequestClose={() => setIsSearchVisible(false)}
      >
        <AdvancedSearchScreen
          currentTheme={currentTheme}
          onClose={() => setIsSearchVisible(false)}
          onSearch={handleSearchFilters}
          savedFilters={appliedFilters}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    padding: 16,
    paddingBottom: 150,
  },
  headerContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  filterStatus: {
    fontSize: 14,
    marginLeft: 8,
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
    marginBottom: 8,
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
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footerLoader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginBottom: 20,
  },
  footerText: {
    marginLeft: 10,
    fontSize: 14,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clearFab: {
    position: 'absolute',
    right: 20,
    bottom: 170,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default BrowseScreen;