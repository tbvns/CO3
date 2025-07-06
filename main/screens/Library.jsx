import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BookCard from '../components/BookCard';

const LibraryScreen = ({
                         searchTerm,
                         setSearchTerm,
                         currentTheme,
                         books,
                         viewMode,
                         loadBooks,
                         setIsAddWorkModalOpen
                       }) => {
  const filteredBooks = books.filter(book =>
    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    book.author.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ScrollView style={styles.mainContent}>
      <View style={styles.contentContainer}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: currentTheme.textColor }]}>Your Library</Text>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: currentTheme.primaryColor }]}
            onPress={() => setIsAddWorkModalOpen(true)}
          >
            <Icon name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {filteredBooks.length > 0 ? (
          filteredBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              viewMode={viewMode}
              theme={currentTheme}
              onUpdate={loadBooks}
            />
          ))
        ) : (
          <Text style={[styles.noBooks, { color: currentTheme.placeholderColor }]}>
            No books found matching your search.
          </Text>
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
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noBooks: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});

export default LibraryScreen;
