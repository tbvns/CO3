import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EmptyState = ({ currentTheme, isFilterActive }) => {
  return (
    <View style={styles.emptyState}>
      <Text
        style={[
          styles.emptyStateText,
          { color: currentTheme.placeholderColor },
        ]}
      >
        {isFilterActive
          ? 'No reading history for selected dates'
          : 'No reading history yet'}
      </Text>
      <Text
        style={[
          styles.emptyStateSubtext,
          { color: currentTheme.placeholderColor },
        ]}
      >
        {isFilterActive
          ? 'Try selecting different dates'
          : 'Start reading to see your progress here'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
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
});

export default EmptyState;