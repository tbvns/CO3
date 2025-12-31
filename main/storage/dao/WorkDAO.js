import { Work } from '../models/work';

export class WorkDAO {
  constructor(db) {
    this.db = db;
  }

  async add(work) {
    const {
      id,
      title,
      author,
      kudos,
      hits,
      language,
      updated,
      bookmarks,
      description,
      currentChapter,
      chapterCount,
      rating,
      category,
      warningStatus,
      isCompleted,
      tags = [],
      warnings = []
    } = work;

    // Ensure ID is provided
    if (!id) {
      throw new Error('Work ID is required');
    }

    await this.db.executeSql(
      `INSERT OR REPLACE INTO works (
          id, title, author, kudos, hits, language, updated, bookmarks,
          description, currentChapter, chapterCount, rating, category,
          warningStatus, isCompleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, title, author, kudos, hits, language, updated, bookmarks,
        description, currentChapter, chapterCount, rating, category,
        warningStatus, isCompleted
      ]
    );

    await this._syncTags(id, tags);
    await this._syncWarnings(id, warnings);
    return id;
  }

  async get(id) {
    const [results] = await this.db.executeSql('SELECT * FROM works WHERE id = ?', [id]);
    if (results.rows.length === 0) return null;

    const workData = results.rows.item(0);
    workData.tags = await this.getTagsForWork(id);
    workData.warnings = await this.getWarningsForWork(id);

    return new Work({
      ...workData,
      isCompleted: workData.isCompleted ? Boolean(workData.isCompleted) : null
    });
  }

  async getAll() {
    const [results] = await this.db.executeSql('SELECT * FROM works');
    const works = [];

    for (let i = 0; i < results.rows.length; i++) {
      const workData = results.rows.item(i);
      workData.tags = await this.getTagsForWork(workData.id);
      workData.warnings = await this.getWarningsForWork(workData.id);

      works.push(new Work({
        ...workData,
        isCompleted: workData.isCompleted ? Boolean(workData.isCompleted) : null
      }));
    }

    return works;
  }

  async update(work) {
    const {
      id, title, author, kudos, hits, language, updated, bookmarks,
      description, currentChapter, chapterCount, rating, category,
      warningStatus, isCompleted, tags, warnings
    } = work;

    // Ensure ID is provided
    if (!id) {
      throw new Error('Work ID is required');
    }

    await this.db.executeSql(
      `UPDATE works SET
                      title = ?, author = ?, kudos = ?, hits = ?, language = ?,
                      updated = ?, bookmarks = ?, description = ?, currentChapter = ?,
                      chapterCount = ?, rating = ?, category = ?, warningStatus = ?,
                      isCompleted = ?
       WHERE id = ?`,
      [
        title, author, kudos, hits, language, updated, bookmarks,
        description, currentChapter, chapterCount, rating, category,
        warningStatus, isCompleted, id
      ]
    );

    await this._syncTags(id, tags);
    await this._syncWarnings(id, warnings);
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

      works.push(new Work({
        ...workData,
        isCompleted: workData.isCompleted ? Boolean(workData.isCompleted) : null
      }));
    }

    return works;
  }

  async delete(id) {
    await this.db.executeSql('DELETE FROM works WHERE id = ?', [id]);
  }

  async exists(id) {
    const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM works WHERE id = ?', [id]);
    return results.rows.item(0).count > 0;
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
    await this.db.executeSql('DELETE FROM work_tags WHERE workId = ?', [workId]);

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
    await this.db.executeSql('DELETE FROM work_warnings WHERE workId = ?', [workId]);

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


export const normalizeWorkData = (work) => ({
  ...work,
  kudos: work.kudos ?? work.likes ?? null,
  hits: work.hits ?? work.views ?? null,
});