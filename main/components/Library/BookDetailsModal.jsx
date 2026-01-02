import React from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const BookDetailsModal = ({
  book,
  isOpen,
  onClose,
  mode,
  theme,
  onShowAllTags,
  openTagSearch,
}) => {
  if (!book) return null;

  const MAX_TAGS_IN_SUMMARY_MODAL = 5;

  const showTagsSection =
    mode === 'summary' || mode === 'full' || mode === 'allTags';
  const showWarningsSection = mode === 'summary' || mode === 'full';
  const showDescriptionSection = mode === 'summary' || mode === 'full';
  const showMetadataSection = mode === 'full';

  let modalTitle = `Details for "${book.title}"`;
  if (mode === 'summary') {
    modalTitle = `Tags & Warnings for "${book.title}"`;
  } else if (mode === 'allTags') {
    modalTitle = `All Tags for "${book.title}"`;
  }

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.modalContainerWrapper} pointerEvents="box-none">
          <View style={styles.modalContainer}>
            <View
              style={[styles.modal, { backgroundColor: theme.cardBackground }]}
            >
              <View
                style={[
                  styles.header,
                  { borderBottomColor: theme.borderColor },
                ]}
              >
                <Text
                  style={[styles.title, { color: theme.textColor }]}
                  numberOfLines={2}
                >
                  {modalTitle}
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Icon name="close" size={24} color={theme.iconColor} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.content}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={true}
              >
                {showTagsSection && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon
                        name="local-offer"
                        size={18}
                        color={theme.primaryColor}
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        Tags:
                      </Text>
                    </View>
                    {book.tags && book.tags.length > 0 ? (
                      <View style={styles.tagsContainer}>
                        {((mode === 'summary' || mode === 'full') &&
                        book.tags.length > MAX_TAGS_IN_SUMMARY_MODAL
                          ? book.tags.slice(0, MAX_TAGS_IN_SUMMARY_MODAL)
                          : book.tags
                        ).map((tag, index) => (
                          <TouchableOpacity
                            key={index}
                            style={[
                              styles.tag,
                              { backgroundColor: theme.tagBackground },
                            ]}
                            onPress={() => openTagSearch(tag)}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.tagText,
                                { color: theme.tagTextColor },
                              ]}
                            >
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {(mode === 'summary' || mode === 'full') &&
                          book.tags.length > MAX_TAGS_IN_SUMMARY_MODAL &&
                          onShowAllTags && (
                            <TouchableOpacity
                              style={[
                                styles.seeAllButton,
                                { borderColor: theme.primaryColor },
                              ]}
                              onPress={onShowAllTags}
                            >
                              <Text
                                style={[
                                  styles.seeAllText,
                                  { color: theme.primaryColor },
                                ]}
                              >
                                See all tags ({book.tags.length})
                              </Text>
                            </TouchableOpacity>
                          )}
                      </View>
                    ) : (
                      <Text
                        style={[
                          styles.noDataText,
                          { color: theme.secondaryTextColor },
                        ]}
                      >
                        No tags available.
                      </Text>
                    )}
                  </View>
                )}

                {showWarningsSection && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon name="warning" size={18} color="#ef4444" />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        Warnings:
                      </Text>
                    </View>
                    {book.warnings && book.warnings.length > 0 ? (
                      <ScrollView
                        horizontal
                        nestedScrollEnabled={true}
                        showsHorizontalScrollIndicator={false}
                      >
                        <View style={styles.warningsContainer}>
                          {book.warnings.map((warning, index) => (
                            <View
                              key={index}
                              style={[
                                styles.warning,
                                { backgroundColor: theme.warningBackground },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.warningText,
                                  { color: theme.warningTextColor },
                                ]}
                              >
                                {warning}
                              </Text>
                            </View>
                          ))}
                        </View>
                      </ScrollView>
                    ) : (
                      <Text
                        style={[
                          styles.noDataText,
                          { color: theme.secondaryTextColor },
                        ]}
                      >
                        No specific warnings for this book.
                      </Text>
                    )}
                  </View>
                )}

                {showDescriptionSection && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon
                        name="description"
                        size={18}
                        color={theme.iconColor}
                      />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        Description:
                      </Text>
                    </View>
                    <Text
                      style={[styles.description, { color: theme.textColor }]}
                    >
                      {book.description}
                    </Text>
                  </View>
                )}

                {showMetadataSection && (
                  <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                      <Icon name="info" size={18} color={theme.iconColor} />
                      <Text
                        style={[
                          styles.sectionTitle,
                          { color: theme.textColor },
                        ]}
                      >
                        Details:
                      </Text>
                    </View>
                    <View style={styles.metadataContainer}>
                      <View style={styles.metadataRow}>
                        <Icon
                          name="schedule"
                          size={14}
                          color={theme.iconColor}
                        />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: theme.secondaryTextColor },
                          ]}
                        >
                          Updated: {book.lastUpdated}
                        </Text>
                      </View>
                      <View style={styles.metadataRow}>
                        <Icon name="favorite" size={14} color="#ef4444" />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: theme.secondaryTextColor },
                          ]}
                        >
                          {book.likes?.toLocaleString() || 0} Likes
                        </Text>
                      </View>
                      <View style={styles.metadataRow}>
                        <Icon name="bookmark" size={14} color="#eab308" />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: theme.secondaryTextColor },
                          ]}
                        >
                          {book.bookmarks?.toLocaleString() || 0} Bookmarks
                        </Text>
                      </View>
                      <View style={styles.metadataRow}>
                        <Icon name="visibility" size={14} color="#8b5cf6" />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: theme.secondaryTextColor },
                          ]}
                        >
                          {book.views?.toLocaleString() || 0} Views
                        </Text>
                      </View>
                      <View style={styles.metadataRow}>
                        <Icon name="language" size={14} color="#22c55e" />
                        <Text
                          style={[
                            styles.metadataText,
                            { color: theme.secondaryTextColor },
                          ]}
                        >
                          {book.language || 'English'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    position: 'relative',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
  modalContainerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '70%',
  },
  modal: {
    borderRadius: 12,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
  },
  seeAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  warningsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  warning: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  warningText: {
    fontSize: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  metadataContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    marginLeft: 4,
  },
  noDataText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default BookDetailsModal;