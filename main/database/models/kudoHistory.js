export class KudoHistory {
  constructor({ workId, date }) {
    this.workId = workId;
    this.date = date || Date.now();
  }
}
