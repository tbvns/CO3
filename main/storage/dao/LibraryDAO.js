import { Work } from '../models/work';

export class LibraryDAO {
  constructor(db) {
    this.db = db;
  }

  async add(workId, collection = 'default') {
    if (!workId) {
      throw new Error('Work ID is required');
    }

    const dateAdded = Date.now();
    const readIndex = 0;

    await this.db.executeSql(
      `INSERT OR REPLACE INTO library (workId, dateAdded, collection, readIndex) VALUES (?, ?, ?, ?)`,
      [workId, dateAdded, collection, readIndex]
    );

    return { workId, dateAdded, collection, readIndex };
  }

  async remove(workId) {
    const [result] = await this.db.executeSql(
      'DELETE FROM library WHERE workId = ?',
      [workId]
    );
    return result.rowsAffected > 0;
  }

  async updateReadIndex(workId) {
    const newReadIndex = Date.now();
    await this.db.executeSql(
      'UPDATE library SET readIndex = ? WHERE workId = ?',
      [newReadIndex, workId]
    );
    return newReadIndex;
  }

  async getByPage(page = 1, pageSize = 20, sortType = 'lastRead', collection = null, startDate = null, endDate = null) {
    const offset = (page - 1) * pageSize;

    let whereClause = '';
    let whereParams = [];

    if (collection) {
      whereClause += ' AND l.collection = ?';
      whereParams.push(collection);
    }

    if (startDate) {
      whereClause += ' AND l.dateAdded >= ?';
      whereParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND l.dateAdded <= ?';
      whereParams.push(endDate);
    }

    let orderBy = '';
    switch (sortType) {
      case 'lastRead':
        orderBy = 'ORDER BY l.readIndex DESC';
        break;
      case 'alphabetical':
        orderBy = 'ORDER BY w.title ASC';
        break;
      case 'dateAdded':
        orderBy = 'ORDER BY l.dateAdded DESC';
        break;
      default:
        orderBy = 'ORDER BY l.readIndex DESC';
    }

    const query = `
      SELECT l.*, w.* FROM library l
                             JOIN works w ON l.workId = w.id
      WHERE 1=1 ${whereClause}
            ${orderBy}
        LIMIT ? OFFSET ?
    `;

    const [results] = await this.db.executeSql(query, [...whereParams, pageSize, offset]);
    const works = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      const workData = {
        id: row.id,
        title: row.title,
        author: row.author,
        kudos: row.kudos,
        hits: row.hits,
        language: row.language,
        updated: row.updated,
        bookmarks: row.bookmarks,
        description: row.description,
        currentChapter: row.currentChapter,
        chapterCount: row.chapterCount,
        rating: row.rating,
        category: row.category,
        warningStatus: row.warningStatus,
        isCompleted: row.isCompleted ? Boolean(row.isCompleted) : null
      };

      // Get tags and warnings for this work
      workData.tags = await this.getTagsForWork(row.id);
      workData.warnings = await this.getWarningsForWork(row.id);

      const libraryData = {
        dateAdded: row.dateAdded,
        collection: row.collection,
        readIndex: row.readIndex
      };

      works.push({
        work: new Work(workData),
        library: libraryData
      });
    }

    return works;
  }

  async getTotalCount(collection = null, startDate = null, endDate = null) {
    let whereClause = '';
    let whereParams = [];

    if (collection) {
      whereClause += ' AND l.collection = ?';
      whereParams.push(collection);
    }

    if (startDate) {
      whereClause += ' AND l.dateAdded >= ?';
      whereParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND l.dateAdded <= ?';
      whereParams.push(endDate);
    }

    const query = `
      SELECT COUNT(*) as total FROM library l
                                      JOIN works w ON l.workId = w.id
      WHERE 1=1 ${whereClause}
    `;

    const [result] = await this.db.executeSql(query, whereParams);
    return result.rows.item(0).total;
  }

  async search(searchTerm, page = 1, pageSize = 20, sortType = 'lastRead', collection = null, startDate = null, endDate = null) {
    const offset = (page - 1) * pageSize;

    // Build WHERE clause for filters
    let whereClause = '';
    let whereParams = [];

    // Add search conditions
    const searchPattern = `%${searchTerm}%`;
    whereClause += ` AND (
      w.title LIKE ? OR 
      w.author LIKE ? OR 
      w.description LIKE ? OR
      w.category LIKE ? OR
      w.rating LIKE ? OR
      w.id LIKE ? OR
      EXISTS (SELECT 1 FROM work_tags wt JOIN tags t ON wt.tagId = t.id WHERE wt.workId = w.id AND t.name LIKE ?) OR
      EXISTS (SELECT 1 FROM work_warnings ww JOIN warnings wr ON ww.warningId = wr.id WHERE ww.workId = w.id AND wr.name LIKE ?)
    )`;
    whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);

    if (collection) {
      whereClause += ' AND l.collection = ?';
      whereParams.push(collection);
    }

    if (startDate) {
      whereClause += ' AND l.dateAdded >= ?';
      whereParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND l.dateAdded <= ?';
      whereParams.push(endDate);
    }

    // Build ORDER BY clause
    let orderBy = '';
    switch (sortType) {
      case 'lastRead':
        orderBy = 'ORDER BY l.readIndex DESC';
        break;
      case 'alphabetical':
        orderBy = 'ORDER BY w.title ASC';
        break;
      case 'dateAdded':
        orderBy = 'ORDER BY l.dateAdded DESC';
        break;
      default:
        orderBy = 'ORDER BY l.readIndex DESC';
    }

    const query = `
      SELECT l.*, w.* FROM library l
                             JOIN works w ON l.workId = w.id
      WHERE 1=1 ${whereClause}
            ${orderBy}
        LIMIT ? OFFSET ?
    `;

    const [results] = await this.db.executeSql(query, [...whereParams, pageSize, offset]);
    const works = [];

    for (let i = 0; i < results.rows.length; i++) {
      const row = results.rows.item(i);
      const workData = {
        id: row.id,
        title: row.title,
        author: row.author,
        kudos: row.kudos,
        hits: row.hits,
        language: row.language,
        updated: row.updated,
        bookmarks: row.bookmarks,
        description: row.description,
        currentChapter: row.currentChapter,
        chapterCount: row.chapterCount,
        rating: row.rating,
        category: row.category,
        warningStatus: row.warningStatus,
        isCompleted: row.isCompleted ? Boolean(row.isCompleted) : null
      };

      // Get tags and warnings for this work
      workData.tags = await this.getTagsForWork(row.id);
      workData.warnings = await this.getWarningsForWork(row.id);

      // Add library-specific data
      const libraryData = {
        dateAdded: row.dateAdded,
        collection: row.collection,
        readIndex: row.readIndex
      };

      works.push({
        work: new Work(workData),
        library: libraryData
      });
    }

    return works;
  }

  async getSearchCount(searchTerm, collection = null, startDate = null, endDate = null) {
    let whereClause = '';
    let whereParams = [];

    // Add search conditions
    const searchPattern = `%${searchTerm}%`;
    whereClause += ` AND (
      w.title LIKE ? OR 
      w.author LIKE ? OR 
      w.description LIKE ? OR
      w.category LIKE ? OR
      w.rating LIKE ? OR
      w.id LIKE ? OR
      EXISTS (SELECT 1 FROM work_tags wt JOIN tags t ON wt.tagId = t.id WHERE wt.workId = w.id AND t.name LIKE ?) OR
      EXISTS (SELECT 1 FROM work_warnings ww JOIN warnings wr ON ww.warningId = wr.id WHERE ww.workId = w.id AND wr.name LIKE ?)
    )`;
    whereParams.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);

    if (collection) {
      whereClause += ' AND l.collection = ?';
      whereParams.push(collection);
    }

    if (startDate) {
      whereClause += ' AND l.dateAdded >= ?';
      whereParams.push(startDate);
    }

    if (endDate) {
      whereClause += ' AND l.dateAdded <= ?';
      whereParams.push(endDate);
    }

    const query = `
      SELECT COUNT(*) as total FROM library l
                                      JOIN works w ON l.workId = w.id
      WHERE 1=1 ${whereClause}
    `;

    const [result] = await this.db.executeSql(query, whereParams);
    return result.rows.item(0).total;
  }

  async getCollections() {
    const [results] = await this.db.executeSql('SELECT DISTINCT collection FROM library ORDER BY collection');
    return Array.from({ length: results.rows.length }, (_, i) => results.rows.item(i).collection);
  }

  async getLibraryEntry(workId) {
    const [results] = await this.db.executeSql(
      'SELECT * FROM library WHERE workId = ?',
      [workId]
    );

    if (results.rows.length === 0) return null;

    const row = results.rows.item(0);
    return {
      workId: row.workId,
      dateAdded: row.dateAdded,
      collection: row.collection,
      readIndex: row.readIndex
    };
  }

  async updateCollection(workId, collection) {
    await this.db.executeSql(
      'UPDATE library SET collection = ? WHERE workId = ?',
      [collection, workId]
    );
  }

  async isInLibrary(workId) {
    const [results] = await this.db.executeSql(
      'SELECT COUNT(*) as count FROM library WHERE workId = ?',
      [workId]
    );
    return results.rows.item(0).count > 0;
  }

  // Helper methods to get tags and warnings (reused from WorkDAO)
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
}
