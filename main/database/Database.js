import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

let instance = null;

class Database {
  constructor() {
    if (!instance) {
      this.db = null;
      instance = this;
    }
    return instance;
  }

  async open() {
    if (this.db) {
      return this.db;
    }
    this.db = await SQLite.openDatabase({ name: 'library.db', location: 'default' });
    await this.initializeSchema();
    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  async initializeSchema() {
    const queries = [
      `CREATE TABLE IF NOT EXISTS works (
                                          id TEXT PRIMARY KEY,
                                          title TEXT NOT NULL,
                                          author TEXT NOT NULL,
                                          kudos INTEGER DEFAULT 0,
                                          hits INTEGER DEFAULT 0,
                                          language TEXT,
                                          updated INTEGER,
                                          bookmarks INTEGER DEFAULT 0,
                                          description TEXT,
                                          currentChapter INTEGER DEFAULT 1,
                                          chapterCount INTEGER,
                                          rating TEXT DEFAULT 'Not Rated',
                                          category TEXT DEFAULT 'None',
                                          warningStatus TEXT DEFAULT 'NoWarningsApply',
                                          isCompleted INTEGER
       );`,
      `CREATE TABLE IF NOT EXISTS chapters (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             workId TEXT NOT NULL,
                                             number INTEGER NOT NULL,
                                             name TEXT,
                                             date INTEGER,
                                             progress REAL DEFAULT 0.0,
                                             FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE TABLE IF NOT EXISTS tags (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                         name TEXT UNIQUE NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS work_tags (
                                              workId TEXT NOT NULL,
                                              tagId INTEGER NOT NULL,
                                              FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE,
        FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE,
        PRIMARY KEY (workId, tagId)
        );`,
      `CREATE TABLE IF NOT EXISTS warnings (
                                             id INTEGER PRIMARY KEY AUTOINCREMENT,
                                             name TEXT UNIQUE NOT NULL
       );`,
      `CREATE TABLE IF NOT EXISTS work_warnings (
                                                  workId TEXT NOT NULL,
                                                  warningId INTEGER NOT NULL,
                                                  FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE,
        FOREIGN KEY (warningId) REFERENCES warnings (id) ON DELETE CASCADE,
        PRIMARY KEY (workId, warningId)
        );`,
      `CREATE TABLE IF NOT EXISTS history (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            workId TEXT NOT NULL,
                                            date INTEGER NOT NULL,
                                            chapter INTEGER NOT NULL,
                                            chapterEnd INTEGER,
                                            FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE TABLE IF NOT EXISTS kudo_history (
                                                 workId TEXT PRIMARY KEY,
                                                 date INTEGER NOT NULL,
                                                 FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE TABLE IF NOT EXISTS settings (
                                             id INTEGER PRIMARY KEY, -- Should always be 1
                                             theme TEXT DEFAULT 'light',
                                             isIncognitoMode INTEGER DEFAULT 0, -- SQLite stores booleans as 0 or 1
                                             viewMode TEXT DEFAULT 'full'
       );`,
      `CREATE TABLE IF NOT EXISTS library (
                                            workId TEXT PRIMARY KEY,
                                            dateAdded INTEGER NOT NULL,
                                            collection TEXT DEFAULT 'default',
                                            readIndex INTEGER DEFAULT 0,
                                            FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE INDEX IF NOT EXISTS idx_chapters_workId ON chapters (workId);`,
      `CREATE INDEX IF NOT EXISTS idx_history_workId ON history (workId);`,
      `CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);`,
      `CREATE INDEX IF NOT EXISTS idx_warnings_name ON warnings (name);`,

      `CREATE INDEX IF NOT EXISTS idx_library_readIndex ON library (readIndex);`,
      `CREATE INDEX IF NOT EXISTS idx_library_dateAdded ON library (dateAdded);`,
      `CREATE INDEX IF NOT EXISTS idx_library_collection ON library (collection);`
    ];

    try {
      for (const query of queries) {
        await this.db.executeSql(query);
      }
      const [settingsCheck] = await this.db.executeSql('SELECT COUNT(*) FROM settings WHERE id = 1');
      if (settingsCheck.rows.item(0)['COUNT(*)'] === 0) {
        await this.db.executeSql(
          `INSERT INTO settings (id, theme, isIncognitoMode, viewMode) VALUES (?, ?, ?, ?)`,
          [1, 'light', 0, 'full']
        );
      }
    } catch (error) {
      console.error("Error initializing schema:", error);
      throw error;
    }
  }
}

export const database = new Database();
