export class Settings {
  constructor({
                id = 1,
                theme = 'light',
                isIncognitoMode = false,
                viewMode = 'full',
                // Browser settings
                fontSize = 1.0,
                useCustomSize = false,
              }) {
    this.id = id;
    this.theme = theme;
    this.isIncognitoMode = isIncognitoMode;
    this.viewMode = viewMode;
    // Browser settings
    this.fontSize = fontSize;
    this.useCustomSize = useCustomSize;
  }
}
