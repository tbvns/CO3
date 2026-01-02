import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import WorkScreen from '../../screens/workScreen';

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
}) => {
  console.log(item.date);

  const formatDate = timestamp => {
    if (typeof timestamp !== 'number' || isNaN(timestamp)) {
      return 'N/A';
    }

    const date = new Date(timestamp);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }

    const now = new Date();
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `Today at ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffInDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatChapterRange = (start, end) => {
    if (!end || start === end) {
      return `Chapter ${start + 1}`;
    }
    return `Chapters ${start + 1} - ${end + 1}`;
  };

  function handleClick() {
    if (hasChapter) {
      setScreens(prevScreens => [
        ...prevScreens,
        <WorkScreen
          workId={item.workId}
          currentTheme={currentTheme}
          settingsDAO={settingsDAO}
          workDAO={workDAO}
          libraryDAO={libraryDAO}
          setScreens={setScreens}
          historyDAO={historyDAO}
          progressDAO={progressDAO}
          loadChapter={item.chapter || item.chapterEnd || 0}
          kudoHistoryDAO={kudoHistoryDAO}
        />,
      ]);
    } else {
      setScreens(prevScreens => [
        ...prevScreens,
        <WorkScreen
          workId={item.workId}
          currentTheme={currentTheme}
          settingsDAO={settingsDAO}
          workDAO={workDAO}
          libraryDAO={libraryDAO}
          setScreens={setScreens}
          historyDAO={historyDAO}
          progressDAO={progressDAO}
          kudoHistoryDAO={kudoHistoryDAO}
        />,
      ]);
    }
  }

  return (
    <TouchableOpacity onPress={handleClick} activeOpacity={0.7}>
      <View
        style={[
          styles.historyItem,
          { backgroundColor: currentTheme.cardBackground },
        ]}
      >
        <View style={styles.itemHeader}>
          <Text
            style={[styles.bookTitle, { color: currentTheme.textColor }]}
            numberOfLines={1}
          >
            {/* Use item.book_title if available (from joined data), otherwise fallback */}
            {item.book_title || 'Unknown Book'}
          </Text>
          <Text
            style={[styles.readTime, { color: currentTheme.placeholderColor }]}
          >
            {/* Use item.date from the History model */}
            {formatDate(item.date)}
          </Text>
        </View>

        <Text
          style={[styles.bookAuthor, { color: currentTheme.placeholderColor }]}
          numberOfLines={1}
        >
          {/* Use item.book_author if available, otherwise fallback */}
          by {item.book_author || 'Unknown Author'}
        </Text>

        {hasChapter ? (
          <View style={styles.chapterInfo}>
            <Text
              style={[styles.chapterText, { color: currentTheme.primaryColor }]}
            >
              {/* Use item.chapter and item.chapterEnd from the History model */}
              {formatChapterRange(item.chapter, item.chapterEnd)}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
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
