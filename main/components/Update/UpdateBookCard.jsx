import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';

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

const UpdateBookCard = ({ update, workDAO, theme, onPress }) => {
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWork();
  }, [update.workId]);

  const loadWork = async () => {
    try {
      const workData = await workDAO.get(update.workId);
      setWork(workData);
    } catch (error) {
      console.error('Error loading work:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !work) {
    return (
      <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }]}>
        <Text style={[styles.loadingText, { color: theme.secondaryTextColor }]}>Loading...</Text>
      </View>
    );
  }

  const ratingImage = imageMappings.rating[work.rating] || imageMappings.rating.default;
  let categoryImage = imageMappings.category[work.category] || imageMappings.category.default;
  let warningImage = imageMappings.warningStatus[work.warnings] || imageMappings.warningStatus.default;
  let statusImage = imageMappings.isCompleted[work.isCompleted] || imageMappings.isCompleted.null;

  if (work.category && work.category.split(" ").length > 1 && work.category !== "No category") {
    categoryImage = imageMappings.category.Multi;
  }

  if (work.warningStatus === 'Yes') {
    warningImage = imageMappings.warningStatus.WarningGiven;
  }

  if (work.isCompleted === null) {
    if (work.chapterCount === work.currentChapter) {
      statusImage = imageMappings.isCompleted.true;
    } else {
      statusImage = imageMappings.isCompleted.false;
    }
  }

  const images = [ratingImage, categoryImage, warningImage, statusImage];
  const gridSize = 40;
  const imageSize = gridSize / 2;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.card,
        { backgroundColor: theme.cardBackground, borderColor: theme.borderColor }
      ]}
    >
      <View style={styles.content}>
        {/* Status image grid */}
        <View style={[styles.imageGrid, {
          width: gridSize,
          height: gridSize,
          borderRadius: 4,
          overflow: 'hidden',
        }]}>
          <View style={styles.imageRow}>
            <Image
              source={images[0]}
              style={[styles.statusImage, { width: imageSize, height: imageSize, marginRight: -1, marginBottom: -1 }]}
            />
            <Image
              source={images[1]}
              style={[styles.statusImage, { width: imageSize, height: imageSize, marginBottom: -1 }]}
            />
          </View>
          <View style={styles.imageRow}>
            <Image
              source={images[2]}
              style={[styles.statusImage, { width: imageSize, height: imageSize, marginRight: -1 }]}
            />
            <Image
              source={images[3]}
              style={[styles.statusImage, { width: imageSize, height: imageSize }]}
            />
          </View>
        </View>

        {/* Title and metadata */}
        <View style={styles.textContent}>
          <Text style={[styles.title, { color: theme.textColor }]} numberOfLines={2}>
            {work.title}
          </Text>
          <Text style={[styles.chapter, { color: theme.primaryColor }]}>
            Chapter {update.chapterNumber}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageGrid: {
    marginRight: 12,
    borderRadius: 4,
    overflow: 'hidden',
  },
  imageRow: {
    flexDirection: 'row',
  },
  statusImage: {
    resizeMode: 'contain',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  chapter: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 14,
  },
});

export default UpdateBookCard;