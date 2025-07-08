import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import { getRecentWorks } from '../web/browse/fetchWorks'; // Assuming this path is correct
import BookCard from '../components/Library/BookCard'; // Assuming this path is correct
import AdvancedSearchScreen from './advancedSearch'; // Import the new screen

// A simple SVG Filter Icon to avoid dependency
const FilterIcon = ({ color, size }) => (
  <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
    <View style={{ width: size, height: size * 0.15, backgroundColor: color, borderRadius: size * 0.05, marginBottom: size * 0.1 }} />
    <View style={{ width: size * 0.66, height: size * 0.15, backgroundColor: color, borderRadius: size * 0.05, marginBottom: size * 0.1 }} />
    <View style={{ width: size * 0.33, height: size * 0.15, backgroundColor: color, borderRadius: size * 0.05 }} />
  </View>
);


const BrowseScreen = ({ currentTheme, viewMode = 'med' }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSearchVisible, setIsSearchVisible] = useState(false);

  useEffect(() => {
    loadRecentWorks();
  }, []);

  const loadRecentWorks = async (searchUrl = null) => {
    try {
      setLoading(true);
      setError(null);
      // If a search URL is provided, use it. Otherwise, get recent works.
      const fetchedWorks = await getRecentWorks(searchUrl);
      setWorks(fetchedWorks);
    } catch (err) {
      console.error('Error loading works:', err);
      setError({
        message: err.message || 'Failed to load works',
        status: err.response?.status || 'Unknown',
        statusText: err.response?.statusText || 'Network Error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (url) => {
    console.log("Applying search URL:", url);
    // Here you would either fetch with the new URL or open a WebView
    // For now, we'll just show an alert and reload recent works as a placeholder.
    Alert.alert("Search Applied", "Fetching works with the new filters. (This is a placeholder - see console for URL)");
    loadRecentWorks(url);
  };

  const formatWork = (work) => {
    return {
      id: work.id,
      title: work.title,
      author: work.author,
      rating: work.rating,
      category: work.category,
      warningStatus: work.warningStatus,
      isCompleted: work.isCompleted,
      tags: work.tags,
      warnings: work.warnings,
      description: work.description,
      lastUpdated: work.updated ? new Date(work.updated).toLocaleDateString() : 'Unknown',
      likes: work.kudos,
      bookmarks: work.bookmarks,
      views: work.hits,
      language: work.language,
    };
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <ActivityIndicator size="large" color={currentTheme.primaryColor} />
        <Text style={[styles.loadingText, { color: currentTheme.textColor }]}>
          Loading works...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={[styles.errorContainer, { backgroundColor: currentTheme.cardBackground, borderColor: currentTheme.borderColor }]}>
          <Text style={[styles.errorTitle, { color: currentTheme.textColor }]}>
            Failed to Load Works
          </Text>
          <Text style={[styles.errorMessage, { color: currentTheme.secondaryTextColor }]}>
            {error.message}
          </Text>
          {error.status !== 'Unknown' && (
            <Text style={[styles.errorDetails, { color: currentTheme.placeholderColor }]}>
              HTTP {error.status}: {error.statusText}
            </Text>
          )}
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => loadRecentWorks()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{flex: 1, backgroundColor: currentTheme.backgroundColor}}>
      <ScrollView style={styles.mainContent} contentContainerStyle={styles.contentContainer}>
        <Text style={[styles.title, { color: currentTheme.textColor }]}>
          Browse Works
        </Text>
        <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
          Discover the latest {works.length} works from Archive of Our Own
        </Text>

        {works.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: currentTheme.secondaryTextColor }]}>
              No works found for the selected filters.
            </Text>
          </View>
        ) : (
          works.map((work) => (
            <BookCard
              key={work.id || Math.random()}
              book={formatWork(work)}
              viewMode={viewMode}
              theme={currentTheme}
              onUpdate={() => {}}
            />
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: currentTheme.primaryColor }]}
        onPress={() => setIsSearchVisible(true)}
      >
        <FilterIcon color="white" size={24} />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={false}
        visible={isSearchVisible}
        onRequestClose={() => setIsSearchVisible(false)}
      >
        <AdvancedSearchScreen
          currentTheme={currentTheme}
          onClose={() => setIsSearchVisible(false)}
          onSearch={handleSearch}
        />
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 80, // Extra padding to avoid FAB overlap
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    padding: 24,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    maxWidth: '90%',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  errorDetails: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});

export default BrowseScreen;
