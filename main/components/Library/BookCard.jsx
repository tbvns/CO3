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
import More from "../../screens/More";
import MoreScreen from "../../screens/More";
import ChapterInfoScreen from '../../screens/workScreen';

const imageMappings = {
  rating: {
    'General Audiences': require('../../res/status/public/icon-general-public.png'),
    'Teen And Up Audiences': require('../../res/status/public/icon-teen-public.png'),
    'Mature': require('../../res/status/public/icon-mature-public.png'),
    'Explicit': require('../../res/status/public/icon-explicite-public.png'),
    'Not Rated': require('../../res/status/public/icon-unknown-public.png'),
    'default': require('../../res/status/public/icon-unknown-public.png'),
  },
  category: {
    'F/F': require('../../res/status/relationship/icon-ff-relationships.png'),
    'F/M': require('../../res/status/relationship/icon-inter-relationships.png'),
    'M/M': require('../../res/status/relationship/icon-mm-relationships.png'),
    'Multi': require('../../res/status/relationship/icon-multiple-relationships.png'),
    'Gen': require('../../res/status/relationship/icon-none-relationships.png'),
    'Other': require('../../res/status/relationship/icon-other-relationships.png'),
    'None': require('../../res/status/relationship/icon-none-relationships.png'),
    'default': require('../../res/status/relationship/icon-unknown-relationships.png'),
  },
  warningStatus: {
    'Creator Chose Not To Use Archive Warnings': require('../../res/status/warnings/icon-unspecified-warning.png'),
    'WarningGiven': require('../../res/status/warnings/icon-has-warning.png'),
    'No Archive Warnings Apply': require('../../res/status/warnings/icon-unknown-warning.png'),
    'ExternalWork': require('../../res/status/warnings/icon-web-warning.png'),
    'default': require('../../res/status/warnings/icon-unknown-warning.png'),
  },
  isCompleted: {
    true: require('../../res/status/status/icon-done-status.png'),
    false: require('../../res/status/status/icon-unfinished-status.png'),
    null: require('../../res/status/status/icon-unknown-status.png'),
    undefined: require('../../res/status/status/icon-unknown-status.png'),
  }
};

const BookCard = ({ book, viewMode, theme, onUpdate, setScreens, screens, libraryDAO, workDAO, settingsDAO, historyDAO, progressDAO, kudoHistoryDAO, openTagSearch, showDate = true }) => {
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

  const ratingImage = imageMappings.rating[book.rating] || imageMappings.rating.default;
  let categoryImage = imageMappings.category[book.category] || imageMappings.category.default;
  let warningImage = imageMappings.warningStatus[book.warnings] || imageMappings.warningStatus.default;
  let statusImage = imageMappings.isCompleted[book.isCompleted] || imageMappings.isCompleted.null;

  //Additional checks
  if (book.category.split(" ").length > 1 && book.category !== "No category") {
    categoryImage = imageMappings.category.Multi;
  }

  if (book.warningStatus === 'Yes') {
    warningImage = imageMappings.warningStatus.WarningGiven;
  }

  if (book.isCompleted === null) {
    if (book.chapterCount === book.currentChapter) {
      statusImage = imageMappings.isCompleted.true
    } else {
      statusImage = imageMappings.isCompleted.false
    }
  }

  const images = [ratingImage, categoryImage, warningImage, statusImage];
  const gridSize = isSmall ? 50 : 75;
  const imageSize = gridSize / 2;

  return (
      <TouchableOpacity
          onPress={() => {setScreens([...screens,
            <ChapterInfoScreen
              workId={book.id}
              currentTheme={theme}
              libraryDAO={libraryDAO}
              workDAO={workDAO}
              setScreens={setScreens}
              settingsDAO={settingsDAO}
              historyDAO={historyDAO}
              progressDAO={progressDAO}
              kudoHistoryDAO={kudoHistoryDAO}
              openTagSearch={openTagSearch}
            />

          ])}}
          activeOpacity={0.7}
          style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.borderColor },
        isSmall && styles.smallCard
      ]}>
        <View style={[styles.imageSection, isSmall && styles.smallImageSection]}>
          {/* Status image grid */}
          <View style={[styles.imageGrid, {
            width: gridSize,
            height: gridSize,
            marginRight: 16,
            borderRadius: 4,
            overflow: 'hidden',
          }]}>
            <View style={styles.imageRow}>
              <Image
                  source={images[0]}
                  style={[
                    styles.statusImage,
                    {
                      width: imageSize,
                      height: imageSize,
                      marginRight: -1,
                      marginBottom: -1,
                    }
                  ]}
              />
              <Image
                  source={images[1]}
                  style={[
                    styles.statusImage,
                    {
                      width: imageSize,
                      height: imageSize,
                      marginBottom: -1,
                    }
                  ]}
              />
            </View>
            <View style={styles.imageRow}>
              <Image
                  source={images[2]}
                  style={[
                    styles.statusImage,
                    {
                      width: imageSize,
                      height: imageSize,
                      marginRight: -1,
                    }
                  ]}
              />
              <Image
                  source={images[3]}
                  style={[
                    styles.statusImage,
                    {
                      width: imageSize,
                      height: imageSize,
                    }
                  ]}
              />
            </View>
          </View>

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

                    {showDate ?
                      <View style={styles.metadataRow}>
                        <Icon name="schedule" size={14} color={theme.iconColor} />
                        <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                          Updated: {book.lastUpdated}
                        </Text>
                      </View> : null}

                    <View style={styles.metadataRow}>
                      <Icon name="favorite" size={14} color="#ef4444" />
                      <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                        {book.likes?.toLocaleString() || "?"} Likes
                      </Text>
                    </View>
                    <View style={styles.metadataRow}>
                      <Icon name="book" size={14} color="#f97316" />
                      <Text style={[styles.metadataText, { color: theme.secondaryTextColor }]}>
                        {book.currentChapter + "/" + (book.chapterCount || "?")} Chapters
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
            openTagSearch={openTagSearch}
        />

        <BookDetailsModal
            book={book}
            isOpen={isAllTagsModalOpen}
            onClose={() => setIsAllTagsModalOpen(false)}
            mode="allTags"
            theme={theme}
            openTagSearch={openTagSearch}
        />
      </TouchableOpacity>
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
  imageGrid: {
    marginRight: 16,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
    marginBottom: 0,
  },
  statusImage: {
    resizeMode: 'contain',
    margin: 0,
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
