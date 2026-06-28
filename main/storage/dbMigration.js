export async function from1to2(db) {
  console.log("Migrating database from version 1 to 2...");
  try {
    const [tableInfo] = await db.executeSql("PRAGMA table_info(works);");
    let columnExists = false;
    for (let i = 0; i < tableInfo.rows.length; i++) {
      if (tableInfo.rows.item(i).name === 'descriptionHTML') {
        columnExists = true;
        break;
      }
    }

    if (!columnExists) {
      await db.executeSql("ALTER TABLE works ADD COLUMN descriptionHTML TEXT;");
    }

    await db.executeSql(
      "UPDATE works SET descriptionHTML = description WHERE descriptionHTML IS NULL;"
    );

    console.log("Migration to version 2 complete.");
  } catch (error) {
    console.error("Migration from1to2 failed:", error);
    throw error;
  }
}

export async function from2to3(db) {
  console.log("Migrating database from version 2 to 3...");
  try {
    await db.executeSql("PRAGMA foreign_keys = OFF;");

    await db.executeSql("DROP TABLE IF EXISTS chapters;");
    await db.executeSql("DROP TABLE IF EXISTS chapters_old;");
    await db.executeSql("DROP INDEX IF EXISTS idx_chapters_workId;");

    await db.executeSql(`
      CREATE TABLE chapters (
                              id INTEGER PRIMARY KEY,
                              workId TEXT NOT NULL,
                              number INTEGER NOT NULL,
                              name TEXT,
                              date INTEGER,
                              FOREIGN KEY (workId) REFERENCES works (id) ON DELETE CASCADE
      );
    `);

    await db.executeSql(
      "CREATE INDEX idx_chapters_workId ON chapters (workId);"
    );

    await db.executeSql("PRAGMA foreign_keys = ON;");

    console.log("Migration to version 3 complete.");
  } catch (error) {
    console.error("Migration from2to3 failed:", error);
    try {
      await db.executeSql("PRAGMA foreign_keys = ON;");
    } catch (fkError) {
      console.error("Failed to re-enable foreign keys:", fkError);
    }
    throw error;
  }
}

export async function from3to4(db) {
  console.log("Migrating database from version 3 to 4...");
  try {
    const [tableInfo] = await db.executeSql("PRAGMA table_info(settings);");
    let fcExists = false, ffcExists = false, ucfcExists = false;
    for (let i = 0; i < tableInfo.rows.length; i++) {
      switch (tableInfo.rows.item(i).name) {
        case 'font': fcExists = true;
        case 'fontFamily': ffcExists = true;
        case 'useCustomFont': ucfcExists = true;
        default: continue
      }
    }

    if (!fcExists) await db.executeSql("ALTER TABLE settings ADD COLUMN font TEXT DEFAULT '';");
    if (!ffcExists) await db.executeSql("ALTER TABLE settings ADD COLUMN fontFamily TEXT DEFAULT 'Helvetica';");
    if (!ucfcExists) await db.executeSql("ALTER TABLE settings ADD COLUMN useCustomFont INTEGER DEFAULT 0;");

    console.log("Migration to version 4 complete.");
  } catch (error) {
    console.error("Migration from3to4 failed:", error);
    throw error;
  }
}

export async function from4to5(db) {
  console.log("Migrating database from version 4 to 5...");
  try {
    await db.executeSql("UPDATE works SET chapterCount = '?';");
    console.log("Migration to version 5 complete.");
  } catch (error) {
    console.error("Migration from4to5 failed:", error);
    throw error;
  }
}

export async function from5to6(db) {
  console.log("Migrating database from version 5 to 6...");
  try {
    const [tableInfo] = await db.executeSql("PRAGMA table_info(works);");
    let columnExists = false;
    for (let i = 0; i < tableInfo.rows.length; i++) {
      if (tableInfo.rows.item(i).name === 'words') {
        columnExists = true;
        break;
      }
    }

    if (!columnExists) {
      await db.executeSql("ALTER TABLE works ADD COLUMN words INTEGER;");
    }

    console.log("Migration to version 6 complete.");
  } catch (error) {
    console.error("Migration from5to6 failed:", error);
    throw error;
  }
}
