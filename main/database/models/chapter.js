export class Chapter {
  constructor({
                id = null,
                workId,
                number,
                name = '',
                date,
                progress = 0.0,
              }) {
    this.id = id;
    this.workId = workId;
    this.number = number;
    this.name = name;
    this.date = date || Date.now();
    this.progress = progress;
  }
}
