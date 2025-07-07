import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { HistoryDAO } from '../database/HistoryDAO';
import { database } from '../database/Database';
import HistoryHeader from '../components/History/Headers';
import HistoryList from '../components/History/List';
import CalendarModal from '../components/History/CalendarModal';
import EmptyState from '../components/History/Empty';
import LoadingSpinner from '../components/History/Spinner';

const HistoryScreen = ({ currentTheme, historyDAO }) => {
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
    if (historyDAO) {
      loadInitialHistory();
      loadReadingDates();
    }
  }, [historyDAO]);

  const loadReadingDates = async () => {
    try {
      setReadingDates([]);
    } catch (error) {
      console.error('Error loading reading dates:', error);
    }
  };

  const loadInitialHistory = async () => {
    try {
      setLoading(true);
      setCurrentPage(0);

      const historyData = await historyDAO.getAll();

      setHistory(historyData || []);
      setTotalCount(historyData.length);
      setHasMore(historyData.length === PAGE_SIZE);
    } catch (error) {
      console.error('Error loading history:', error);
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

      let moreData;
      if (isFilterActive && dateRange.start && dateRange.end) {
        moreData = [];
      } else {
        moreData = [];
      }

      if (moreData.length > 0) {
        setHistory(prev => [...prev, ...moreData]);
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
    if (historyDAO) {
      await loadInitialHistory();
      await loadReadingDates();
    }
    setRefreshing(false);
  }, [historyDAO]);

  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all reading history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              if (historyDAO) {
                await historyDAO.deleteAll();
                setHistory([]);
                setTotalCount(0);
                setHasMore(false);
                await loadReadingDates();
              }
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const applyDateFilter = async () => {
    try {
      setLoading(true);
      setShowCalendar(false);
      setCurrentPage(0);

      if (!dateRange.start) {
        setIsFilterActive(false);
        await loadInitialHistory();
      } else {
        setIsFilterActive(true);
        const endDate = dateRange.end || dateRange.start;
        const filteredHistory = await historyDAO.getHistoryByDateRange(
          dateRange.start,
          endDate,
          PAGE_SIZE,
          0
        );
        const count = await historyDAO.getHistoryCountByDateRange(dateRange.start, endDate);

        setHistory(filteredHistory || []);
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
    await loadInitialHistory();
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreHistory();
    }
  };

  if (loading) {
    return <LoadingSpinner currentTheme={currentTheme} message="Loading history..." />;
  }

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
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
          />

          {history.length === 0 ? (
            <EmptyState
              currentTheme={currentTheme}
              isFilterActive={isFilterActive}
            />
          ) : (
            <HistoryList
              history={history}
              currentTheme={currentTheme}
              loadingMore={loadingMore}
              hasMore={hasMore}
            />
          )}
        </View>
      </ScrollView>

      {/* Calendar Filter Button */}
      <TouchableOpacity
        style={[styles.calendarFab, { backgroundColor: currentTheme.primaryColor }]}
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
  calendarFab: {
    position: 'absolute',
    right: 20,
    bottom: 90,
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
});

export default HistoryScreen;
