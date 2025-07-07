import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { getRecentWorks } from '../web/browse/fetchWorks';
import BookCard from '../components/Library/BookCard';

const BrowseScreen = ({ currentTheme, viewMode = 'med' }) => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRecentWorks();
  }, []);

  const loadRecentWorks = async () => {
    try {
      setLoading(true);
      setError(null);
      const recentWorks = await getRecentWorks();
      setWorks(recentWorks);
    } catch (err) {
      console.error('Error loading recent works:', err);
      setError({
        message: err.message || 'Failed to load recent works',
        status: err.response?.status || 'Unknown',
        statusText: err.response?.statusText || 'Network Error'
      });
    } finally {
      setLoading(false);
    }
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
            Loading recent works...
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
                onPress={loadRecentWorks}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
    );
  }

  return (
      <ScrollView style={[styles.mainContent, { backgroundColor: currentTheme.backgroundColor }]}>
        <View style={styles.contentContainer}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>
            Recent Works
          </Text>
          <Text style={[styles.subtitle, { color: currentTheme.placeholderColor }]}>
            Discover the latest {works.length} works from Archive of Our Own
          </Text>

          {works.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: currentTheme.secondaryTextColor }]}>
                  No works found
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
});

export default BrowseScreen;