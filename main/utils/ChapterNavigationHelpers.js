import { fetchChapter } from '../web/worksScreen/fetchChapter';

/**
 * Navigate to the next chapter
 * @param {Object} params - Navigation parameters
 * @param {string} params.workId - Current work ID
 * @param {string} params.currentChapterId - Current chapter ID
 * @param {Array} params.chapterList - Array of chapter objects with id and title
 * @param {number} params.currentChapterIndex - Current chapter index
 * @param {Object} params.currentTheme - Theme object
 * @param {Function} params.onChapterChange - Callback when chapter changes
 * @param {Object} params.historyDAO - History storage access object
 * @returns {Promise<Object|null>} - New chapter data or null if no next chapter
 */
export const navigateToNextChapter = async ({
                                              workId,
                                              currentChapterId,
                                              chapterList,
                                              currentChapterIndex,
                                              currentTheme,
                                              onChapterChange,
                                              historyDAO,
                                              settingsDAO
                                            }) => {
  try {
    // Check if there's a next chapter
    if (currentChapterIndex >= chapterList.length - 1) {
      console.log('Already at the last chapter');
      return null;
    }

    const nextChapterIndex = currentChapterIndex + 1;
    const nextChapter = chapterList[nextChapterIndex];

    if (!nextChapter) {
      console.log('Next chapter not found in chapter list');
      return null;
    }

    // Fetch the next chapter content
    const nextChapterContent = await fetchChapter(
      workId,
      nextChapter.id,
      currentTheme,
      settingsDAO
    );

    if (!nextChapterContent) {
      console.log('Failed to fetch next chapter content');
      return null;
    }

    // Record in history
    if (historyDAO) {
      await recordChapterRead(historyDAO, workId, nextChapter.id, nextChapter.title);
    }

    // Prepare chapter data
    const chapterData = {
      workId,
      chapterId: nextChapter.id,
      chapterTitle: nextChapter.title,
      chapterIndex: nextChapterIndex,
      htmlContent: nextChapterContent,
      hasNextChapter: nextChapterIndex < chapterList.length - 1,
      hasPreviousChapter: nextChapterIndex > 0,
    };

    // Call the change callback
    if (onChapterChange) {
      onChapterChange(chapterData);
    }

    return chapterData;
  } catch (error) {
    console.error('Error navigating to next chapter:', error);
    return null;
  }
};

/**
 * Navigate to the previous chapter
 * @param {Object} params - Navigation parameters
 * @param {string} params.workId - Current work ID
 * @param {string} params.currentChapterId - Current chapter ID
 * @param {Array} params.chapterList - Array of chapter objects with id and title
 * @param {number} params.currentChapterIndex - Current chapter index
 * @param {Object} params.currentTheme - Theme object
 * @param {Function} params.onChapterChange - Callback when chapter changes
 * @param {Object} params.historyDAO - History storage access object
 * @returns {Promise<Object|null>} - Previous chapter data or null if no previous chapter
 */
export const navigateToPreviousChapter = async ({
                                                  workId,
                                                  currentChapterId,
                                                  chapterList,
                                                  currentChapterIndex,
                                                  currentTheme,
                                                  onChapterChange,
                                                  historyDAO,
                                                  settingsDAO
                                                }) => {
  try {
    // Check if there's a previous chapter
    if (currentChapterIndex <= 0) {
      console.log('Already at the first chapter');
      return null;
    }

    const previousChapterIndex = currentChapterIndex - 1;
    const previousChapter = chapterList[previousChapterIndex];

    if (!previousChapter) {
      console.log('Previous chapter not found in chapter list');
      return null;
    }

    // Fetch the previous chapter content
    const previousChapterContent = await fetchChapter(
      workId,
      previousChapter.id,
      currentTheme,
      settingsDAO
    );

    if (!previousChapterContent) {
      console.log('Failed to fetch previous chapter content');
      return null;
    }

    // Record in history
    if (historyDAO) {
      await recordChapterRead(historyDAO, workId, previousChapter.id, previousChapter.title);
    }

    // Prepare chapter data
    const chapterData = {
      workId,
      chapterId: previousChapter.id,
      chapterTitle: previousChapter.title,
      chapterIndex: previousChapterIndex,
      htmlContent: previousChapterContent,
      hasNextChapter: previousChapterIndex < chapterList.length - 1,
      hasPreviousChapter: previousChapterIndex > 0,
    };

    // Call the change callback
    if (onChapterChange) {
      onChapterChange(chapterData);
    }

    return chapterData;
  } catch (error) {
    console.error('Error navigating to previous chapter:', error);
    return null;
  }
};

/**
 * Update reading progress for the current chapter
 * @param {Object} params - Progress parameters
 * @param {string} params.workId - Current work ID
 * @param {string} params.chapterId - Current chapter ID
 * @param {number} params.progress - Progress percentage (0-1)
 * @param {Object} params.historyDAO - History storage access object
 * @param {Function} params.onProgressUpdate - Optional callback for progress updates
 */
export const updateReadingProgress = async ({
                                              workId,
                                              chapterId,
                                              progress,
                                              historyDAO,
                                              onProgressUpdate
                                            }) => {
  try {
    // Update progress in storage
    if (historyDAO && historyDAO.updateChapterProgress) {
      await historyDAO.updateChapterProgress(workId, chapterId, progress);
    }

    // Call progress Update callback
    if (onProgressUpdate) {
      onProgressUpdate({
        workId,
        chapterId,
        progress,
        timestamp: Date.now(),
      });
    }

    // Auto-save progress every 10% or at completion
    const progressPercentage = Math.round(progress * 100);
    if (progressPercentage % 10 === 0 || progress >= 1) {
      console.log(`Progress saved: ${progressPercentage}% for chapter ${chapterId}`);
    }
  } catch (error) {
    console.error('Error updating reading progress:', error);
  }
};

/**
 * Record a chapter as read in the history
 * @param {Object} historyDAO - History storage access object
 * @param {string} workId - Work ID
 * @param {string} chapterId - Chapter ID
 * @param {string} chapterTitle - Chapter title
 */
const recordChapterRead = async (historyDAO, workId, chapterId, chapterTitle) => {
  try {
    if (!historyDAO || !historyDAO.addHistoryEntry) {
      console.log('History DAO not available or method not found');
      return;
    }

    const historyEntry = {
      workId,
      chapterId,
      chapterTitle,
      timestamp: Date.now(),
      progress: 0, // Starting progress for new chapter
    };

    await historyDAO.addHistoryEntry(historyEntry);
    console.log(`Chapter ${chapterId} recorded in history`);
  } catch (error) {
    console.error('Error recording chapter in history:', error);
  }
};

/**
 * Get chapter navigation info
 * @param {Array} chapterList - Array of chapter objects
 * @param {number} currentIndex - Current chapter index
 * @returns {Object} - Navigation info
 */
export const getChapterNavigationInfo = (chapterList, currentIndex) => {
  return {
    hasNextChapter: currentIndex < chapterList.length - 1,
    hasPreviousChapter: currentIndex > 0,
    nextChapter: currentIndex < chapterList.length - 1 ? chapterList[currentIndex + 1] : null,
    previousChapter: currentIndex > 0 ? chapterList[currentIndex - 1] : null,
    totalChapters: chapterList.length,
    currentChapterNumber: currentIndex + 1,
  };
};

/**
 * Initialize chapter reader with all necessary data
 * @param {Object} params - Initialization parameters
 * @param {string} params.workId - Work ID
 * @param {string} params.chapterId - Initial chapter ID
 * @param {string} params.workTitle - Work title
 * @param {Array} params.chapterList - List of all chapters
 * @param {Object} params.currentTheme - Theme object
 * @param {Object} params.historyDAO - History storage access object
 * @returns {Promise<Object>} - Initial chapter data
 */
export const initializeChapterReader = async ({
                                                workId,
                                                chapterId,
                                                workTitle,
                                                chapterList,
                                                currentTheme,
                                                historyDAO,
                                                settingsDAO
                                              }) => {
  try {
    // Find current chapter index
    const currentChapterIndex = chapterList.findIndex(chapter => chapter.id === chapterId);

    if (currentChapterIndex === -1) {
      throw new Error('Chapter not found in chapter list');
    }

    const currentChapter = chapterList[currentChapterIndex];

    // Fetch chapter content
    const htmlContent = await fetchChapter(workId, chapterId, currentTheme, settingsDAO);

    if (!htmlContent) {
      throw new Error('Failed to fetch chapter content');
    }

    // Get navigation info
    const navigationInfo = getChapterNavigationInfo(chapterList, currentChapterIndex);

    // Record in history
    if (historyDAO) {
      await recordChapterRead(historyDAO, workId, chapterId, currentChapter.title);
    }

    return {
      workId,
      workTitle,
      chapterId,
      chapterTitle: currentChapter.title,
      chapterIndex: currentChapterIndex,
      htmlContent,
      chapterList,
      ...navigationInfo,
    };
  } catch (error) {
    console.error('Error initializing chapter reader:', error);
    throw error;
  }
};

/**
 * Save reading session data
 * @param {Object} params - Session data
 * @param {string} params.workId - Work ID
 * @param {string} params.chapterId - Chapter ID
 * @param {number} params.progress - Reading progress
 * @param {number} params.readingTime - Time spent reading (in seconds)
 * @param {Object} params.historyDAO - History storage access object
 */
export const saveReadingSession = async ({
                                           workId,
                                           chapterId,
                                           progress,
                                           readingTime,
                                           historyDAO
                                         }) => {
  try {
    if (!historyDAO) return;

    const sessionData = {
      workId,
      chapterId,
      progress,
      readingTime,
      timestamp: Date.now(),
    };

    console.log('Reading session saved:', sessionData);
  } catch (error) {
    console.error('Error saving reading session:', error);
  }
};
