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
import { fetchUserWorks } from '../../web/user/userWorks';
import EmptyState from '../../components/History/Empty';

export default function UserWorkScreen({
  setScreens,
  currentTheme,
  workDAO,
  libraryDAO,
  historyDAO,
  settingsDAO,
  progressDAO,
  kudoHistoryDAO,
  username,
  chapterDAO,
  pseud
}) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('med');

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadInitialUserWork();
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

  const loadInitialUserWork = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      const res = pseud ? await fetchUserWorks(1, username, pseud) : (username ? await fetchUserWorks(1, username) : await fetchUserWorks(1));
      setBookmarks(res || []);
      setHasMore((res?.length || 0) === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      setBookmarks([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreWorks = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const res = pseud ? await fetchUserWorks(nextPage, username, pseud) : (username ? await fetchUserWorks(nextPage, username) : await fetchUserWorks(nextPage));
      const moreData = res || [];

      if (moreData.length > 0) {
        setBookmarks(prev => [...prev, ...moreData]);
        setCurrentPage(nextPage);
        setHasMore(moreData.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more bookmarks:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitialUserWork();
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

  const renderWork = ({ item, index }) => (
    <BookCard
      key={index}
      book={formatWork(item)}
      viewMode={viewMode}
      theme={currentTheme}
      onUpdate={loadInitialUserWork}
      setScreens={setScreens}
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
        {username ? username + "'s " : ""}Works
      </Text>

      <TouchableOpacity
        style={{ marginLeft: 'auto' }}
        onPress={() =>
        {username ? Linking.openURL(`https://archiveofourown.org/users/${username}/works`)
          : getUsername().then(usrname => {Linking.openURL(`https://archiveofourown.org/users/${usrname}/works`)}
        )}
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

  if (loading) {
    return (
      <LoadingSpinner
        currentTheme={currentTheme}
        message="Loading works..."
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

      {
        bookmarks.length === 0 ? (
          <EmptyState currentTheme={currentTheme}
                      textLine1={"No works."}
                      textLine2={"It seems like this user doesn't have any works."}
          />
        ) : (
          <FlatList
            data={bookmarks}
            renderItem={renderWork}
            keyExtractor={(item, index) => `${item.id || index}`}
            onEndReached={loadMoreWorks}
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

        )
      }
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
    width: "80%",
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
  }
});