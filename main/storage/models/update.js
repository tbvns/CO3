export class Update {
  constructor({
                id = null,
                workId,
                chapterNumber,
                chapterID,
                date
              }) {
    this.id = id;
    this.workId = workId;
    this.chapterNumber = chapterNumber;
    this.chapterID = chapterID;
    this.date = date || Date.now();
  }
}