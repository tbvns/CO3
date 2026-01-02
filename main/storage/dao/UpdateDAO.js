import { Update } from '../models/update';

export class UpdateDAO {
  constructor(db) {
    this.db = db;
  }

  async add(updateEntry) {
    const { workId, chapterNumber, chapterID, date } = updateEntry;

    if (!workId) {
      throw new Error('Work ID is required');
    }

    const existing = await this.getLatestForWork(workId);
    if (existing && existing.chapterNumber === chapterNumber) {
      return;
    }

    await this.db.executeSql(
      `INSERT INTO updates (workId, chapterNumber, chapterID, date)
       VALUES (?, ?, ?, ?)`,
      [workId, chapterNumber, chapterID, date || Date.now()]
    );
  }
  async getLatestForWork(workId) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM updates WHERE workId = ? ORDER BY date DESC LIMIT 1',
      [workId]
    );

    if (results.rows.length === 0) return null;
    return new Update(results.rows.item(0));
  }

  async getAllForWork(workId) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM updates WHERE workId = ? ORDER BY date DESC',
      [workId]
    );

    return Array.from({ length: results.rows.length }, (_, i) =>
      new Update(results.rows.item(i))
    );
  }

  async getAll() {
    const [results] = await this.db.executeSql(
      'SELECT * FROM updates ORDER BY date DESC'
    );

    return Array.from({ length: results.rows.length }, (_, i) =>
      new Update(results.rows.item(i))
    );
  }

  async getPaginatedUpdates(limit, offset) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM updates ORDER BY date DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    return Array.from({ length: results.rows.length }, (_, i) =>
      new Update(results.rows.item(i))
    );
  }

  async getTotalCount() {
    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM updates'
    );

    return results.rows.item(0).count;
  }

  async getCountForWork(workId) {
    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM updates WHERE workId = ?',
      [workId]
    );

    return results.rows.item(0).count;
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM updates WHERE id = ?', [id]);
  }

  async clearForWork(workId) {
    await this.db.executeSql('DELETE FROM updates WHERE workId = ?', [workId]);
  }

  async clearAll() {
    await this.db.executeSql('DELETE FROM updates');
  }
}