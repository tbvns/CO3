import BackgroundFetch from "react-native-background-fetch";
import { fetchWorkFromWorkID } from './worksScreen/fetchWork';
import { database } from '../storage/Database';
import { WorkDAO } from '../storage/dao/WorkDAO';

import notifee, {
  AndroidImportance,
  AndroidStyle,
} from '@notifee/react-native';

export const setup = (intervalMinutes) => {
  BackgroundFetch.configure(
    {
      minimumFetchInterval: intervalMinutes,
      startOnBoot: true,
      stopOnTerminate: false,
      enableHeadless: true,
      requiredNetworkType: BackgroundFetch.NETWORK_TYPE_NONE,
      requiresDeviceIdle: false,
      requiresBatteryNotLow: false,
    },
    async () => {
      await run();
      BackgroundFetch.finish(BackgroundFetch.FETCH_RESULT_NEW_DATA);
    },
    (error) => {
      console.log("[BackgroundFetch] failed to start: ", error);
    }
  );

  BackgroundFetch.start();
  console.log("Background fetch set up with interval: " + intervalMinutes);
};

export const run = async (db) => {
  try {
    const channelId = await notifee.createChannel({
      id: 'updateWorks',
      name: 'Updating your library...',
      sound: undefined,
      vibration: false,
      importance: AndroidImportance.LOW,
    });

    let hasDb = true;
    if (!db) {
      db = await database.open();
      hasDb = false;
    }
    const workDAO = new WorkDAO(db);

    const toUpdate = (await workDAO.getAll()).filter((workf) => {
      return workf.chapterCount !== workf.currentChapter
    })

    const notificationId = await notifee.displayNotification({
      id: 'updateNotification',
      title: 'Updating your library...',
      body: 'Starting update...',
      android: {
        channelId,
        progress: {
          max: toUpdate.length,
          current: 0,
          indeterminate: false,
        },
        onlyAlertOnce: true,
      },
    });

    const randomDelay = (min, max) =>
      new Promise(resolve => {
        const delay = Math.random() * (max - min) + min;
        setTimeout(resolve, delay);
      });

    const updatedWork = []
    const errorWork = []

    for (let i = 0; i < toUpdate.length; i++) {
      const uwork = toUpdate[i];
      await notifee.displayNotification({
        id: notificationId,
        title: 'Updating your library...',
        body: `${(i / toUpdate.length) * 100}% : ${uwork.title}`,
        android: {
          channelId,
          progress: {
            max: toUpdate.length,
            current: i,
          },
          onlyAlertOnce: true,
        },
      });

      try {
        await randomDelay(500, 1500);
        const updatedWork = await updateWork(uwork.id, workDAO);
        if (updatedWork.currentChapter > uwork.currentChapter) {
          updatedWork.push(uwork);
        }
      } catch (error) {
        console.log(error);
        errorWork.push(uwork);
      }
    }

    await notifee.cancelNotification('updateNotification');

    if (updatedWork.length > 0) {
      await notifee.displayNotification({
        id: 'updateComplete',
        title: 'Update complete',
        body: `Found update for ${updatedWork.length} works.`,
        android: {
          channelId,
          style: {
            type: AndroidStyle.INBOX,
            lines: [`Found update for ${updatedWork.length} works:`, ...updatedWork.map((work) => work.title)],
          },
        },
      });
    }

    if (errorWork.length > 0) {
      await notifee.displayNotification({
        id: 'updateError',
        title: 'Error while retrieving works.',
        body: `${errorWork.length} works caused issues.`,
        android: {
          channelId,
          style: {
            type: AndroidStyle.INBOX,
            lines: [`${errorWork.length} works caused issues:`, ...errorWork.map((work) => work.title)],
          },
        },
      });
    }

    if (!hasDb) {
      await database.close();
    }
  } catch (error) {
    console.log("[BackgroundFetch] Task error:", error);
  }
};

export async function updateWork(workId, workDAO) {
  const work = await fetchWorkFromWorkID(workId);
  console.log(work);
  if (work) {
    workDAO.update(work);
  }
  return work;
}