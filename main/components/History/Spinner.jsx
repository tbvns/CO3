import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const LoadingSpinner = ({ currentTheme, message = 'Loading...' }) => {
  return (
    <View
      style={[
        styles.loadingContainer,
        { backgroundColor: currentTheme.backgroundColor },
      ]}
    >
      <ActivityIndicator size="large" color={currentTheme.primaryColor} />
      <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        marginTop: 16,
    },
});

export default LoadingSpinner;