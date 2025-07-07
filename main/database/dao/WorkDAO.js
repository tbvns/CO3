import { Work } from '../models/work';

export class WorkDAO {
  constructor(db) {
    this.db = db;
  }

  async add(work) {
    const { title, author, kudos, hits, language, updated, bookmarks, description, currentChapter, chapterCount, tags, warnings } = work;
    const [result] = await this.db.executeSql(
      `INSERT INTO works (title, author, kudos, hits, language, updated, bookmarks, description, currentChapter, chapterCount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, author, kudos, hits, language, updated, bookmarks, description, currentChapter, chapterCount]
    );
    const workId = result.insertId;
    await this._syncTags(workId, tags);
    await this._syncWarnings(workId, warnings);
    return workId;
  }

  async get(id) {
    const [results] = await this.db.executeSql('SELECT * FROM works WHERE id = ?', [id]);
    if (results.rows.length === 0) return null;
    const workData = results.rows.item(0);
    workData.tags = await this.getTagsForWork(id);
    workData.warnings = await this.getWarningsForWork(id);
    // Note: Chapters are handled by ChapterDAO
    return new Work(workData);
  }

  async getAll() {
    const [results] = await this.db.executeSql('SELECT * FROM works');
    const works = [];
    for (let i = 0; i < results.rows.length; i++) {
      const workData = results.rows.item(i);
      workData.tags = await this.getTagsForWork(workData.id);
      workData.warnings = await this.getWarningsForWork(workData.id);
      works.push(new Work(workData));
    }
    return works;
  }

  async getWorksByTag(tagName) {
    const query = `
      SELECT w.* FROM works w
      JOIN work_tags wt ON w.id = wt.workId
      JOIN tags t ON wt.tagId = t.id
      WHERE t.name = ?
    `;
    const [results] = await this.db.executeSql(query, [tagName]);
    const works = [];
    for (let i = 0; i < results.rows.length; i++) {
      const workData = results.rows.item(i);
      workData.tags = await this.getTagsForWork(workData.id);
      workData.warnings = await this.getWarningsForWork(workData.id);
      works.push(new Work(workData));
    }
    return works;
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM works WHERE id = ?', [id]);
  }

  async getTagsForWork(workId) {
    const [results] = await this.db.executeSql(`
        SELECT t.name FROM tags t
        JOIN work_tags wt ON t.id = wt.tagId
        WHERE wt.workId = ?
    `, [workId]);
    return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i).name);
  }

  async getWarningsForWork(workId) {
    const [results] = await this.db.executeSql(`
        SELECT w.name FROM warnings w
        JOIN work_warnings ww ON w.id = ww.warningId
        WHERE ww.workId = ?
    `, [workId]);
    return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i).name);
  }

  async _syncTags(workId, tagNames) {
    for (const name of tagNames) {
      let [tagResult] = await this.db.executeSql('SELECT id FROM tags WHERE name = ?', [name]);
      let tagId;
      if (tagResult.rows.length === 0) {
        [tagResult] = await this.db.executeSql('INSERT INTO tags (name) VALUES (?)', [name]);
        tagId = tagResult.insertId;
      } else {
        tagId = tagResult.rows.item(0).id;
      }
      await this.db.executeSql('INSERT OR IGNORE INTO work_tags (workId, tagId) VALUES (?, ?)', [workId, tagId]);
    }
  }

  async _syncWarnings(workId, warningNames) {
    for (const name of warningNames) {
      let [warnResult] = await this.db.executeSql('SELECT id FROM warnings WHERE name = ?', [name]);
      let warningId;
      if (warnResult.rows.length === 0) {
        [warnResult] = await this.db.executeSql('INSERT INTO warnings (name) VALUES (?)', [name]);
        warningId = warnResult.insertId;
      } else {
        warningId = warnResult.rows.item(0).id;
      }
      await this.db.executeSql('INSERT OR IGNORE INTO work_warnings (workId, warningId) VALUES (?, ?)', [workId, warningId]);
    }
  }
}
