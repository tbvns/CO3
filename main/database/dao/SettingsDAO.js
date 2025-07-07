import { Settings } from '../models/settings';

export class SettingsDAO {
  constructor(db) {
    this.db = db;
  }

  /**
   * Retrieves the application settings from the database.
   * If no settings exist, it returns a default Settings object.
   * @returns {Promise<Settings>} The application settings.
   */
  async getSettings() {
    try {
      const [results] = await this.db.executeSql('SELECT * FROM settings WHERE id = 1');
      if (results.rows.length > 0) {
        const data = results.rows.item(0);
        data.isIncognitoMode = Boolean(data.isIncognitoMode);
        return new Settings(data);
      }
      return new Settings({});
    } catch (error) {
      console.error('Error getting settings:', error);
      return new Settings({});
    }
  }

  /**
   * Saves or updates the application settings in the database.
   * @param {Settings} settings - The settings object to save.
   */
  async saveSettings(settings) {
    const { id, theme, isIncognitoMode, viewMode } = settings;
    try {
      const incognitoModeInt = isIncognitoMode ? 1 : 0;
      await this.db.executeSql(
        `INSERT OR REPLACE INTO settings (id, theme, isIncognitoMode, viewMode) VALUES (?, ?, ?, ?)`,
        [id, theme, incognitoModeInt, viewMode]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }
}
