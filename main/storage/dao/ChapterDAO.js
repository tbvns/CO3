import { Chapter } from '../models/chapter';

export class ChapterDAO {
  constructor(db) {
    this.db = db;
  }

  async add(chapter) {
    const { workId, number, name, date, progress } = chapter;
    const [result] = await this.db.executeSql(
      'INSERT INTO chapters (workId, number, name, date, progress) VALUES (?, ?, ?, ?, ?)',
      [workId, number, name, date, progress]
    );
    return result.insertId;
  }

  async get(id) {
    const [results] = await this.db.executeSql('SELECT * FROM chapters WHERE id = ?', [id]);
    if (results.rows.length === 0) return null;
    return new Chapter(results.rows.item(0));
  }

  async getChaptersForWork(workId) {
    const [results] = await this.db.executeSql('SELECT * FROM chapters WHERE workId = ? ORDER BY number ASC', [workId]);
    return Array.from({ length: results.rows.length }, (_, i) => new Chapter(results.rows.item(i)));
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM chapters WHERE id = ?', [id]);
  }
}
