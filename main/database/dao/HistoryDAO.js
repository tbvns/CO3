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

  async delete(id) {
    await this.db.executeSql('DELETE FROM history WHERE id = ?', [id]);
  }

  async deleteAll() {
    await this.db.executeSql('DELETE FROM history');
  }
}
