function rowsToList(rows) {
  return Array.from(
    { length: rows.length },
    (_, i) => rows.item(i),
  );
}

export async function totalChaptersRead(db) {
  const [result] = await db.executeSql(`
    SELECT COUNT(*) AS total_chapters
    FROM chapters AS c
    JOIN progress_entries AS e ON c.id = e.chapterID
    WHERE e.progress >= 0.95;
  `);
  return result.rows.item(0).total_chapters;
}

export async function totalWorksStarted(db) {
  const [result] = await db.executeSql(`
    SELECT COUNT(DISTINCT e.workId) AS total_works
    FROM progress_entries AS e
    JOIN works AS w ON w.id = e.workId
  `);
  return result.rows.item(0).total_works;
}

export async function preferredTag(db) {
  const [result] = await db.executeSql(`
    SELECT ta.name AS tag_name, COUNT(*) AS usage_count
    FROM work_tags AS t
           JOIN tags AS ta ON ta.id = t.tagId
    WHERE t.workId IN (
      SELECT DISTINCT e.workId
      FROM progress_entries AS e
             JOIN chapters AS c ON c.id = e.chapterID
      WHERE e.progress >= 0.95
    )
    GROUP BY ta.name
    ORDER BY usage_count DESC
    LIMIT 20;
  `);
  return rowsToList(result.rows);
}

export async function preferredAuthor(db) {
  const [result] = await db.executeSql(`
    SELECT w.author AS author, COUNT(DISTINCT w.id) AS author_count
    FROM works AS w
    WHERE w.id IN (
      SELECT DISTINCT e.workId
      FROM progress_entries AS e
             JOIN chapters AS c ON c.id = e.chapterID
      WHERE e.progress >= 0.95
    )
    GROUP BY w.author
    ORDER BY author_count DESC
    LIMIT 5;
  `);
  return rowsToList(result.rows);
}

export async function totalWorksKudoed(db) {
  const [result] = await db.executeSql(`
    SELECT COUNT(DISTINCT e.workId) AS total_works
    FROM kudo_history AS e
  `);
  return result.rows.item(0).total_works;
}

