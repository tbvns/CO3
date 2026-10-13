import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import RNFS from 'react-native-fs';
import JSZip from 'jszip';

const DB_FILE_NAME = 'library.db';

async function dumpAsyncStorage() {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const result = await AsyncStorage.multiGet(keys);

    const dump = Object.fromEntries(result);
    console.log(JSON.stringify(dump, null, 2));
    return dump;
  } catch (e) {
    console.error('Failed to dump AsyncStorage', e);
  }
}

async function restoreAsyncStorage(dataObject, { clearFirst = false } = {}) {
  try {
    if (clearFirst) {
      await AsyncStorage.clear();
    }

    const pairs = Object.entries(dataObject).map(([key, value]) => [
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    ]);

    await AsyncStorage.multiSet(pairs);
    console.log(`Restored ${pairs.length} keys`);
  } catch (e) {
    console.error('Failed to restore AsyncStorage', e);
  }
}

function getDbPath() {
  return Platform.select({
    android: `${RNFS.DocumentDirectoryPath}/${DB_FILE_NAME}`,
    ios: `${RNFS.LibraryDirectoryPath}/LocalDatabase/library.db`,
  });
}

export async function exportDbBytes(db) {
  const dbWasOpen = !!db.db;

  try {
    if (db.db) {
      await db.close();
    }

    const dbPath = getDbPath();
    const base64 = await RNFS.readFile(dbPath, 'base64');

    if (dbWasOpen) {
      await db.open();
    }

    return base64;
  } catch (error) {
    console.error('Database export (bytes) failed:', error);
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

export async function importDbBytes(db, base64) {
  const dbWasOpen = !!db.db;

  try {
    if (db.db) {
      await db.close();
    }

    const dbPath = getDbPath();

    const dbDir = dbPath.substring(0, dbPath.lastIndexOf('/'));
    await RNFS.mkdir(dbDir);

    await RNFS.writeFile(dbPath, base64, 'base64');

    return true;
  } catch (error) {
    console.error('Database import (bytes) failed:', error);
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

const STORAGE_ENTRY = 'async-storage.json';
const DB_ENTRY = 'library.db';
const DOWNLOADS_ENTRY_PREFIX = 'downloads/';

function getBackupDir() {
  return Platform.select({
    android: RNFS.DownloadDirectoryPath,
    ios: RNFS.DocumentDirectoryPath,
  });
}

function getDownloadsDir() {
  return `${RNFS.DocumentDirectoryPath}/CO3/downloads`;
}

async function addDirToZip(zip, dirPath, entryPrefix) {
  const exists = await RNFS.exists(dirPath);
  if (!exists) return;

  const items = await RNFS.readDir(dirPath);

  for (const item of items) {
    const entryPath = `${entryPrefix}${item.name}`;

    if (item.isDirectory()) {
      await addDirToZip(zip, item.path, `${entryPath}/`);
    } else {
      // html/css are utf8; if you ever store binary downloads, branch on extension
      const content = await RNFS.readFile(item.path, 'utf8');
      zip.file(entryPath, content);
    }
  }
}

async function extractDirFromZip(zip, entryPrefix, destDir) {
  const entries = Object.keys(zip.files).filter(
    (name) => name.startsWith(entryPrefix) && !zip.files[name].dir
  );

  for (const entryName of entries) {
    const relativePath = entryName.slice(entryPrefix.length);
    const outPath = `${destDir}/${relativePath}`;
    const outDir = outPath.substring(0, outPath.lastIndexOf('/'));

    await RNFS.mkdir(outDir);

    const content = await zip.file(entryName).async('string');
    await RNFS.writeFile(outPath, content, 'utf8');
  }
}

export async function exportBackup(db) {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const pairs = await AsyncStorage.multiGet(keys);
    const storageDump = Object.fromEntries(pairs);

    const dbBytes = await exportDbBytes(db);

    const zip = new JSZip();
    zip.file(STORAGE_ENTRY, JSON.stringify(storageDump, null, 2));
    zip.file(DB_ENTRY, dbBytes, { base64: true });

    await addDirToZip(zip, getDownloadsDir(), DOWNLOADS_ENTRY_PREFIX);

    const zipBase64 = await zip.generateAsync({ type: 'base64' });

    const backupDir = getBackupDir();
    await RNFS.mkdir(backupDir, { NSURLIsExcludedFromBackupKey: false });

    const fileName = `CO3-backup-${Date.now()}.zip`;
    const outputPath = `${backupDir}/${fileName}`;

    await RNFS.writeFile(outputPath, zipBase64, 'base64');

    return outputPath;
  } catch (error) {
    console.error('Backup export failed:', error);
    throw error;
  }
}

export async function importBackup(db, zipPath) {
  try {
    const zipBase64 = await RNFS.readFile(zipPath, 'base64');
    const zip = await JSZip.loadAsync(zipBase64, { base64: true });

    const storageFile = zip.file(STORAGE_ENTRY);
    if (storageFile) {
      const storageJson = await storageFile.async('string');
      const storageDump = JSON.parse(storageJson);

      const pairs = Object.entries(storageDump).map(([key, value]) => [
        key,
        typeof value === 'string' ? value : JSON.stringify(value),
      ]);

      await AsyncStorage.clear();
      await AsyncStorage.multiSet(pairs);
    } else {
      console.warn(
        `No ${STORAGE_ENTRY} found in backup, skipping AsyncStorage restore`,
      );
    }

    const dbFile = zip.file(DB_ENTRY);
    if (dbFile) {
      const dbBase64 = await dbFile.async('base64');
      await importDbBytes(db, dbBase64);
    } else {
      console.warn(`No ${DB_ENTRY} found in backup, skipping db restore`);
    }

    const downloadsDir = getDownloadsDir();
    await RNFS.mkdir(downloadsDir);
    await extractDirFromZip(zip, DOWNLOADS_ENTRY_PREFIX, downloadsDir);

    return true;
  } catch (error) {
    console.error('Backup import failed:', error);
    throw error;
  }
}
