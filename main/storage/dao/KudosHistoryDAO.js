import { KudoHistory } from '../models/kudoHistory';

export class KudoHistoryDAO {
  constructor(db) {
    this.db = db;
  }

  /**
   * Adds a new kudo history entry to the storage.
   * @param {object} kudoHistoryEntry - The kudo history entry to add.
   */
  async add(kudoHistoryEntry) {
    const { workId, date } = kudoHistoryEntry;
    await this.db.executeSql(
      'INSERT OR REPLACE INTO kudo_history (workId, date) VALUES (?, ?)',
      [workId, date]
    );
  }

  /**
   * Retrieves a specific kudo history entry by workId.
   * @param {number} workId - The work ID to retrieve.
   * @returns {Promise<KudoHistory|null>} The kudo history entry or null if none exists.
   */
  async get(workId) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM kudo_history WHERE workId = ?',
      [workId]
    );
    if (results.rows.length === 0) return null;
    return new KudoHistory(results.rows.item(0));
  }

  /**
   * Retrieves the most recent kudo history entry from the storage.
   * @returns {Promise<KudoHistory|null>} The latest kudo history entry or null if none exists.
   */
  async getLatestEntry() {
    const [results] = await this.db.executeSql(
      'SELECT * FROM kudo_history ORDER BY date DESC LIMIT 1'
    );
    if (results.rows.length > 0) {
      return new KudoHistory(results.rows.item(0));
    }
    return null;
  }

  /**
   * Retrieves all kudo history entries.
   * @returns {Promise<KudoHistory[]>} Array of all kudo history entries.
   */
  async getAll() {
    const [results] = await this.db.executeSql(
      'SELECT * FROM kudo_history ORDER BY date DESC'
    );
    return Array.from(
      { length: results.rows.length },
      (_, i) => new KudoHistory(results.rows.item(i))
    );
  }

  /**
   * Retrieves kudo history entries within a date range.
   * @param {number} startDate - The start date timestamp.
   * @param {number} endDate - The end date timestamp.
   * @param {number} limit - The maximum number of results.
   * @param {number} offset - The offset for pagination.
   * @returns {Promise<KudoHistory[]>} Array of kudo history entries within the date range.
   */
  async getHistoryByDateRange(startDate, endDate, limit, offset) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM kudo_history WHERE date BETWEEN ? AND ? ORDER BY date DESC LIMIT ? OFFSET ?',
      [startDate, endDate, limit, offset]
    );
    return Array.from(
      { length: results.rows.length },
      (_, i) => new KudoHistory(results.rows.item(i))
    );
  }

  /**
   * Counts kudo history entries within a date range.
   * @param {number} startDate - The start date timestamp.
   * @param {number} endDate - The end date timestamp.
   * @returns {Promise<number>} The count of kudo history entries within the date range.
   */
  async getHistoryCountByDateRange(startDate, endDate) {
    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM kudo_history WHERE date BETWEEN ? AND ?',
      [startDate, endDate]
    );
    return results.rows.item(0).count;
  }

  /**
   * Retrieves paginated kudo history entries.
   * @param {number} limit - The maximum number of results per page.
   * @param {number} offset - The offset for pagination.
   * @returns {Promise<KudoHistory[]>} Array of paginated kudo history entries.
   */
  async getPaginatedHistory(limit, offset) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM kudo_history ORDER BY date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );
    return Array.from(
      { length: results.rows.length },
      (_, i) => new KudoHistory(results.rows.item(i))
    );
  }

  /**
   * Retrieves the total count of kudo history entries.
   * @returns {Promise<number>} The total count of kudo history entries.
   */
  async getTotalHistoryCount() {
    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM kudo_history'
    );
    return results.rows.item(0).count;
  }

  /**
   * Retrieves all distinct kudo history dates.
   * @returns {Promise<number[]>} Array of distinct date timestamps.
   */
  async getReadingDates() {
    const [results] = await this.db.executeSql(
      'SELECT DISTINCT date FROM kudo_history ORDER BY date DESC'
    );
    return Array.from(
      { length: results.rows.length },
      (_, i) => results.rows.item(i).date
    );
  }

  /**
   * Deletes a kudo history entry by workId.
   * @param {number} workId - The work ID of the entry to delete.
   */
  async delete(workId) {
    await this.db.executeSql(
      'DELETE FROM kudo_history WHERE workId = ?',
      [workId]
    );
  }

  /**
   * Deletes all kudo history entries.
   */
  async deleteAll() {
    await this.db.executeSql('DELETE FROM kudo_history');
  }
}