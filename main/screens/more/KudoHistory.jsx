import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

import HistoryHeader from '../../components/History/Headers';
import CalendarModal from '../../components/History/CalendarModal';
import EmptyState from '../../components/History/Empty';
import LoadingSpinner from '../../components/History/Spinner';
import KudoHistoryList from '../../components/History/KudoList';

const KudoHistoryScreen = ({
  currentTheme,
  workDAO,
  libraryDAO,
  setScreens,
  historyDAO,
  settingsDAO,
  progressDAO,
  kudoHistoryDAO,
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [readingDates, setReadingDates] = useState([]);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (kudoHistoryDAO && workDAO) {
      loadInitialHistory();
      loadReadingDates();
    }
  }, [kudoHistoryDAO, loadInitialHistory, loadReadingDates, workDAO]);

  const loadReadingDates = async () => {
    try {
      const datesAsTimestamps = await kudoHistoryDAO.getReadingDates();
      const datesAsStrings = datesAsTimestamps.map(timestamp => {
        return new Date(timestamp).toISOString().split('T')[0];
      });
      setReadingDates([...new Set(datesAsStrings)]);
    } catch (error) {
      console.error('Error loading reading dates:', error);
    }
  };

  const fetchAndCombineHistory = async historyData => {
    if (!historyData || historyData.length === 0) {
      return [];
    }

    const combinedHistory = await Promise.all(
      historyData.map(async item => {
        try {
          const work = await workDAO.get(item.workId);
          return {
            ...item,
            book_title: work ? work.title : 'Unknown Book',
            book_author: work ? work.author : 'Unknown Author',
          };
        } catch (error) {
          console.error(
            `Error fetching work for history item ${item.id}:`,
            error,
          );
          return {
            ...item,
            book_title: 'Unknown Book',
            book_author: 'Unknown Author',
          };
        }
      }),
    );
    return combinedHistory;
  };

  const loadInitialHistory = async () => {
    try {
      setLoading(true);
      setCurrentPage(0);

      let historyData;
      let count;
      if (isFilterActive && dateRange.start) {
        const endDate = dateRange.end || dateRange.start;
        const startTimestamp = new Date(dateRange.start).setHours(0, 0, 0, 0);
        const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);

        historyData = await kudoHistoryDAO.getHistoryByDateRange(
          startTimestamp,
          endTimestamp,
          PAGE_SIZE,
          0,
        );
        count = await kudoHistoryDAO.getHistoryCountByDateRange(
          startTimestamp,
          endTimestamp,
        );
      } else {
        historyData = await kudoHistoryDAO.getPaginatedHistory(PAGE_SIZE, 0);
        count = await kudoHistoryDAO.getTotalHistoryCount();
      }

      const combinedHistory = await fetchAndCombineHistory(historyData);
      setHistory(combinedHistory || []);
      setTotalCount(count);
      setHasMore(historyData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading kudos history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = currentPage + 1;
      const offset = nextPage * PAGE_SIZE;

      let moreData;
      if (isFilterActive && dateRange.start) {
        const startTimestamp = new Date(dateRange.start).setHours(0, 0, 0, 0);
        const endDateString = dateRange.end || dateRange.start;
        const endTimestamp = new Date(endDateString).setHours(23, 59, 59, 999);

        moreData = await kudoHistoryDAO.getHistoryByDateRange(
          startTimestamp,
          endTimestamp,
          PAGE_SIZE,
          offset,
        );
      } else {
        moreData = await kudoHistoryDAO.getPaginatedHistory(PAGE_SIZE, offset);
      }

      if (moreData.length > 0) {
        const combinedMoreData = await fetchAndCombineHistory(moreData);
        setHistory(prev => [...prev, ...combinedMoreData]);
        setCurrentPage(nextPage);
        setHasMore(moreData.length === PAGE_SIZE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more history:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (kudoHistoryDAO && workDAO) {
      await loadInitialHistory();
      await loadReadingDates();
    }
    setRefreshing(false);
  }, [kudoHistoryDAO, workDAO, loadInitialHistory, loadReadingDates]);

  const clearHistory = () => {
    Alert.alert(
      'Clear Kudos History',
      'Are you sure you want to clear all kudos history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              if (kudoHistoryDAO) {
                await kudoHistoryDAO.deleteAll();
                setHistory([]);
                setTotalCount(0);
                setHasMore(false);
                await loadReadingDates();
              }
            } catch (error) {
              console.error('Error clearing kudos history:', error);
            }
          },
        },
      ],
    );
  };

  const applyDateFilter = async () => {
    try {
      setLoading(true);
      setShowCalendar(false);
      setCurrentPage(0);

      if (!dateRange.start) {
        setIsFilterActive(false);
        const historyData = await kudoHistoryDAO.getPaginatedHistory(
          PAGE_SIZE,
          0,
        );
        const count = await kudoHistoryDAO.getTotalHistoryCount();
        const combinedHistory = await fetchAndCombineHistory(historyData);
        setHistory(combinedHistory || []);
        setTotalCount(count);
        setHasMore(historyData.length === PAGE_SIZE);
      } else {
        setIsFilterActive(true);

        const startTimestamp = new Date(dateRange.start).setHours(0, 0, 0, 0);
        const endDateString = dateRange.end || dateRange.start;
        const endTimestamp = new Date(endDateString).setHours(23, 59, 59, 999);

        const filteredHistory = await kudoHistoryDAO.getHistoryByDateRange(
          startTimestamp,
          endTimestamp,
          PAGE_SIZE,
          0,
        );
        const count = await kudoHistoryDAO.getHistoryCountByDateRange(
          startTimestamp,
          endTimestamp,
        );
        const combinedFilteredHistory = await fetchAndCombineHistory(
          filteredHistory,
        );
        setHistory(combinedFilteredHistory || []);
        setTotalCount(count);
        setHasMore(filteredHistory.length === PAGE_SIZE);
      }
    } catch (error) {
      console.error('Error applying date filter:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearDateFilter = async () => {
    setDateRange({ start: null, end: null });
    setIsFilterActive(false);
    setShowCalendar(false);

    try {
      setLoading(true);
      setCurrentPage(0);
      const historyData = await kudoHistoryDAO.getPaginatedHistory(
        PAGE_SIZE,
        0,
      );
      const count = await kudoHistoryDAO.getTotalHistoryCount();
      const combinedHistory = await fetchAndCombineHistory(historyData);
      setHistory(combinedHistory || []);
      setTotalCount(count);
      setHasMore(historyData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading kudos history:', error);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleScroll = event => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom
    ) {
      loadMoreHistory();
    }
  };

  if (loading) {
    return (
      <LoadingSpinner
        currentTheme={currentTheme}
        message="Loading kudos history..."
      />
    );
  }

  function onBack() {
    setScreens(prev => {
      const newScreens = [...prev];
      newScreens.pop();
      return newScreens;
    });
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}>
          <Icon name="arrow-back" size={24} color={currentTheme.textColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          Kudos History
        </Text>
      </View>

      <ScrollView
        style={styles.mainContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[currentTheme.primaryColor]}
            tintColor={currentTheme.primaryColor}
          />
        }
      >
        <View style={styles.contentContainer}>
          <HistoryHeader
            currentTheme={currentTheme}
            totalCount={totalCount}
            isFilterActive={isFilterActive}
            hasHistory={history.length > 0}
            onClearHistory={clearHistory}
            onClearFilter={clearDateFilter}
            isKudosHistory={true}
          />

          {history.length === 0 ? (
            <EmptyState
              currentTheme={currentTheme}
              isFilterActive={isFilterActive}
            />
          ) : (
            <KudoHistoryList
              history={history}
              currentTheme={currentTheme}
              loadingMore={loadingMore}
              hasMore={hasMore}
              settingsDAO={settingsDAO}
              workDAO={workDAO}
              libraryDAO={libraryDAO}
              setScreens={setScreens}
              historyDAO={historyDAO}
              progressDAO={progressDAO}
              kudoHistoryDAO={kudoHistoryDAO}
            />
          )}
        </View>
      </ScrollView>

      {/* Calendar Filter Button */}
      <TouchableOpacity
        style={[
          styles.readButtonFab,
          { backgroundColor: currentTheme.primaryColor },
        ]}
        onPress={() => setShowCalendar(true)}
      >
        <Icon name="calendar-today" size={24} color="white" />
      </TouchableOpacity>

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendar}
        currentTheme={currentTheme}
        dateRange={dateRange}
        readingDates={readingDates}
        onClose={() => setShowCalendar(false)}
        onDateRangeChange={setDateRange}
        onApplyFilter={applyDateFilter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  readButtonFab: {
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
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 16,
  },
});

export default KudoHistoryScreen;
