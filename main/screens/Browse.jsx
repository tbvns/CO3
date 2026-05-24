import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  BackHandler,
  DeviceEventEmitter,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { fetchFilteredWorks } from '../web/browse/fetchWorks';
import { fetchTagWorks } from '../web/browse/fetchTagsWorks';
import { checkTagCanonical } from '../web/other/tagUtils';
import BookCard from '../components/Library/BookCard';
import AdvancedSearchScreen from './advancedSearch';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getJsonSettings } from '../storage/jsonSettings';
import { getAllPresets } from '../storage/jsonSearches';
import Icon from 'react-native-vector-icons/MaterialIcons';

const FilterIcon = ({ color, size }) => (
  <Icon name={"filter-list"} style={{color: color}} size={size} />
);

const ClearIcon = ({ color, size }) => (
  <Icon name={"close"} style={{color: color}} size={size} />
);

const BrowseScreen = ({ currentTheme, viewMode = 'med', setScreens, screens, libraryDAO, workDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, openTagSearch, selectedTag, setSelectedTag, chapterDAO, selectedPreset, setSelectedPreset }) => {
  const insets = useSafeAreaInsets();

  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const [searchMounted, setSearchMounted] = useState(false); // mount once, never unmount
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').height)).current;

  const openSearch = () => {
    setSearchMounted(true);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (searchMounted && slideAnim._value === 0) {
        closeSearch();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [searchMounted, slideAnim, closeSearch]);

  const closeSearch = () => {
    Animated.timing(slideAnim, {
      toValue: Dimensions.get('window').height,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [appliedFilters, setAppliedFilters] = useState({});
  const [hasFilters, setHasFilters] = useState(false);

  const [tagMode, setTagMode] = useState({ active: false, tagName: null });

  const [jsonSettings, setJsonSettings] = useState();

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener('doubleTap', (id) => {
      openSearch()
    })

    return () => {
      subscription.remove()
    }
  }, [openSearch])

  const loadWorks = useCallback(async (reset = false) => {
    const isTagMode = tagMode.active && tagMode.tagName;
    if (!reset && !isTagMode && Object.keys(appliedFilters).length === 0) return;

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

      const result = isTagMode
        ? await fetchTagWorks(tagMode.tagName, appliedFilters, pageToLoad)
        : await fetchFilteredWorks(appliedFilters, pageToLoad);
      const newWorks = result.works || [];

      const isLastPage = newWorks.length < 20;

      setJsonSettings(await getJsonSettings());

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

      if (!isTagMode && Object.keys(appliedFilters).length === 0) {
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
  }, [tagMode, appliedFilters, currentPage, hasMore, loadingMore]);

  useEffect(() => {
    loadWorks(true);
  }, [tagMode, appliedFilters]);

  // Handle preset selection
  useEffect(() => {
    if (selectedPreset == null) return;

    console.log('Applying preset:', selectedPreset);

    const applyPreset = async () => {
      try {
        const presets = await getAllPresets();
        const found = presets.find(p => p.name === selectedPreset);
        if (!found) {
          console.warn('Preset not found:', selectedPreset);
          return;
        }

        const p = found.preset;
        const itemsToString = (items) =>
          Array.isArray(items) ? items.map(i => i.name).join(',') : '';

        const filters = {};
        if (p.anyField) filters['work_search[query]'] = p.anyField;
        if (p.title) filters['work_search[title]'] = p.title;
        if (p.creator) filters['work_search[creators]'] = p.creator;
        if (p.date) filters['work_search[revised_at]'] = p.date;
        if (p.completionStatus) filters['work_search[complete]'] = p.completionStatus;
        if (p.crossoverStatus) filters['work_search[crossover]'] = p.crossoverStatus;
        if (p.singleChapter) filters['work_search[single_chapter]'] = '1';
        if (p.wordCount) filters['work_search[word_count]'] = p.wordCount;
        if (p.language) filters['work_search[language_id]'] = p.language;
        if (p.fandoms?.length) filters['work_search[fandom_names]'] = itemsToString(p.fandoms);
        if (p.rating) filters['work_search[rating_ids]'] = p.rating;
        if (p.warnings?.length) filters['work_search[archive_warning_ids][]']= p.warnings;
        if (p.categories?.length) filters['work_search[category_ids][]'] = p.categories;
        if (p.characters?.length) filters['work_search[character_names]'] = itemsToString(p.characters);
        if (p.relationships?.length) filters['work_search[relationship_names]'] = itemsToString(p.relationships);
        if (p.additionalTags?.length)filters['work_search[freeform_names]'] = itemsToString(p.additionalTags);
        if (p.hits) filters['work_search[hits]'] = p.hits;
        if (p.kudos) filters['work_search[kudos_count]'] = p.kudos;
        if (p.comments) filters['work_search[comments_count]'] = p.comments;
        if (p.bookmarks) filters['work_search[bookmarks_count]'] = p.bookmarks;
        filters['work_search[sort_column]'] = p.sortBy || 'revised_at';
        filters['work_search[sort_direction]'] = p.sortDirection || 'desc';

        console.log('Setting filters from preset:', filters);
        setAppliedFilters(filters);
        setHasFilters(true);
      } catch (err) {
        console.error('Error applying preset:', err);
        setError({
          message: `Failed to apply preset: ${err.message}`,
          status: 'Error',
          statusText: 'Preset Error'
        });
      } finally {
        setTimeout(() => {
          setSelectedPreset(null);
        }, 0);
      }
    };

    applyPreset();
  }, [selectedPreset, setSelectedPreset]);

  useEffect(() => {
    if (selectedTag == null) return;

    const resolveTag = async () => {
      setLoading(true);
      try {
        const info = await checkTagCanonical(selectedTag);
        if (info.isCanonical) {
          setTagMode({ active: true, tagName: selectedTag });
          setAppliedFilters({});
          setHasFilters(true);
        } else {
          setTagMode({ active: false, tagName: null });
          setAppliedFilters({ "work_search[freeform_names]": selectedTag });
          setHasFilters(true);
        }
      } catch (err) {
        console.warn('checkTagCanonical failed, falling back to generic search:', err);
        setTagMode({ active: false, tagName: null });
        setAppliedFilters({ "work_search[freeform_names]": selectedTag });
        setHasFilters(true);
      } finally {
        setSelectedTag(null);
      }
    };

    resolveTag();
  }, [selectedTag, setSelectedTag]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadWorks(true);
  }, [loadWorks]);

  const handleLoadMore = useCallback(() => {
    if (!tagMode.active && Object.keys(appliedFilters).length === 0) return;

    if (!loading && !loadingMore && hasMore && works.length > 0) {
      loadWorks(false);
    }
  }, [tagMode, loading, loadingMore, hasMore, works.length, loadWorks, appliedFilters]);

  const handleSearchFilters = (filters, canonicalTagName) => {
    if (canonicalTagName) {
      setTagMode({ active: true, tagName: canonicalTagName });
    } else {
      setTagMode({ active: false, tagName: null });
    }
    setAppliedFilters(filters);
    setHasFilters(Object.keys(filters).length > 0 || !!canonicalTagName);
    closeSearch();
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
            setTagMode({ active: false, tagName: null });
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
      descriptionHTML: work.descriptionHTML,
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

  const renderItem = useCallback(({ item }) => (    <BookCard
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
      jsonSettings={jsonSettings}
      chapterDAO={chapterDAO}
    />
  ), [viewMode, currentTheme, jsonSettings]);

  const renderLoading = () => {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading works...
        </Text>
      </View>
    )
  }

  const rennderError = () => {
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
      {loading ? renderLoading() : (
        error ? rennderError() : (
          <FlatList
            data={works}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.contentContainer}
            ListHeaderComponent={renderHeader}
            ListFooterComponent={renderFooter}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={3}
            maxToRenderPerBatch={5}
            removeClippedSubviews={true}
            updateCellsBatchingPeriod={50}
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
        )
      )
      }

      {/* Filter FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: currentTheme.primaryColor, bottom: 100 + insets.bottom }]}
        onPress={() => openSearch()}
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

      {searchMounted && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateY: slideAnim }], zIndex: 100 },
          ]}
        >
          <AdvancedSearchScreen
            currentTheme={currentTheme}
            onClose={closeSearch}
            onSearch={handleSearchFilters}
            savedFilters={appliedFilters}
            tagMode={tagMode}
          />
        </Animated.View>
      )}
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