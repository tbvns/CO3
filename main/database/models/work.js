export class Work {
  constructor({
                id = null,
                title,
                author,
                kudos = 0,
                hits = 0,
                language = 'English',
                updated,
                bookmarks = 0,
                tags = [],
                warnings = [],
                description = '',
                chapters = [],
                currentChapter = 1,
                chapterCount = null,
              }) {
    this.id = id;
    this.title = title;
    this.author = author;
    this.kudos = kudos;
    this.hits = hits;
    this.language = language;
    this.updated = updated || Date.now();
    this.bookmarks = bookmarks;
    this.tags = tags;
    this.warnings = warnings;
    this.description = description;
    this.chapters = chapters;
    this.currentChapter = currentChapter;
    this.chapterCount = chapterCount;
  }
}
