import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import BookDetailsModal from './BookDetailsModal';

const BookCard = ({ book, viewMode, theme, onUpdate }) => {
  const [isMainModalOpen, setIsMainModalOpen] = useState(false);
  const [isAllTagsModalOpen, setIsAllTagsModalOpen] = useState(false);

  const isSmall = viewMode === 'small';
  const isMed = viewMode === 'med';
  const isFull = viewMode === 'full';

  const showDescriptionInCard = isFull;
  const showTagsWarningsButton = !isSmall;
  const showMetadataInCard = !isSmall;

  let buttonText = "Show Tags & Warnings";
  if (isMed) {
    buttonText = "Show Tags, Warnings & Description";
  }

  return (
    <View style={[
      styles.card,
      { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
      isSmall && styles.smallCard
    ]}>
      <View style={[styles.imageSection, isSmall && styles.smallImageSection]}>
        <Image
          source={{ uri: book.image || 'https://via.placeholder.com/100x100' }}
          style={[styles.image, isSmall && styles.smallImage]}
        />
        <View style={styles.titleSection}>
          <Text style={[
            styles.title,
            { color: theme.textColor },
            isSmall && styles.smallTitle
          ]}>
            {book.title}
          </Text>
          <Text style={[
            styles.author,
            { color: theme.secondaryTextColor },
            isSmall && styles.smallAuthor
          ]}>
            by {book.author}
          </Text>
        </View>
      </View>

      {!isSmall && (
        <View style={styles.contentSection}>
          {showTagsWarningsButton && (book.tags.length > 0 || book.warnings.length > 0 || isMed) && (
            <TouchableOpacity
              style={styles.tagsButton}
              onPress={() => setIsMainModalOpen(true)}
            >
              <Icon name="local-offer" size={16} color={theme.primaryColor} />
              <Text style={[styles.tagsButtonText, { color: theme.primaryColor }]}>
                {buttonText}
              </Text>
            </TouchableOpacity>
          )}

          {showDescriptionInCard && (
            <Text style={[styles.description, { color: theme.textColor }]} numberOfLines={3}>
              {book.description}
            </Text>
          )}

          {showMetadataInCard && (
            <View style={styles.metadata}>
              <View style={styles.metadataRow}>
                <Icon name="schedule" size={14} color={theme.iconColor} />
                <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                  Updated: {book.lastUpdated}
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="favorite" size={14} color="#ef4444" />
                <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                  {book.likes?.toLocaleString() || 0} Likes
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="bookmark" size={14} color="#eab308" />
                <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                  {book.bookmarks?.toLocaleString() || 0} Bookmarks
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="visibility" size={14} color="#8b5cf6" />
                <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                  {book.views?.toLocaleString() || 0} Views
                </Text>
              </View>
              <View style={styles.metadataRow}>
                <Icon name="language" size={14} color="#22c55e" />
                <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                  {book.language || 'English'}
                </Text>
              </View>
            </View>
          )}
        </View>
      )}

      {isSmall && (
        <TouchableOpacity
          style={[styles.infoButton, { backgroundColor: theme.primaryColor }]}
          onPress={() => setIsMainModalOpen(true)}
        >
          <Icon name="info" size={20} color="white" />
        </TouchableOpacity>
      )}

      <BookDetailsModal
        book={book}
        isOpen={isMainModalOpen}
        onClose={() => setIsMainModalOpen(false)}
        mode={isSmall ? 'full' : 'summary'}
        theme={theme}
        onShowAllTags={() => {
          setIsMainModalOpen(false);
          setIsAllTagsModalOpen(true);
        }}
      />

      <BookDetailsModal
        book={book}
        isOpen={isAllTagsModalOpen}
        onClose={() => setIsAllTagsModalOpen(false)}
        mode="allTags"
        theme={theme}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
    marginBottom: 16,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'column',
  },
  smallCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  smallImageSection: {
    marginBottom: 0,
    flex: 1,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 8,
    marginRight: 16,
  },
  smallImage: {
    width: 48,
    height: 48,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  smallTitle: {
    fontSize: 16,
  },
  author: {
    fontSize: 14,
  },
  smallAuthor: {
    fontSize: 12,
  },
  contentSection: {
    flex: 1,
  },
  tagsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tagsButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metadataText: {
    fontSize: 12,
    marginLeft: 4,
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BookCard;
