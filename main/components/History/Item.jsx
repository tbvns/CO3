import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import WorkScreen from '../../screens/workScreen';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const HistoryItem = ({
  item,
  currentTheme,
  libraryDAO,
  workDAO,
  setScreens,
  settingsDAO,
  historyDAO,
  progressDAO,
  kudoHistoryDAO,
  hasChapter = true,
  chapterDAO,
}) => {
  const { t } = useTranslation();

  const formatDate = timestamp => {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      return t('general_not_applicable');
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return t('general_not_applicable');
    }

    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return t('component_history_item_date_today', {
        time: date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } else if (diffInDays === 1) {
      return t('component_history_item_date_yesterday', {
        time: date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      });
    } else if (diffInDays < 7) {
      return t('component_history_item_date_day', { days: diffInDays });
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatChapterRange = (start, end) => {
    if (!end || start === end) {
      return t('component_history_item_chapter_start', { start: start + 1 });
    }
    return t('component_history_item_chapter_start_end', {
      start: start + 1,
      end: end + 1,
    });
  };

  const navigation = useNavigation();

  function handleClick() {
    if (hasChapter) {
      navigation.push("Work", {
        workId: item.workId,
        currentTheme: currentTheme,
        settingsDAO: settingsDAO,
        workDAO: workDAO,
        libraryDAO: libraryDAO,
        setScreens: setScreens,
        historyDAO: historyDAO,
        progressDAO: progressDAO,
        loadChapter: item.chapterEnd || item.chapter || 0,
        kudoHistoryDAO: kudoHistoryDAO,
        chapterDAO: chapterDAO,
      })
    } else {
      navigation.push("Work", {
        workId: item.workId,
        currentTheme: currentTheme,
        settingsDAO: settingsDAO,
        workDAO: workDAO,
        libraryDAO: libraryDAO,
        setScreens: setScreens,
        historyDAO: historyDAO,
        progressDAO: progressDAO,
        kudoHistoryDAO: kudoHistoryDAO,
        chapterDAO: chapterDAO,
      })
    }
  }

  return (
    <Pressable
      onPress={handleClick}
      style={({ pressed }) => [
        styles.historyItem,
        { backgroundColor: currentTheme.cardBackground },
        pressed && { opacity: 0.7 },
      ]}
    >
      <View style={styles.itemHeader}>
        <Text
          style={[styles.bookTitle, { color: currentTheme.textColor }]}
          numberOfLines={1}
        >
          {item.book_title || t('general_unknown_work')}
        </Text>
        <Text
          style={[styles.readTime, { color: currentTheme.placeholderColor }]}
        >
          {formatDate(item.date)}
        </Text>
      </View>

      <Text
        style={[styles.bookAuthor, { color: currentTheme.placeholderColor }]}
        numberOfLines={1}
      >
        by {item.book_author || t('general_unknown_author')}
      </Text>

      {hasChapter ? (
        <View style={styles.chapterInfo}>
          <Text
            style={[styles.chapterText, { color: currentTheme.primaryColor }]}
          >
            {formatChapterRange(item.chapter, item.chapterEnd)}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
});

export default HistoryItem;
