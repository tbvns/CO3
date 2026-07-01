import { NativeModules, AppRegistry, Platform } from 'react-native';
import { fetchWorkFromWorkID } from './worksScreen/fetchWork';
import { database } from '../storage/DatabaseManager';
import { WorkDAO } from '../storage/dao/WorkDAO';
import { UpdateDAO } from '../storage/dao/UpdateDAO';
import { Update } from '../storage/models/update';
import notifee, {
  AndroidImportance,
  AndroidStyle,
  EventType,
} from 'react-native-notify-kit';
import { getJsonSettings } from '../storage/jsonSettings';
import { ChapterDAO } from '../storage/dao/ChapterDAO';

const { LibraryScheduler } = NativeModules;

if (Platform.OS === 'android') {
  AppRegistry.registerHeadlessTask('LibraryUpdate', () => async () => {
    await run();
  });
}

const getMergedIconName = work => {
  let r = 'nr';
  switch (work.rating) {
    case 'General Audiences':
      r = 'gen';
      break;
    case 'Teen And Up Audiences':
      r = 'teen';
      break;
    case 'Mature':
      r = 'mat';
      break;
    case 'Explicit':
      r = 'exp';
      break;
    case 'Not Rated':
      r = 'nr';
      break;
  }

  let c = 'gen';
  const cat = work.category || '';
  if (cat.split(' ').length > 1 && cat !== 'No category') c = 'multi';
  else if (cat === 'F/F') c = 'ff';
  else if (cat === 'F/M') c = 'fm';
  else if (cat === 'M/M') c = 'mm';
  else if (cat === 'Multi') c = 'multi';
  else if (cat === 'Other') c = 'other';
  else if (cat === 'Gen') c = 'gen';

  let w = 'none';
  const warn = work.warnings || '';
  if (work.warningStatus === 'Yes' || warn.includes('WarningGiven')) w = 'warn';
  else if (warn.includes('Creator Chose')) w = 'cntua';
  else if (warn.includes('No Archive')) w = 'none';
  else if (warn.includes('External')) w = 'ext';

  const isComplete =
    work.isCompleted ||
    (work.chapterCount > 0 && work.chapterCount === work.currentChapter);
  const s = isComplete ? 'comp' : 'wip';

  return `ic_${r}_${c}_${w}_${s}`.toLowerCase();
};

const getEmojiStatus = work => {
  let text = '';
  if (work.rating === 'Explicit') text += '🔞 ';
  else if (work.rating === 'Mature') text += '🛑 ';
  if (work.warningStatus === 'Yes') text += '⚠️ ';
  if (work.category && work.category !== 'No category') {
    text += `[${work.category}] `;
  }
  return text;
};

export const setup = async intervalMinutes => {
  if (!LibraryScheduler) {
    console.warn(
      '[LibraryScheduler] Native module not found — background updates disabled.',
    );
    return;
  }

  if (intervalMinutes === -1) {
    cancel();
    return;
  }

  const settings = await getJsonSettings();
  const restrictionArray = settings.updateRestriction;
  let networkType = 'NONE';

  if (restrictionArray && restrictionArray.length > 0) {
    const first = restrictionArray[0];
    switch (first) {
      case 0:
        networkType = 'NONE';
        break;
      case 1:
        networkType = 'UNMETERED';
        break;
      // case 2:
      //   networkType = 'UNMETERED';
      //   break;
      case 3:
        networkType = 'NOT_ROAMING';
        break;
    }
  }

  LibraryScheduler.schedule(intervalMinutes, networkType);
  console.log(
    `[LibraryScheduler] Scheduled every ${intervalMinutes} min, network: ${networkType}`,
  );
};

export const cancel = () => {
  if (!LibraryScheduler) return;
  LibraryScheduler.cancel();
  console.log('[LibraryScheduler] Cancelled.');
};

export const run = async () => {
  const settings = await getJsonSettings();
  const useCompactNotification = settings.compactNotifications;

  try {
    const channelId = await notifee.createChannel({
      id: 'updateWorks',
      name: 'Library Updates',
      importance: AndroidImportance.DEFAULT,
    });

    const progressChannelId = await notifee.createChannel({
      id: 'updateProgress',
      name: 'Update Progress',
      importance: AndroidImportance.LOW,
    });

    const db = await database.open();
    const workDAO = new WorkDAO(db);
    const updateDAO = new UpdateDAO(db);
    const chapterDAO = new ChapterDAO(db);

    const toUpdate = (await workDAO.getAll()).filter(work => {
      return work.chapterCount !== work.currentChapter;
    });

    await notifee.displayNotification({
      id: 'scanning_progress',
      title: 'Checking for updates...',
      body: `Scanning ${toUpdate.length} works...`,
      android: {
        channelId: progressChannelId,
        progress: { max: toUpdate.length, current: 0, indeterminate: false },
        onlyAlertOnce: true,
        ongoing: true,
      },
    });

    const randomDelay = (min, max) =>
      new Promise(resolve =>
        setTimeout(resolve, Math.random() * (max - min) + min),
      );

    const updatedWorks = [];
    const errorWork = [];

    for (let i = 0; i < toUpdate.length; i++) {
      const uwork = toUpdate[i];
      await notifee.displayNotification({
        id: 'scanning_progress',
        title: 'Updating your library...',
        body: `${Math.floor((i / toUpdate.length) * 100)}% : ${uwork.title}`,
        android: {
          channelId: progressChannelId,
          progress: { max: toUpdate.length, current: i },
          onlyAlertOnce: true,
          ongoing: true,
        },
      });

      try {
        await randomDelay(500, 1500);
        const updatedWork = await updateWork(uwork.id, workDAO, chapterDAO);

        if (updatedWork && updatedWork.currentChapter > uwork.currentChapter) {
          const newChapterNumbers = [];

          for (
            let chNum = uwork.currentChapter + 1;
            chNum <= updatedWork.currentChapter;
            chNum++
          ) {
            const newChapter = updatedWork.chapters.find(
              ch => ch.number === chNum,
            );
            newChapterNumbers.push(chNum);

            const update = new Update({
              workId: updatedWork.id,
              chapterNumber: chNum,
              chapterID: newChapter
                ? String(newChapter.id)
                : `${updatedWork.id}_${chNum}`,
              date: Date.now(),
            });
            await updateDAO.add(update);
          }

          updatedWorks.push(updatedWork);

          if (!useCompactNotification && newChapterNumbers.length > 0) {
            const iconName = getMergedIconName(updatedWork);
            const chaptersStr = newChapterNumbers.join(', ');
            const firstChapterNumber = newChapterNumbers[0];

            await notifee.displayNotification({
              id: `work_${updatedWork.id}`,
              title: updatedWork.title,
              body: `Chapter ${chaptersStr}`,
              data: {
                action: 'OPEN_WORK',
                workId: updatedWork.id,
                chapterNumber: firstChapterNumber,
              },
              android: {
                channelId,
                groupId: 'library_updates',
                largeIcon: iconName,
                pressAction: {
                  id: 'default',
                  launchActivity: 'default',
                },
              },
            });
          }
        }
      } catch (error) {
        console.log(error);
        errorWork.push(uwork);
      }
    }

    await notifee.cancelNotification('scanning_progress');

    if (updatedWorks.length > 0) {
      if (useCompactNotification) {
        await notifee.displayNotification({
          id: 'updateComplete',
          title: 'Update complete',
          body: `Found updates for ${updatedWorks.length} works.`,
          android: {
            channelId,
            pressAction: { id: 'default' },
            style: {
              type: AndroidStyle.INBOX,
              lines: updatedWorks.map(w => w.title),
            },
          },
        });
      } else {
        await notifee.displayNotification({
          id: 'group_summary',
          title: 'Library Updates',
          subtitle: `${updatedWorks.length} works updated`,
          android: {
            channelId,
            groupSummary: true,
            groupId: 'library_updates',
            autoCancel: true,
            pressAction: { id: 'default' },
          },
        });
      }
    }

    if (errorWork.length > 0) {
      await notifee.displayNotification({
        id: 'updateError',
        title: 'Update Issues',
        body: `Failed to update ${errorWork.length} works.`,
        android: {
          channelId,
          style: {
            type: AndroidStyle.INBOX,
            lines: errorWork.map(w => w.title),
          },
        },
      });
    }
  } catch (error) {
    console.log('[LibraryScheduler] Task error:', error);
  }
};

export async function updateWork(workId, workDAO, chapterDAO) {
  const work = await fetchWorkFromWorkID(
    workId,
    workDAO,
    chapterDAO,
    true,
    true,
  );
  if (work) {
    await workDAO.update(work);
  }
  return work;
}

export const setupNotificationListeners = (
  setActiveScreen,
  setScreens,
  openWorkDetails,
) => {
  const handlePress = async detail => {
    const { notification } = detail;
    const data = notification?.data;

    if (data?.action === 'OPEN_WORK' && data?.workId) {
      console.log(
        `Opening Work: ${data.workId}, Chapter Number: ${data.chapterNumber}`,
      );
      setActiveScreen('update');
      if (openWorkDetails) {
        openWorkDetails(data.workId, data.chapterNumber);
      }
    } else if (
      notification?.id === 'updateComplete' ||
      notification?.id === 'group_summary'
    ) {
      setActiveScreen('update');
    }
  };

  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) handlePress(detail);
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) handlePress(detail);
  });
};
