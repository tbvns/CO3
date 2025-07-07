import { KudoHistory } from '../models/kudoHistory';

export class KudoHistoryDAO {
  constructor(db) {
    this.db = db;
  }

  async add(kudoHistoryEntry) {
    const { workId, date } = kudoHistoryEntry;
    await this.db.executeSql(
      'INSERT OR REPLACE INTO kudo_history (workId, date) VALUES (?, ?)',
      [workId, date]
    );
  }

  async get(workId) {
    const [results] = await this.db.executeSql('SELECT * FROM kudo_history WHERE workId = ?', [workId]);
    if (results.rows.length === 0) return null;
    return new KudoHistory(results.rows.item(0));
  }

  async delete(workId) {
    await this.db.executeSql('DELETE FROM kudo_history WHERE workId = ?', [workId]);
  }
}
