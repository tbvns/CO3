// models/history.js
export class History {
  constructor({ id = null, workId, chapter, chapterEnd = null, date }) {
    this.id = id;
    this.workId = workId;
    this.chapter = chapter;
    this.chapterEnd = chapterEnd;
    this.date = date || Date.now();
  }
}
