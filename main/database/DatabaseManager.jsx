import SQLite from 'react-native-sqlite-storage';

// Enable debugging
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

      await this.db.executeSql(`
        CREATE TABLE IF NOT EXISTS history (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          book_id INTEGER,
          date TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (book_id) REFERENCES books (id)
        );
      `);

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

        const initialHistory = [
          { title: 'Chapter 5 of The Enigmatic Scroll', book_id: 1, date: '2024-07-03' },
          { title: 'Echoes of Tomorrow - Prologue', book_id: 2, date: '2024-07-02' },
          { title: 'Whispers in the Garden - Ch. 12', book_id: 3, date: '2024-07-01' },
        ];

        for (const historyItem of initialHistory) {
          await this.db.executeSql(
            `INSERT INTO history (title, book_id, date) VALUES (?, ?, ?)`,
            [historyItem.title, historyItem.book_id, historyItem.date]
          );
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
      await this.db.executeSql('DELETE FROM history WHERE book_id = ?', [id]);
    } catch (error) {
      console.error('Error deleting book:', error);
      throw error;
    }
  }

  async getHistory(limit = 10) {
    try {
      const [results] = await this.db.executeSql(
        'SELECT * FROM history ORDER BY created_at DESC LIMIT ?',
        [limit]
      );
      const history = [];
      for (let i = 0; i < results.rows.length; i++) {
        history.push(results.rows.item(i));
      }
      return history;
    } catch (error) {
      console.error('Error getting history:', error);
      throw error;
    }
  }

  async addToHistory(title, bookId = null) {
    try {
      const date = new Date().toISOString().split('T')[0];
      await this.db.executeSql(
        'INSERT INTO history (title, book_id, date) VALUES (?, ?, ?)',
        [title, bookId, date]
      );
    } catch (error) {
      console.error('Error adding to history:', error);
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
