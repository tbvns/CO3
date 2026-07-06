import SQLite from 'react-native-sqlite-storage';
import RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import {
  from1to2,
  from2to3,
  from3to4,
  from4to5,
  from5to6,
} from './dbMigration';

SQLite.enablePromise(true);

const TARGET_VERSION = 6;

let instance = null;

class Database {
  constructor() {
    if (!instance) {
      this.db = null;
      instance = this;
    }
    return instance;
  }

  static getInstance() {
    return instance;
  }

  async open() {
    if (this.db) {
      return this.db;
    }
    this.db = await SQLite.openDatabase({
      name: 'library.db',
      location: 'default',
    });

    await this.initializeSchema();
    await this.runMigrations();

    return this.db;
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
  }

  async getDatabaseVersion() {
    try {
      const [results] = await this.db.executeSql('PRAGMA user_version;');
      const version = results.rows.item(0).user_version;
      return version === 0 ? 1 : version;
    } catch (error) {
      console.error("Failed to get database version:", error);
      return 1;
    }
  }

  async setDatabaseVersion(version) {
    await this.db.executeSql(`PRAGMA user_version = ${version};`);
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
                                          descriptionHTML TEXT,
                                          currentChapter INTEGER DEFAULT 1,
                                          chapterCount INTEGER,
                                          rating TEXT DEFAULT 'Not Rated',
                                          category TEXT DEFAULT 'None',
                                          warningStatus TEXT DEFAULT 'NoWarningsApply',
                                          isCompleted INTEGER,
                                          words INTEGER
       );`,
      `CREATE TABLE IF NOT EXISTS chapters (
                                             id INTEGER PRIMARY KEY,
                                             workId TEXT NOT NULL,
                                             number INTEGER NOT NULL,
                                             name TEXT,
                                             date INTEGER,
                                             FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE TABLE IF NOT EXISTS progress_entries (
                                                     workId TEXT NOT NULL,
                                                     chapterID INTEGER NOT NULL,
                                                     progress REAL DEFAULT 0.0,
                                                     PRIMARY KEY (workId, chapterID),
        FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE,
        FOREIGN KEY (chapterID) REFERENCES chapters (id) ON DELETE CASCADE
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
                                             id INTEGER PRIMARY KEY,
                                             theme TEXT DEFAULT 'light',
                                             isIncognitoMode INTEGER DEFAULT 0,
                                             viewMode TEXT DEFAULT 'full',
                                             fontSize REAL DEFAULT 1.0,
                                             useCustomSize INTEGER DEFAULT 0,
                                             font TEXT DEFAULT '',
                                             fontFamily TEXT DEFAULT 'Helvetica',
                                             useCustomFont INTEGER DEFAULT 0
       );`,
      `CREATE TABLE IF NOT EXISTS library (
                                            workId TEXT PRIMARY KEY,
                                            dateAdded INTEGER NOT NULL,
                                            collection TEXT DEFAULT 'default',
                                            readIndex INTEGER DEFAULT 0,
                                            FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
        );`,
      `CREATE TABLE IF NOT EXISTS updates (
                                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                                            workId TEXT NOT NULL,
                                            chapterNumber INTEGER NOT NULL,
                                            chapterID INTEGER NOT NULL,
                                            date INTEGER NOT NULL,
                                            FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE,
        FOREIGN KEY (chapterID) REFERENCES chapters (id) ON DELETE CASCADE
        );`,
      `CREATE INDEX IF NOT EXISTS idx_updates_workId ON updates (workId);`,
      `CREATE INDEX IF NOT EXISTS idx_updates_date ON updates (date);`,
      `CREATE INDEX IF NOT EXISTS idx_chapters_workId ON chapters (workId);`,
      `CREATE INDEX IF NOT EXISTS idx_history_workId ON history (workId);`,
      `CREATE INDEX IF NOT EXISTS idx_tags_name ON tags (name);`,
      `CREATE INDEX IF NOT EXISTS idx_warnings_name ON warnings (name);`,
      `CREATE INDEX IF NOT EXISTS idx_progress_workId_chapterId ON progress_entries (workId, chapterID);`,
      `CREATE INDEX IF NOT EXISTS idx_library_readIndex ON library (readIndex);`,
      `CREATE INDEX IF NOT EXISTS idx_library_dateAdded ON library (dateAdded);`,
      `CREATE INDEX IF NOT EXISTS idx_library_collection ON library (collection);`
    ];

    try {
      for (const query of queries) {
        await this.db.executeSql(query);
      }
      const [settingsCheck] = await this.db.executeSql(
        'SELECT COUNT(*) as count FROM settings WHERE id = 1'
      );
      if (settingsCheck.rows.item(0).count === 0) {
        await this.db.executeSql(
          `INSERT INTO settings (id, theme, isIncognitoMode, viewMode, fontSize, useCustomSize, font, fontFamily, useCustomFont) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [1, 'light', 0, 'full', 1.0, 0, 'Helvetica', 0]
        );
      }
    } catch (error) {
      console.error("Error initializing schema:", error);
      throw error;
    }
  }

  async runMigrations() {
    let currentVersion = await this.getDatabaseVersion();

    if (currentVersion < 2) {
      await from1to2(this.db);
    }

    if (currentVersion < 3) {
      await from2to3(this.db);
    }

    if (currentVersion < 4) {
      await from3to4(this.db);
    }

    if (currentVersion < 5) {
      await from4to5(this.db);
    }

    if (currentVersion < 6) {
      await from5to6(this.db);
    }

    await this.setDatabaseVersion(TARGET_VERSION);
  }
}


export async function exportDb(db) {
  let dbWasOpen = !!db.db;

  try {
    if (db.db) {
      await db.close();
    }

    const dbFileName = 'library.db';
    const exportFileName = 'CO3-Database-Export.db';

    const dbPath = Platform.select({
      android: `/data/data/com.co3/databases/${dbFileName}`,
      ios: `${RNFS.LibraryDirectoryPath}/LocalDatabase/${dbFileName}`,
    });

    const exportPath = Platform.select({
      android: `${RNFS.DownloadDirectoryPath}/${exportFileName}`,
      ios: `${RNFS.DocumentDirectoryPath}/${exportFileName}`,
    });

    const exportDir = Platform.select({
      android: RNFS.DownloadDirectoryPath,
      ios: RNFS.DocumentDirectoryPath,
    });

    await RNFS.mkdir(exportDir, { NSURLIsExcludedFromBackupKey: false });
    await RNFS.copyFile(dbPath, exportPath);

    if (dbWasOpen) {
      await db.open();
    }

    return exportPath;
  } catch (error) {
    console.error('Database export failed:', error);
    if (dbWasOpen) {
      try {
        await db.open();
      } catch (reopenError) {
        console.error('Failed to reopen database:', reopenError);
      }
    }
    throw error;
  }
}

export const database = new Database();