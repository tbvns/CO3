import { Chapter } from '../models/chapter';
import { addToDownloadQueue } from '../../downloads/DownloadQueue';
import { getJsonSettings } from '../jsonSettings';

export class ChapterDAO {
  constructor(db) {
    this.db = db;
  }

  async add(chapter) {
    const { id, workId, number, name, date } = chapter;

    const [result] = await this.db.executeSql(
      'INSERT INTO chapters (id, workId, number, name, date) VALUES (?, ?, ?, ?, ?)',
      [id, workId, number, name, date],
    );

    return id;
  }
  async get(id) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM chapters WHERE id = ?',
      [id],
    );
    if (results.rows.length === 0) return null;
    return new Chapter(results.rows.item(0));
  }

  async getChaptersForWork(workId) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM chapters WHERE workId = ? ORDER BY number ASC',
      [workId],
    );
    return Array.from(
      { length: results.rows.length },
      (_, i) => new Chapter(results.rows.item(i)),
    );
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM chapters WHERE id = ?', [id]);
  }

  async syncChaptersForWork(workId, newChapters, downloadOnUpdate) {
    const currentChapters = await this.getChaptersForWork(workId);

    const currentMap = new Map();
    currentChapters.forEach(c => currentMap.set(c.id, c));

    const transactionOps = [];
    const newIds = new Set();

    for (const newChap of newChapters) {
      newIds.add(newChap.id);
      const existing = currentMap.get(newChap.id);
      const validDate = newChap.date || Date.now();

      if (existing) {
        transactionOps.push([
          'UPDATE chapters SET number = ?, name = ?, date = ? WHERE id = ?',
          [newChap.number, newChap.name, validDate, newChap.id],
        ]);
      } else {
        transactionOps.push([
          'INSERT INTO chapters (id, workId, number, name, date) VALUES (?, ?, ?, ?, ?)',
          [newChap.id, workId, newChap.number, newChap.name, validDate],
        ]);

        const jsonSetting = await getJsonSettings();
        if (jsonSetting.downloadOnUpdate && downloadOnUpdate) {
          await addToDownloadQueue({
            workId: newChap.workId,
            chapterId: newChap.id,
          });
        }
      }
    }

    for (const oldChap of currentChapters) {
      if (!newIds.has(oldChap.id)) {
        transactionOps.push([
          'DELETE FROM chapters WHERE id = ?',
          [oldChap.id],
        ]);
      }
    }

    if (transactionOps.length > 0) {
      await this.db.transaction(tx => {
        transactionOps.forEach(([query, params]) => {
          tx.executeSql(query, params);
        });
      });
    }
  }
}