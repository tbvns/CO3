export class Settings {
  constructor({
                id = 1,
                theme = 'light',
                isIncognitoMode = false,
                viewMode = 'full',
              }) {
    this.id = id;
    this.theme = theme;
    this.isIncognitoMode = isIncognitoMode;
    this.viewMode = viewMode;
  }
}
