import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
} from 'react-native';

const UpdateScreen = ({ currentTheme }) => {
  return (
    <ScrollView style={styles.mainContent}>
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>Update Library</Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          Check for updates to your books and sync your library
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          This hasn't been implemented yet. It'll come in a future update. Stay tuned !
        </Text>
        {/* Add your update screen content here */}
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

export default UpdateScreen;
