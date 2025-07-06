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
  Modal,
  Dimensions,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import Icon from 'react-native-vector-icons/MaterialIcons';
import DatabaseManager from '../database/DatabaseManager';

const { width: screenWidth } = Dimensions.get('window');

const HistoryScreen = ({ currentTheme }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDates, setSelectedDates] = useState({});
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [isFilterActive, setIsFilterActive] = useState(false);
  const [readingDates, setReadingDates] = useState([]);

  const PAGE_SIZE = 20;

  useEffect(() => {
    loadInitialHistory();
    loadReadingDates();
  }, []);

  const loadReadingDates = async () => {
    try {
      const dates = await DatabaseManager.getReadingDates();
      setReadingDates(dates);
    } catch (error) {
      console.error('Error loading reading dates:', error);
    }
  };

  const loadInitialHistory = async () => {
    try {
      setLoading(true);
      setCurrentPage(0);

      const historyData = await DatabaseManager.getHistory(PAGE_SIZE, 0);
      const count = await DatabaseManager.getHistoryCount();

      setHistory(historyData || []);
      setTotalCount(count);
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
        moreData = await DatabaseManager.getHistoryByDateRange(
          dateRange.start,
          dateRange.end,
          PAGE_SIZE,
          nextPage * PAGE_SIZE
        );
      } else {
        moreData = await DatabaseManager.getHistory(PAGE_SIZE, nextPage * PAGE_SIZE);
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
    await loadInitialHistory();
    await loadReadingDates();
    setRefreshing(false);
  }, []);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatChapterRange = (start, end) => {
    if (!end || start === end) {
      return `Chapter ${start}`;
    }
    return `Chapters ${start} - ${end}`;
  };

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
              await DatabaseManager.clearHistory();
              setHistory([]);
              setTotalCount(0);
              setHasMore(false);
              await loadReadingDates();
            } catch (error) {
              console.error('Error clearing history:', error);
            }
          },
        },
      ]
    );
  };

  const groupHistoryByDate = (historyItems) => {
    if (!historyItems || historyItems.length === 0) {
      return [];
    }

    const groups = {};
    historyItems.forEach(item => {
      const date = new Date(item.date_read);
      const dateKey = date.toDateString();

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(item);
    });

    return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
  };

  const renderHistoryItem = (item) => (
    <View key={item.id} style={[styles.historyItem, { backgroundColor: currentTheme.cardBackground }]}>
      <View style={styles.itemHeader}>
        <Text style={[styles.bookTitle, { color: currentTheme.textColor }]} numberOfLines={1}>
          {item.book_title || 'Unknown Book'}
        </Text>
        <Text style={[styles.readTime, { color: currentTheme.placeholderColor }]}>
          {formatDate(item.date_read)}
        </Text>
      </View>

      <Text style={[styles.bookAuthor, { color: currentTheme.placeholderColor }]} numberOfLines={1}>
        by {item.book_author || 'Unknown Author'}
      </Text>

      <View style={styles.chapterInfo}>
        <Text style={[styles.chapterText, { color: currentTheme.primaryColor }]}>
          {formatChapterRange(item.chapter_start, item.chapter_end)}
        </Text>
      </View>
    </View>
  );

  const handleCalendarDayPress = (day) => {
    const dateString = day.dateString;

    if (!dateRange.start || (dateRange.start && dateRange.end)) {
      setDateRange({ start: dateString, end: null });
      setSelectedDates({
        [dateString]: { selected: true, startingDay: true, color: currentTheme.primaryColor }
      });
    } else if (dateRange.start && !dateRange.end) {
      const start = new Date(dateRange.start);
      const end = new Date(dateString);

      if (end < start) {
        setDateRange({ start: dateString, end: dateRange.start });
        setSelectedDates(getDateRangeSelection(dateString, dateRange.start));
      } else {
        setDateRange({ start: dateRange.start, end: dateString });
        setSelectedDates(getDateRangeSelection(dateRange.start, dateString));
      }
    }
  };

  const getDateRangeSelection = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const dates = {};

    const current = new Date(start);
    while (current <= end) {
      const dateString = current.toISOString().split('T')[0];
      dates[dateString] = {
        selected: true,
        color: currentTheme.primaryColor,
        startingDay: dateString === startDate,
        endingDay: dateString === endDate,
      };
      current.setDate(current.getDate() + 1);
    }

    return dates;
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
        const filteredHistory = await DatabaseManager.getHistoryByDateRange(
          dateRange.start,
          endDate,
          PAGE_SIZE,
          0
        );
        const count = await DatabaseManager.getHistoryCountByDateRange(dateRange.start, endDate);

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
    setSelectedDates({});
    setIsFilterActive(false);
    setShowCalendar(false);
    await loadInitialHistory();
  };

  const getCalendarMarkedDates = () => {
    const marked = { ...selectedDates };

    readingDates.forEach(date => {
      if (!marked[date]) {
        marked[date] = {
          marked: true,
          dotColor: currentTheme.primaryColor,
          selectedColor: currentTheme.primaryColor
        };
      } else {
        marked[date] = {
          ...marked[date],
          marked: true,
          dotColor: currentTheme.primaryColor
        };
      }
    });

    return marked;
  };

  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      loadMoreHistory();
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading history...
        </Text>
      </View>
    );
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
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: currentTheme.textColor }]}>Reading History</Text>
              <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
                {isFilterActive
                  ? `${totalCount} entries in selected date range`
                  : `${totalCount} total entries`
                }
              </Text>
            </View>

            <View style={styles.headerButtons}>
              {isFilterActive && (
                <TouchableOpacity
                  style={[styles.clearFilterButton, { backgroundColor: currentTheme.primaryColor }]}
                  onPress={clearDateFilter}
                >
                  <Text style={[styles.clearFilterText, { color: 'white' }]}>
                    Clear Filter
                  </Text>
                </TouchableOpacity>
              )}

              {history.length > 0 && (
                <TouchableOpacity
                  style={[styles.clearButton, { borderColor: currentTheme.primaryColor }]}
                  onPress={clearHistory}
                >
                  <Text style={[styles.clearButtonText, { color: currentTheme.primaryColor }]}>
                    Clear
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { color: currentTheme.placeholderColor }]}>
                {isFilterActive ? 'No reading history for selected dates' : 'No reading history yet'}
              </Text>
              <Text style={[styles.emptyStateSubtext, { color: currentTheme.placeholderColor }]}>
                {isFilterActive ? 'Try selecting different dates' : 'Start reading to see your progress here'}
              </Text>
            </View>
          ) : (
            <View style={styles.historyContainer}>
              {groupHistoryByDate(history).map(([dateKey, items]) => (
                <View key={dateKey} style={styles.dateGroup}>
                  <Text style={[styles.dateHeader, { color: currentTheme.textColor }]}>
                    {new Date(dateKey).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Text>
                  {items.map(renderHistoryItem)}
                </View>
              ))}

              {loadingMore && (
                <View style={styles.loadingMore}>
                  <ActivityIndicator size="small" color={currentTheme.primaryColor} />
                  <Text style={[styles.loadingMoreText, { color: currentTheme.placeholderColor }]}>
                    Loading more...
                  </Text>
                </View>
              )}

              {!hasMore && history.length > 0 && (
                <View style={styles.endOfList}>
                  <Text style={[styles.endOfListText, { color: currentTheme.placeholderColor }]}>
                    You've reached the end of your reading history
                  </Text>
                </View>
              )}
            </View>
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
      <Modal
        visible={showCalendar}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCalendar(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: currentTheme.backgroundColor }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: currentTheme.textColor }]}>
                Select Date Range
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCalendar(false)}
              >
                <Icon name="close" size={24} color={currentTheme.placeholderColor} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitle, { color: currentTheme.placeholderColor }]}>
              {dateRange.start && dateRange.end
                ? `Selected: ${dateRange.start} to ${dateRange.end}`
                : dateRange.start
                  ? `Start: ${dateRange.start} (tap another date to set end)`
                  : 'Tap a date to start selection. Dots indicate reading activity.'
              }
            </Text>

            <Calendar
              onDayPress={handleCalendarDayPress}
              markedDates={getCalendarMarkedDates()}
              markingType="period"
              theme={{
                backgroundColor: currentTheme.backgroundColor,
                calendarBackground: currentTheme.backgroundColor,
                textSectionTitleColor: currentTheme.textColor,
                selectedDayBackgroundColor: currentTheme.primaryColor,
                selectedDayTextColor: 'white',
                todayTextColor: currentTheme.primaryColor,
                dayTextColor: currentTheme.textColor,
                textDisabledColor: currentTheme.placeholderColor,
                dotColor: currentTheme.primaryColor,
                selectedDotColor: 'white',
                arrowColor: currentTheme.primaryColor,
                monthTextColor: currentTheme.textColor,
                indicatorColor: currentTheme.primaryColor,
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 13
              }}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: currentTheme.placeholderColor }]}
                onPress={() => {
                  setDateRange({ start: null, end: null });
                  setSelectedDates({});
                }}
              >
                <Text style={[styles.modalButtonText, { color: currentTheme.placeholderColor }]}>
                  Clear Selection
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.applyButton,
                  {
                    backgroundColor: currentTheme.primaryColor,
                    borderColor: currentTheme.primaryColor
                  }
                ]}
                onPress={applyDateFilter}
              >
                <Text style={[styles.modalButtonText, { color: 'white' }]}>
                  {dateRange.start ? 'Apply Filter' : 'Show All'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  clearFilterButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  clearButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  historyItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  readTime: {
    fontSize: 12,
    fontWeight: '400',
  },
  bookAuthor: {
    fontSize: 14,
    marginBottom: 8,
  },
  chapterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 14,
    fontWeight: '500',
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
  endOfList: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  endOfListText: {
    fontSize: 14,
    fontStyle: 'italic',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: screenWidth - 32,
    maxHeight: '80%',
    borderRadius: 16,
    padding: 16,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  applyButton: {
    borderWidth: 0,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default HistoryScreen;
