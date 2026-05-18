import notifee, { AndroidImportance } from 'react-native-notify-kit';
import { popNextDownload, peekNextDownload, getDownloadQueue } from './DownloadQueue';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DeviceEventEmitter } from 'react-native';
import { downloadChapter } from './Downloader';

const FAILED_LIST_KEY = 'failedDownloads';
const CHANNEL_ID = 'download_channel';
const NOTIFICATION_ID = 'download_progress';

let isProcessing = false;

// Helper function for the delay
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadTask(item) {
  try {
    const minDelay = 1500;
    const maxDelay = 4000;
    const randomDelay = Math.floor(Math.random() * (maxDelay - minDelay + 1) + minDelay);

    console.log(`Waiting ${randomDelay}ms before downloading: ${item.chapterId}`);

    await sleep(randomDelay);

    console.log(`Starting download for: ${item.chapterId}`);

    await downloadChapter(item.workId, item.chapterId);

    DeviceEventEmitter.emit('download_completed', {
      chapterId: String(item.chapterId),
      success: true,
    });
    return true;
  } catch (e) {
    console.error(`Error downloading ${item.chapterId}:`, e);

    DeviceEventEmitter.emit('download_completed', {
      chapterId: String(item.chapterId),
      success: false,
    });
    throw e;
  }
}

export async function processQueue() {
  if (isProcessing) return;
  isProcessing = true;

  let failedCount = 0;
  let successCount = 0;

  try {
    let queue = await getDownloadQueue();
    let initialTotal = queue.length;
    let processed = 0;

    if (initialTotal === 0) {
      isProcessing = false;
      return;
    }

    await notifee.createChannel({
      id: CHANNEL_ID,
      name: 'Downloads',
      importance: AndroidImportance.LOW,
    });

    await notifee.registerForegroundService(() => new Promise(() => {}));

    while (true) {
      queue = await getDownloadQueue();
      if (queue.length === 0) break;

      const item = queue[0];

      const currentTotal = processed + queue.length;
      if (currentTotal > initialTotal) initialTotal = currentTotal;

      await notifee.displayNotification({
        id: NOTIFICATION_ID,
        title: 'Downloading Chapters',
        body: `Processing item ${processed + 1} of ${initialTotal}`,
        android: {
          channelId: CHANNEL_ID,
          asForegroundService: true,
          ongoing: true,
          onlyAlertOnce: true,
          progress: {
            max: initialTotal,
            current: processed,
            indeterminate: false
          },
        },
      });

      try {
        await downloadTask(item);
        successCount++;
      } catch (error) {
        console.error(`Download failed:`, error);
        failedCount++;
        await handleDownloadFailure(item, error.message);
      } finally {
        await popNextDownload();
        processed++;
      }
    }

  } catch (error) {
    console.error("Manager Critical Error:", error);
  } finally {
    isProcessing = false;

    await notifee.stopForegroundService();
    await notifee.cancelNotification(NOTIFICATION_ID);

    if (failedCount > 0 || successCount > 0) {
      await notifee.displayNotification({
        id: 'download_summary', // Different ID so it doesn't get cancelled
        title: failedCount > 0 ? 'Download Finished with Errors' : 'Downloads Complete',
        body: `${successCount} succeeded, ${failedCount} failed.`,
        android: { channelId: CHANNEL_ID },
      });
    }
  }
}

async function handleDownloadFailure(item, reason) {
  try {
    const failedJson = await AsyncStorage.getItem(FAILED_LIST_KEY);
    const failedList = failedJson ? JSON.parse(failedJson) : [];

    failedList.push({ ...item, failedAt: Date.now(), reason });
    await AsyncStorage.setItem(FAILED_LIST_KEY, JSON.stringify(failedList));

    DeviceEventEmitter.emit('failures_updated', failedList);
  } catch (e) {
    console.warn("Storage Error", e);
  }
}
