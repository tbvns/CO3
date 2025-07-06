import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  async initializeDatabase() {
    try {
      this.db = await SQLite.openDatabase({
        name: 'library.db',
        location: 'default',
      });

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS books (
                                           id INTEGER PRIMARY KEY AUTOINCREMENT,
                                           title TEXT NOT NULL,
                                           author TEXT NOT NULL,
                                           description TEXT,
                                           tags TEXT,
                                           warnings TEXT,
                                           language TEXT DEFAULT 'English',
                                           image TEXT,
                                           lastUpdated TEXT,
                                           likes INTEGER DEFAULT 0,
                                           bookmarks INTEGER DEFAULT 0,
                                           views INTEGER DEFAULT 0,
                                           created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await this.migrateHistoryTable();

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS settings (
                                              id INTEGER PRIMARY KEY AUTOINCREMENT,
                                              key TEXT UNIQUE NOT NULL,
                                              value TEXT NOT NULL
        );
      `);

      await this.insertInitialData();
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  async migrateHistoryTable() {
    try {
      const [tableInfo] = await this.db.executeSql(`PRAGMA table_info(history);`);

      let hasOldStructure = false;
      let hasNewStructure = false;

      if (tableInfo.rows.length > 0) {
        for (let i = 0; i < tableInfo.rows.length; i++) {
          const column = tableInfo.rows.item(i);
          if (column.name === 'title' || column.name === 'book_id') {
            hasOldStructure = true;
          }
          if (column.name === 'work_id' || column.name === 'date_read') {
            hasNewStructure = true;
          }
        }
      }

      if (hasOldStructure && !hasNewStructure) {
        await this.db.executeSql(`DROP TABLE IF EXISTS history;`);
      }

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS history (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             date_read INTEGER NOT NULL,
                                             chapter_start INTEGER NOT NULL,
                                             chapter_end INTEGER,
                                             work_id INTEGER NOT NULL,
                                             book_title TEXT NOT NULL,
                                             book_author TEXT NOT NULL,
                                             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY (work_id) REFERENCES books (id)
        );
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_history_date_read ON history (date_read);
      `);

      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_history_work_id ON history (work_id);
      `);
    } catch (error) {
      console.error('Error migrating history table:', error);
      await this.db.executeSql(`DROP TABLE IF EXISTS history;`);
      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS history (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             date_read INTEGER NOT NULL,
                                             chapter_start INTEGER NOT NULL,
                                             chapter_end INTEGER,
                                             work_id INTEGER NOT NULL,
                                             book_title TEXT NOT NULL,
                                             book_author TEXT NOT NULL,
                                             created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                             FOREIGN KEY (work_id) REFERENCES books (id)
        );
      `);
      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_history_date_read ON history (date_read);
      `);
      await this.db.executeSql(`
        CREATE INDEX IF NOT EXISTS idx_history_work_id ON history (work_id);
      `);
    }
  }

  async insertInitialData() {
    try {
      const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM books');
      if (results.rows.item(0).count === 0) {
        const initialBooks = [
          {
            title: 'The Enigmatic Scroll',
            author: 'Aria Thorne',
            description: 'A young cartographer stumbles upon an ancient, cursed scroll that leads her on a perilous journey across forgotten lands, battling mythical beasts and uncovering long-lost secrets.',
            tags: JSON.stringify(['Fantasy', 'Adventure', 'Magic', 'Dragons', 'Quests']),
            warnings: JSON.stringify(['Mild Violence', 'Intense Scenes']),
            language: 'English',
            image: 'https://placehold.co/100x100/E0F2FE/2563EB?text=Book1',
            lastUpdated: '2024-06-28',
            likes: 1250,
            bookmarks: 340,
            views: 15000,
          },
          {
            title: 'Echoes of Tomorrow',
            author: 'Kairos Vance',
            description: 'In a future where memories can be bought and sold, a detective uncovers a conspiracy that threatens to unravel the very fabric of reality.',
            tags: JSON.stringify(['Sci-Fi', 'Dystopian', 'Cyberpunk']),
            warnings: JSON.stringify(['Mature Themes', 'Psychological Distress']),
            language: 'English',
            image: 'https://placehold.co/100x100/FFFBEB/D97706?text=Book2',
            lastUpdated: '2024-07-01',
            likes: 980,
            bookmarks: 210,
            views: 12000,
          },
          {
            title: 'Whispers in the Garden',
            author: 'Elara Bloom',
            description: 'Set in a quaint English village in the 1920s, a young woman inherits a mysterious garden and soon finds herself entangled in a century-old secret and an unexpected romance.',
            tags: JSON.stringify(['Romance', 'Mystery', 'Historical']),
            warnings: JSON.stringify([]),
            language: 'English',
            image: 'https://placehold.co/100x100/F0FDF4/16A34A?text=Book3',
            lastUpdated: '2024-06-15',
            likes: 1560,
            bookmarks: 450,
            views: 18000,
          },
        ];

        for (const book of initialBooks) {
          await this.db.executeSql(
            `INSERT INTO books (title, author, description, tags, warnings, language, image, lastUpdated, likes, bookmarks, views)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              book.title,
              book.author,
              book.description,
              book.tags,
              book.warnings,
              book.language,
              book.image,
              book.lastUpdated,
              book.likes,
              book.bookmarks,
              book.views,
            ]
          );
        }

        const [historyResults] = await this.db.executeSql('SELECT COUNT(*) as count FROM history');
        if (historyResults.rows.item(0).count === 0) {
          const now = Date.now();
          const initialHistory = [
            { date_read: now - 86400000, chapter_start: 5, chapter_end: 5, work_id: 1, book_title: 'The Enigmatic Scroll', book_author: 'Aria Thorne' }, // 1 day ago
            { date_read: now - 172800000, chapter_start: 1, chapter_end: 3, work_id: 2, book_title: 'Echoes of Tomorrow', book_author: 'Kairos Vance' }, // 2 days ago
            { date_read: now - 259200000, chapter_start: 12, chapter_end: 12, work_id: 3, book_title: 'Whispers in the Garden', book_author: 'Elara Bloom' }, // 3 days ago
          ];

          for (const historyItem of initialHistory) {
            await this.db.executeSql(
              `INSERT INTO history (date_read, chapter_start, chapter_end, work_id, book_title, book_author) VALUES (?, ?, ?, ?, ?, ?)`,
              [historyItem.date_read, historyItem.chapter_start, historyItem.chapter_end, historyItem.work_id, historyItem.book_title, historyItem.book_author]
            );
          }
        }
      }
    } catch (error) {
      console.error('Error inserting initial data:', error);
    }
  }

  async getAllBooks() {
    try {
      const [results] = await this.db.executeSql('SELECT * FROM books ORDER BY created_at DESC');
      const books = [];
      for (let i = 0; i < results.rows.length; i++) {
        const book = results.rows.item(i);
        books.push({
          ...book,
          tags: JSON.parse(book.tags || '[]'),
          warnings: JSON.parse(book.warnings || '[]'),
        });
      }
      return books;
    } catch (error) {
      console.error('Error getting books:', error);
      throw error;
    }
  }

  async addBook(bookData) {
    try {
      const [result] = await this.db.executeSql(
        `INSERT INTO books (title, author, description, tags, warnings, language, image, lastUpdated, likes, bookmarks, views)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          bookData.title,
          bookData.author,
          bookData.description || '',
          JSON.stringify(bookData.tags || []),
          JSON.stringify(bookData.warnings || []),
          bookData.language || 'English',
          bookData.image || '',
          bookData.lastUpdated,
          bookData.likes || 0,
          bookData.bookmarks || 0,
          bookData.views || 0,
        ]
      );
      return result.insertId;
    } catch (error) {
      console.error('Error adding book:', error);
      throw error;
    }
  }

  async updateBook(id, bookData) {
    try {
      await this.db.executeSql(
        `UPDATE books SET title = ?, author = ?, description = ?, tags = ?, warnings = ?, language = ?, image = ?, lastUpdated = ?
         WHERE id = ?`,
        [
          bookData.title,
          bookData.author,
          bookData.description || '',
          JSON.stringify(bookData.tags || []),
          JSON.stringify(bookData.warnings || []),
          bookData.language || 'English',
          bookData.image || '',
          bookData.lastUpdated,
          id,
        ]
      );
    } catch (error) {
      console.error('Error updating book:', error);
      throw error;
    }
  }

  async deleteBook(id) {
    try {
      await this.db.executeSql('DELETE FROM books WHERE id = ?', [id]);
      await this.db.executeSql('DELETE FROM history WHERE work_id = ?', [id]);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async getHistory(limit = 20, offset = 0) {
    try {
      const [tableInfo] = await this.db.executeSql(`PRAGMA table_info(history);`);

      if (tableInfo.rows.length === 0) {
        return [];
      }

      let hasWorkId = false;
      let hasBookTitle = false;
      for (let i = 0; i < tableInfo.rows.length; i++) {
        const column = tableInfo.rows.item(i);
        if (column.name === 'work_id') {
          hasWorkId = true;
        }
        if (column.name === 'book_title') {
          hasBookTitle = true;
        }
      }

      if (!hasWorkId || !hasBookTitle) {
        return [];
      }

      const [results] = await this.db.executeSql(`
        SELECT h.*
        FROM history h
        ORDER BY h.date_read DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]);

      const history = [];
      for (let i = 0; i < results.rows.length; i++) {
        history.push(results.rows.item(i));
      }
      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      return [];
    }
  }

  async getHistoryCount() {
    try {
      const [results] = await this.db.executeSql('SELECT COUNT(*) as count FROM history');
      return results.rows.item(0).count;
    } catch (error) {
      console.error('Error getting history count:', error);
      return 0;
    }
  }

  async getHistoryByDateRange(startDate, endDate, limit = 100, offset = 0) {
    try {
      const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
      const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);

      const [results] = await this.db.executeSql(`
        SELECT h.*
        FROM history h
        WHERE h.date_read >= ? AND h.date_read <= ?
        ORDER BY h.date_read DESC
        LIMIT ? OFFSET ?
      `, [startTimestamp, endTimestamp, limit, offset]);

      const history = [];
      for (let i = 0; i < results.rows.length; i++) {
        history.push(results.rows.item(i));
      }
      return history;
    } catch (error) {
      console.error('Error getting history by date range:', error);
      return [];
    }
  }

  async getHistoryCountByDateRange(startDate, endDate) {
    try {
      const startTimestamp = new Date(startDate).setHours(0, 0, 0, 0);
      const endTimestamp = new Date(endDate).setHours(23, 59, 59, 999);

      const [results] = await this.db.executeSql(`
        SELECT COUNT(*) as count 
        FROM history 
        WHERE date_read >= ? AND date_read <= ?
      `, [startTimestamp, endTimestamp]);

      return results.rows.item(0).count;
    } catch (error) {
      console.error('Error getting history count by date range:', error);
      return 0;
    }
  }

  async getReadingDates() {
    try {
      const [results] = await this.db.executeSql(`
        SELECT DISTINCT date(date_read/1000, 'unixepoch') as reading_date
        FROM history
        ORDER BY reading_date DESC
      `);

      const dates = [];
      for (let i = 0; i < results.rows.length; i++) {
        dates.push(results.rows.item(i).reading_date);
      }
      return dates;
    } catch (error) {
      console.error('Error getting reading dates:', error);
      return [];
    }
  }

  async addToHistory(date, chapter, workId, bookTitle, bookAuthor) {
    try {
      const ONE_HOUR = 3600000; // 1 hour in milliseconds

      // Get the most recent history entry for this work
      const [results] = await this.db.executeSql(
        'SELECT * FROM history WHERE work_id = ? ORDER BY date_read DESC LIMIT 1',
        [workId]
      );

      if (results.rows.length > 0) {
        const lastEntry = results.rows.item(0);
        const timeDiff = date - lastEntry.date_read;
        const lastChapterEnd = lastEntry.chapter_end || lastEntry.chapter_start;

        // Check if we can update the existing entry
        if (timeDiff < ONE_HOUR && chapter === lastChapterEnd + 1) {
          // Update existing entry
          await this.db.executeSql(
            'UPDATE history SET date_read = ?, chapter_end = ? WHERE id = ?',
            [date, chapter, lastEntry.id]
          );
          return;
        }
      }

      // Create new entry
      await this.db.executeSql(
        'INSERT INTO history (date_read, chapter_start, chapter_end, work_id, book_title, book_author) VALUES (?, ?, ?, ?, ?, ?)',
        [date, chapter, null, workId, bookTitle, bookAuthor]
      );
    } catch (error) {
      console.error('Error adding to history:', error);
      throw error;
    }
  }

  async addToHistoryByWorkId(date, chapter, workId) {
    try {
      // Get book details
      const [results] = await this.db.executeSql(
        'SELECT title, author FROM books WHERE id = ?',
        [workId]
      );

      if (results.rows.length === 0) {
        throw new Error(`Book with ID ${workId} not found`);
      }

      const book = results.rows.item(0);
      await this.addToHistory(date, chapter, workId, book.title, book.author);
    } catch (error) {
      console.error('Error adding to history by work ID:', error);
      throw error;
    }
  }

  async clearHistory() {
    try {
      await this.db.executeSql('DELETE FROM history');
    } catch (error) {
      console.error('Error clearing history:', error);
      throw error;
    }
  }

  async getSetting(key) {
    try {
      const [results] = await this.db.executeSql(
        'SELECT value FROM settings WHERE key = ?',
        [key]
      );
      return results.rows.length > 0 ? results.rows.item(0).value : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  }

  async setSetting(key, value) {
    try {
      await this.db.executeSql(
        'INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)',
        [key, value]
      );
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }
}

export default new DatabaseManager();
