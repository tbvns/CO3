export class ProgressDAO {
  constructor(db) {
    this.db = db;
  }

  /**
   * Set progress for a specific chapter in a work
   * @param {string} workId - The work ID
   * @param {number} chapterID - The chapter ID (corresponds to chapters.id)
   * @param {number} progress - Progress as a float (0.0 to 1.0)
   */
  async set(workId, chapterID, progress) {
    const validProgress = Math.max(0.0, Math.min(1.0, progress));

    console.log(`Setting progress for workId: ${workId}, chapterID: ${chapterID}, progress: ${validProgress}`);

    await this.db.executeSql(
      'INSERT OR REPLACE INTO progress_entries (workId, chapterID, progress) VALUES (?, ?, ?)',
      [workId, chapterID, validProgress]
    );
  }

  /**
   * Get progress for a specific chapter in a work
   * @param {string} workId - The work ID
   * @param {number} chapterID - The chapter ID (corresponds to chapters.id)
   * @returns {Promise<number>} Progress as a float (0.0 to 1.0)
   */
  async get(workId, chapterID) {
    const [results] = await this.db.executeSql(
      'SELECT progress FROM progress_entries WHERE chapterID = ? AND workId = ?',
      [chapterID, workId]
    );

    if (results.rows.length === 0) {
      return 0.0; // Return 0.0 if no progress entry found
    }

    return results.rows.item(0).progress || 0.0;
  }

  /**
   * Get all progress for chapters in a work
   * @param {string} workId - The work ID
   * @returns {Promise<Array>} Array of objects with chapterID and progress
   */
  async getProgressList(workId) {
    const [results] = await this.db.executeSql(
      'SELECT chapterID, progress FROM progress_entries WHERE workId = ? ORDER BY chapterID ASC',
      [workId]
    );

    return Array.from({ length: results.rows.length }, (_, i) => {
      const row = results.rows.item(i);
      return {
        chapterID: row.chapterID,
        progress: row.progress || 0.0
      };
    });
  }

  /**
   * Set progress for multiple chapters at once
   * @param {string} workId - The work ID
   * @param {Array} progressList - Array of {chapterID, progress} objects
   */
  async setMultiple(workId, progressList) {
    const transaction = [];

    for (const item of progressList) {
      const validProgress = Math.max(0.0, Math.min(1.0, item.progress));
      transaction.push([
        'INSERT OR REPLACE INTO progress_entries (workId, chapterID, progress) VALUES (?, ?, ?)',
        [workId, item.chapterID, validProgress]
      ]);
    }

    await this.db.transaction(tx => {
      transaction.forEach(([query, params]) => {
        tx.executeSql(query, params);
      });
    });
  }

  /**
   * Reset progress for all chapters in a work by deleting their entries.
   * This means their progress will default to 0.0 when fetched.
   * @param {string} workId - The work ID
   */
  async resetProgress(workId) {
    await this.db.executeSql(
      'DELETE FROM progress_entries WHERE workId = ?',
      [workId]
    );
  }

  /**
   * Get overall progress for a work (average of all chapters with progress entries)
   * @param {string} workId - The work ID
   * @returns {Promise<number>} Overall progress as a float (0.0 to 1.0)
   */
  async getOverallProgress(workId) {
    const [results] = await this.db.executeSql(
      'SELECT AVG(progress) as averageProgress FROM progress_entries WHERE workId = ?',
      [workId]
    );

    if (results.rows.length === 0) {
      return 0.0;
    }

    return results.rows.item(0).averageProgress || 0.0;
  }

  /**
   * Get chapters with specific progress status, joining with chapters table for metadata.
   * Chapters without an entry in progress_entries will be treated as 0.0 progress.
   * @param {string} workId - The work ID
   * @param {number} minProgress - Minimum progress (default: 0.0)
   * @param {number} maxProgress - Maximum progress (default: 1.0)
   * @returns {Promise<Array>} Array of chapter objects matching criteria
   */
  async getChaptersByProgress(workId, minProgress = 0.0, maxProgress = 1.0) {
    const [results] = await this.db.executeSql(
      `SELECT 
         C.id as chapterID, 
         C.number, 
         C.name, 
         COALESCE(P.progress, 0.0) as progress 
       FROM chapters C 
       LEFT JOIN progress_entries P ON C.id = P.chapterID AND C.workId = P.workId
       WHERE C.workId = ? AND COALESCE(P.progress, 0.0) >= ? AND COALESCE(P.progress, 0.0) <= ? 
       ORDER BY C.number ASC`,
      [workId, minProgress, maxProgress]
    );

    return Array.from({ length: results.rows.length }, (_, i) => {
      const row = results.rows.item(i);
      return {
        chapterID: row.chapterID,
        number: row.number,
        name: row.name,
        progress: row.progress || 0.0
      };
    });
  }
}
