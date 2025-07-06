import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';

const MoreScreen = ({ currentTheme }) => {
  return (
    <ScrollView style={styles.mainContent}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>More Options</Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          Additional settings and features
        </Text>
        {/* Add your more screen content here */}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
    marginBottom: 20,
  },
});

export default MoreScreen;
