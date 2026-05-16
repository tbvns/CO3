import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BookCard from '../../components/Library/BookCard';
import LoadingSpinner from '../../components/History/Spinner';
import { getUsername } from '../../storage/Credentials';
import { fetchMarkedLater } from '../../web/other/markedLater';
import EmptyState from '../../components/History/Empty';
import Toast from 'react-native-toast-message';

export default function ReadLaterScreen({
  setScreens,
  currentTheme,
  workDAO,
  libraryDAO,
  historyDAO,
  settingsDAO,
  progressDAO,
  kudoHistoryDAO,
  screens,
  chapterDAO,
}) {
  const [entries, setentries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('med');
  const [error, setError] = useState(null);

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadInitialEntries();
  }, []);

  const formatWork = work => {
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
      lastUpdated: work.updated
        ? new Date(work.updated).toLocaleDateString()
        : 'Unknown',
      likes: work.kudos,
      bookmarks: work.bookmarks,
      views: work.hits,
      language: work.language,
      currentChapter: work.currentChapter,
      chapterCount: work.chapterCount,
      dateAdded: undefined,
      collection: undefined,
      readIndex: undefined,
      lastRead: undefined,
    };
  };

  const loadInitialEntries = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      const res = await fetchMarkedLater(1);
      setentries(res || []);
      setHasMore((res?.length || 0) === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading marked for later entries:', error);
      setentries([]);
      setError(error)
    } finally {
      setLoading(false);
    }
  };

  const loadMoreEntries = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const res = await fetchMarkedLater(nextPage);
      const moreData = res || [];

      if (moreData.length > 0) {
        setentries(prev => [...prev, ...moreData]);
        setCurrentPage(nextPage);
        setHasMore(moreData.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more bookmarks:', error);
      setError(error)
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialEntries();
    setRefreshing(false);
  }, []);

  const onBack = () => {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  };

  const openTagSearch = tag => {
    console.log('Search for tag:', tag);
  };

  const renderEntry = ({ item, index }) => (
    <BookCard
      key={index}
      book={formatWork(item)}
      viewMode={viewMode}
      theme={currentTheme}
      onUpdate={loadInitialEntries}
      setScreens={setScreens}
      screens={screens}
      libraryDAO={libraryDAO}
      workDAO={workDAO}
      settingsDAO={settingsDAO}
      historyDAO={historyDAO}
      progressDAO={progressDAO}
      kudoHistoryDAO={kudoHistoryDAO}
      openTagSearch={openTagSearch}
      showDate={false}
      chapterDAO={chapterDAO}
    />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
      <Text style={[styles.title, { color: currentTheme.textColor }]}>
        Marked for Later
      </Text>

      <TouchableOpacity
        style={{ marginLeft: 'auto' }}
        onPress={() =>
          getUsername().then(usrname => {
            Linking.openURL(
              `https://archiveofourown.org/users/${usrname}/readings?show=to-read`,
            );
          })
        }
      >
        <Icon name="link" size={24} color={currentTheme.textColor} />
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingMore}>
        <ActivityIndicator size="small" color={currentTheme.primaryColor} />
        <Text
          style={[
            styles.loadingMoreText,
            { color: currentTheme.placeholderColor },
          ]}
        >
          Loading more...
        </Text>
      </View>
    );
  };

  const rennderError = () => {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={[styles.errorContainer, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
          <Text style={[styles.errorTitle, { color: currentTheme.textColor }]}>
            Failed to Load Entries
          </Text>
          <Text style={[styles.errorMessage, { color: currentTheme.secondaryTextColor }]}>
            {error.message}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => loadInitialEntries()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <LoadingSpinner
        currentTheme={currentTheme}
        message="Loading entries..."
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      {renderHeader()}

      {error ?
        rennderError()
      :       (
          entries.length === 0 ?
            <EmptyState currentTheme={currentTheme}
                        textLine1={"No chapters yet."}
                        textLine2={"Mark chapter for later to see them here."}
            />
            :
            <FlatList
              data={entries}
              renderItem={renderEntry}
              keyExtractor={(item, index) => `${item.id || index}`}
              onEndReached={loadMoreEntries}
              onEndReachedThreshold={0.1}
              ListFooterComponent={renderFooter}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[currentTheme.primaryColor]}
                  tintColor={currentTheme.primaryColor}
                />
              }
              contentContainerStyle={styles.contentContainer}
              scrollEventThrottle={16}
              removeClippedSubviews={true}
              maxToRenderPerBatch={10}
              updateCellsBatchingPeriod={50}
            />
        )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 16,
    fontStyle: 'italic',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingMoreText: {
    fontSize: 14,
  },
  infoText: {
    width: '100%',
    textAlign: 'center',
    fontSize: 20,
  },
  icon: {
    paddingBottom: "10%",
  },
  infoContainer: {
    height: "90%",
    alignItems: "center",
    justifyContent: "center"
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  }
});