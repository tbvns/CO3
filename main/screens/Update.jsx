import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import UpdateBookCard from '../components/Update/UpdateBookCard';
import ChapterInfoScreen from './workScreen';
import { run } from '../web/updater';

const UpdateScreen = ({
                        currentTheme,
                        updateDAO,
                        workDAO,
                        setScreens,
                        screens,
                        libraryDAO,
                        settingsDAO,
                        historyDAO,
                        progressDAO,
                        kudoHistoryDAO,
                        openTagSearch,
                        databaseObj
                      }) => {
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadUpdates();
  }, [updateDAO]);

  const loadUpdates = async () => {
    try {
      if (updateDAO) {
        const allUpdates = await updateDAO.getAll();
        // Sort updates by date descending (newest first)
        const sortedUpdates = allUpdates.sort((a, b) => b.date - a.date);
        setUpdates(sortedUpdates);

        if (sortedUpdates.length > 0) {
          const latest = new Date(sortedUpdates[0].date);
          setLastUpdate(formatRelativeTime(latest));
        }
      }
    } catch (error) {
      console.error('Error loading updates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManualUpdate = async () => {
    setRefreshing(true);
    try {
      await run(databaseObj);
      await loadUpdates();
    } catch (error) {
      console.error('Error running manual update:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const formatRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const groupUpdatesByDate = (updatesList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      older: []
    };

    updatesList.forEach(update => {
      const updateDate = new Date(update.date);
      updateDate.setHours(0, 0, 0, 0);

      if (updateDate.getTime() === today.getTime()) {
        groups.today.push(update);
      } else if (updateDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(update);
      } else {
        groups.older.push(update);
      }
    });

    return groups;
  };

  // UPDATED: Now calculates the index before opening
  const handleUpdatePress = async (update) => {
    let loadChapterIndex = null;

    if (update.chapterNumber) {
      try {
        // 1. Get the work from DB to find the specific index of this chapter number
        const work = await workDAO.get(update.workId);

        if (work && work.chapters) {
          const targetNum = parseInt(update.chapterNumber);
          const idx = work.chapters.findIndex(c => c.number === targetNum);

          if (idx !== -1) {
            loadChapterIndex = idx;
          } else {
            // Fallback if numbers are sequential
            loadChapterIndex = targetNum - 1;
          }
        }
      } catch (e) {
        console.log("Error finding chapter index", e);
        // Fallback
        loadChapterIndex = update.chapterNumber - 1;
      }
    }

    // Use functional update (prev => ...) to ensure we don't use stale state after the async await
    setScreens(prev => [...prev,
      <ChapterInfoScreen
        key={`update_${update.id}`}
        workId={update.workId}
        currentTheme={currentTheme}
        libraryDAO={libraryDAO}
        workDAO={workDAO}
        setScreens={setScreens}
        settingsDAO={settingsDAO}
        historyDAO={historyDAO}
        progressDAO={progressDAO}
        kudoHistoryDAO={kudoHistoryDAO}
        openTagSearch={openTagSearch}
        loadChapter={loadChapterIndex} // Pass the calculated index
      />
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading updates...
        </Text>
      </View>
    );
  }

  const groupedUpdates = groupUpdatesByDate(updates);

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.backgroundColor }]}>
      {/* Header with last update time and refresh button */}
      <View style={[styles.headerBar, { backgroundColor: currentTheme.headerBackground, borderBottomColor: currentTheme.borderColor }]}>
        <View style={styles.headerLeft}>
          {lastUpdate && (
            <Text style={[styles.lastUpdateText, { color: currentTheme.secondaryTextColor }]}>
              Library last updated: {lastUpdate}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: currentTheme.buttonBackground }]}
          onPress={handleManualUpdate}
          disabled={refreshing}
        >
          <Icon
            name="refresh"
            size={24}
            color={refreshing ? currentTheme.placeholderColor : currentTheme.iconColor}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleManualUpdate}
            colors={[currentTheme.primaryColor]}
            tintColor={currentTheme.primaryColor}
            progressBackgroundColor={currentTheme.cardBackground}
          />
        }
      >
        {updates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="check-circle" size={64} color={currentTheme.placeholderColor} />
            <Text style={[styles.emptyText, { color: currentTheme.textColor }]}>
              No updates yet
            </Text>
            <Text style={[styles.emptySubtext, { color: currentTheme.secondaryTextColor }]}>
              Pull down or tap the refresh button to check for updates
            </Text>
          </View>
        ) : (
          <>
            {groupedUpdates.today.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                  Today
                </Text>
                {groupedUpdates.today.map((update) => (
                  <UpdateBookCard
                    key={update.id}
                    update={update}
                    workDAO={workDAO}
                    theme={currentTheme}
                    onPress={() => handleUpdatePress(update)}
                  />
                ))}
              </View>
            )}

            {groupedUpdates.yesterday.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                  Yesterday
                </Text>
                {groupedUpdates.yesterday.map((update) => (
                  <UpdateBookCard
                    key={update.id}
                    update={update}
                    workDAO={workDAO}
                    theme={currentTheme}
                    onPress={() => handleUpdatePress(update)}
                  />
                ))}
              </View>
            )}

            {groupedUpdates.older.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: currentTheme.textColor }]}>
                  Earlier
                </Text>
                {groupedUpdates.older.map((update) => (
                  <UpdateBookCard
                    key={update.id}
                    update={update}
                    workDAO={workDAO}
                    theme={currentTheme}
                    onPress={() => handleUpdatePress(update)}
                  />
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flex: 1,
  },
  lastUpdateText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  bottomPadding: {
    height: 100,
  },
});

export default UpdateScreen;