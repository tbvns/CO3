import { History } from '../models/history';

export class HistoryDAO {
  constructor(db) {
    this.db = db;
  }

  async add(historyEntry) {
    const { workId, date, chapter, chapterEnd } = historyEntry;
    await this.db.executeSql(
        'INSERT INTO history (workId, date, chapter, chapterEnd) VALUES (?, ?, ?, ?)',
        [workId, date, chapter, chapterEnd]
    );
  }

  async getForWork(workId) {
    const [results] = await this.db.executeSql('SELECT * FROM history WHERE workId = ? ORDER BY date DESC', [workId]);
    return Array.from({ length: results.rows.length }, (_, i) => new History(results.rows.item(i)));
  }

  async getAll() {
    const [results] = await this.db.executeSql('SELECT * FROM history ORDER BY date DESC');
    return Array.from({ length: results.rows.length }, (_, i) => new History(results.rows.item(i)));
  }

  async getHistoryByDateRange(startDate, endDate, limit, offset) {
    const [results] = await this.db.executeSql(
        'SELECT * FROM history WHERE date BETWEEN ? AND ? ORDER BY date DESC LIMIT ? OFFSET ?',
        [startDate, endDate, limit, offset]
    );
    return Array.from({ length: results.rows.length }, (_, i) => new History(results.rows.item(i)));
  }

  async getHistoryCountByDateRange(startDate, endDate) {
    const [results] = await this.db.executeSql(
        'SELECT COUNT(*) as count FROM history WHERE date BETWEEN ? AND ?',
        [startDate, endDate]
    );
    return results.rows.item(0).count;
  }

  async getPaginatedHistory(limit, offset) {
    const [results] = await this.db.executeSql(
        'SELECT * FROM history ORDER BY date DESC LIMIT ? OFFSET ?',
        [limit, offset]
    );
    return Array.from({ length: results.rows.length }, (_, i) => new History(results.rows.item(i)));
  }

  async getTotalHistoryCount() {
    const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM history');
    return results.rows.item(0).count;
  }

  async getReadingDates() {
    const [results] = await this.db.executeSql('SELECT DISTINCT date FROM history ORDER BY date DESC');
    return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i).date);
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM history WHERE id = ?', [id]);
  }

  async deleteAll() {
    await this.db.executeSql('DELETE FROM history');
  }
}