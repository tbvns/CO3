import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import HistoryItem from './Item';

const HistoryList = ({ history, currentTheme, loadingMore, hasMore,
                       libraryDAO,
                       workDAO,
                       setScreens,
                       settingsDAO,
                       historyDAO,
                       progressDAO}) => {
    const groupHistoryByDate = (historyItems) => {
        if (!historyItems || historyItems.length === 0) {
            return [];
        }

        const groups = {};
        historyItems.forEach(item => {
            const date = new Date(item.date);
            const dateKey = date.toDateString();

            if (!groups[dateKey]) {
                groups[dateKey] = [];
            }
            groups[dateKey].push(item);
        });

        return Object.entries(groups).sort(([a], [b]) => new Date(b) - new Date(a));
    };

    return (
        <View style={styles.historyContainer}>
            {groupHistoryByDate(history).map(([dateKey, items]) => (
                <View key={dateKey} style={styles.dateGroup}>
                    <Text style={[styles.dateHeader, { color: currentTheme.textColor }]}>
                        {/* This part correctly formats the valid dateKey for display */}
                        {new Date(dateKey).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                    {items.map(item => (
                        <HistoryItem
                            key={item.id}
                            item={item}
                            currentTheme={currentTheme}
                            settingsDAO={settingsDAO}
                            workDAO={workDAO}
                            libraryDAO={libraryDAO}
                            setScreens={setScreens}
                            historyDAO={historyDAO}
                            progressDAO={progressDAO}
                        />
                    ))}
                </View>
            ))}

            {/* Loading indicator for pagination */}
            {loadingMore && (
                <View style={styles.loadingMore}>
                    <ActivityIndicator size="small" color={currentTheme.primaryColor} />
                    <Text style={[styles.loadingMoreText, { color: currentTheme.placeholderColor }]}>
                        Loading more...
                    </Text>
                </View>
            )}

            {/* End of list message */}
            {!hasMore && history.length > 0 && (
                <View style={styles.endOfList}>
                    <Text style={[styles.endOfListText, { color: currentTheme.placeholderColor }]}>
                        You've reached the end of your reading history
                    </Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default HistoryList;
