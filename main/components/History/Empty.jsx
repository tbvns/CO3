import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

const EmptyState = ({
  currentTheme,
  isFilterActive,
  textLine1 = 'No reading history yet',
  textLine2 = 'Start reading to see your progress here',
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.emptyState}>
      <Text
        style={[
          styles.emptyStateText,
          { color: currentTheme.placeholderColor },
        ]}
      >
        {isFilterActive ? t('component_empty_title') : textLine1}
      </Text>
      <Text
        style={[
          styles.emptyStateSubtext,
          { color: currentTheme.placeholderColor },
        ]}
      >
        {isFilterActive ? t('component_empty_sub') : textLine2}
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