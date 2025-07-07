import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const HistoryHeader = ({
                           currentTheme,
                           totalCount,
                           isFilterActive,
                           hasHistory,
                           onClearHistory,
                           onClearFilter,
                       }) => {
    return (
        <View style={styles.header}>
            <View>
                <Text style={[styles.title, { color: currentTheme.textColor }]}>
                    Reading History
                </Text>
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
                        onPress={onClearFilter}
                    >
                        <Text style={[styles.clearFilterText, { color: 'white' }]}>
                            Clear Filter
                        </Text>
                    </TouchableOpacity>
                )}

                {hasHistory && (
                    <TouchableOpacity
                        style={[styles.clearButton, { borderColor: currentTheme.primaryColor }]}
                        onPress={onClearHistory}
                    >
                        <Text style={[styles.clearButtonText, { color: currentTheme.primaryColor }]}>
                            Clear
                        </Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default HistoryHeader;