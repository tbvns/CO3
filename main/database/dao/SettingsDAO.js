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
        // SQLite stores booleans as 0 or 1, convert back to boolean
        data.isIncognitoMode = Boolean(data.isIncognitoMode);
        return new Settings(data);
      }
      // If no settings exist, return default settings
      return new Settings({});
    } catch (error) {
      console.error('Error getting settings:', error);
      // Return default settings on error to prevent app crash
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
      // Convert boolean to integer for SQLite storage (0 or 1)
      const incognitoModeInt = isIncognitoMode ? 1 : 0;
      await this.db.executeSql(
        `INSERT OR REPLACE INTO settings (id, theme, isIncognitoMode, viewMode) VALUES (?, ?, ?, ?)`,
        [id, theme, incognitoModeInt, viewMode]
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error; // Re-throw to propagate the error
    }
  }
}
