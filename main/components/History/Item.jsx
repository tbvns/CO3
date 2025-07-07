import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const HistoryItem = ({ item, currentTheme }) => {
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

    return (
        <View style={[styles.historyItem, { backgroundColor: currentTheme.cardBackground }]}>
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