import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  DeviceEventEmitter,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {
  addToDownloadQueue,
  getDownloadQueue,
} from '../../downloads/DownloadQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { deleteDownloaded, isDownloaded } from '../../downloads/Downloader';
import Toast from 'react-native-toast-message';
import { processQueue } from '../../downloads/DownloadManager';

const imageMappings = {
  rating: {
    'General Audiences': require('../../res/status/public/icon-general-public.png'),
    'Teen And Up Audiences': require('../../res/status/public/icon-teen-public.png'),
    Mature: require('../../res/status/public/icon-mature-public.png'),
    Explicit: require('../../res/status/public/icon-explicite-public.png'),
    'Not Rated': require('../../res/status/public/icon-unknown-public.png'),
    default: require('../../res/status/public/icon-unknown-public.png'),
  },
  category: {
    'F/F': require('../../res/status/relationship/icon-ff-relationships.png'),
    'F/M': require('../../res/status/relationship/icon-inter-relationships.png'),
    'M/M': require('../../res/status/relationship/icon-mm-relationships.png'),
    Multi: require('../../res/status/relationship/icon-multiple-relationships.png'),
    Gen: require('../../res/status/relationship/icon-none-relationships.png'),
    Other: require('../../res/status/relationship/icon-other-relationships.png'),
    None: require('../../res/status/relationship/icon-none-relationships.png'),
    default: require('../../res/status/relationship/icon-unknown-relationships.png'),
  },
  warningStatus: {
    'Creator Chose Not To Use Archive Warnings': require('../../res/status/warnings/icon-unspecified-warning.png'),
    WarningGiven: require('../../res/status/warnings/icon-has-warning.png'),
    'No Archive Warnings Apply': require('../../res/status/warnings/icon-unknown-warning.png'),
    ExternalWork: require('../../res/status/warnings/icon-web-warning.png'),
    default: require('../../res/status/warnings/icon-unknown-warning.png'),
  },
  isCompleted: {
    true: require('../../res/status/status/icon-done-status.png'),
    false: require('../../res/status/status/icon-unfinished-status.png'),
    null: require('../../res/status/status/icon-unknown-status.png'),
    undefined: require('../../res/status/status/icon-unknown-status.png'),
  },
};

const UpdateBookCard = ({ update, workDAO, theme, onPress }) => {
  const [work, setWork] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isInQueue, setIsInQueue] = useState(false);
  const [hasFailed, setHasFailed] = useState(false);
  const [isDownloadedFile, setIsDownloadedFile] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const isMounted = useRef(true);

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

  useEffect(() => {
    isMounted.current = true;
    const checkStatus = async () => {
      if (!update.workId || !update.chapterID) return;
      const queue = await getDownloadQueue();
      const failedJson = await AsyncStorage.getItem('failedDownloads');
      const failedList = failedJson ? JSON.parse(failedJson) : [];
      const exists = await isDownloaded(update.workId, update.chapterID);

      if (isMounted.current) {
        setIsInQueue(queue.some(q => String(q.chapterId) === String(update.chapterID)));
        setHasFailed(failedList.some(f => String(f.chapterId) === String(update.chapterID)));
        setIsDownloadedFile(exists);
      }
    };
    checkStatus();

    const qSub = DeviceEventEmitter.addListener('queue_updated', (q) => {
      if (isMounted.current) {
        setIsInQueue(q.some(item => String(item.chapterId) === String(update.chapterID)));
      }
    });

    const fSub = DeviceEventEmitter.addListener('failures_updated', (f) => {
      if (isMounted.current) {
        setHasFailed(f.some(item => String(item.chapterId) === String(update.chapterID)));
      }
    });

    const cSub = DeviceEventEmitter.addListener('download_completed', (data) => {
      if (isMounted.current && String(data.chapterId) === String(update.chapterID)) {
        setIsInQueue(false);
        setIsDownloadedFile(data.success);
        if (!data.success) setHasFailed(true);
      }
    });

    const rSub = DeviceEventEmitter.addListener('chapter_deleted', (data) => {
      if (isMounted.current && String(data.chapterId) === String(update.chapterID)) {
        setIsInQueue(false);
        setIsDownloadedFile(!data.success);
        if (!data.success) setHasFailed(true);
      }
    });

    return () => {
      isMounted.current = false;
      qSub.remove();
      fSub.remove();
      cSub.remove();
      rSub.remove();
    };
  }, [update.chapterID, update.workId])

  const handleDownloadPress = async () => {
    if (isInQueue) return;
    if (isDownloadedFile) {
      if (showDelete) {
        try {
          setIsInQueue(true);
          await deleteDownloaded(update.workId, update.chapterID);
          setIsDownloadedFile(false);
          setShowDelete(false);
        } catch (error) {
          Toast.show({ type: "error", text1: "Error deleting", text2: error.message });
        } finally {
          if (isMounted.current) setIsInQueue(false);
        }
      } else {
        setShowDelete(true);
        setTimeout(() => {
          if (isMounted.current) setShowDelete(false);
        }, 3000);
      }
      return;
    }

    if (hasFailed) {
      const failedJson = await AsyncStorage.getItem('failedDownloads');
      const failedList = failedJson ? JSON.parse(failedJson) : [];
      const newList = failedList.filter(f => String(f.chapterId) !== String(update.chapterID));
      await AsyncStorage.setItem('failedDownloads', JSON.stringify(newList));
      setHasFailed(false);
      DeviceEventEmitter.emit('failures_updated', newList);
    }

    setIsInQueue(true);
    await addToDownloadQueue({ workId: update.workId, chapterId: update.chapterID });
    processQueue();
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
    >
      <View style={styles.content}>
        <View
          style={[
            styles.imageGrid,
            {
              width: gridSize,
              height: gridSize,
              borderRadius: 4,
              overflow: 'hidden',
            },
          ]}
        >
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
                },
              ]}
            />
            <Image
              source={images[1]}
              style={[
                styles.statusImage,
                { width: imageSize, height: imageSize, marginBottom: -1 },
              ]}
            />
          </View>
          <View style={styles.imageRow}>
            <Image
              source={images[2]}
              style={[
                styles.statusImage,
                { width: imageSize, height: imageSize, marginRight: -1 },
              ]}
            />
            <Image
              source={images[3]}
              style={[
                styles.statusImage,
                { width: imageSize, height: imageSize },
              ]}
            />
          </View>
        </View>

        {/* Title and metadata */}
        <View style={styles.textContent}>
          <Text
            style={[styles.title, { color: theme.textColor }]}
            numberOfLines={2}
          >
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