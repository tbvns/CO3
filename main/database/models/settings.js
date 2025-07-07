export class Settings {
  constructor({
                id = 1, // Assuming only one row for settings
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
