import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';

const BrowseScreen = ({ currentTheme }) => {
  return (
    <ScrollView style={styles.mainContent}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Browse Books</Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          Discover new books and authors
        </Text>
        {/* Add your browse screen content here */}
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

export default BrowseScreen;
