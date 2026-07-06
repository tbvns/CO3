import AsyncStorage from '@react-native-async-storage/async-storage';

class updateRestictionType {
  static None = 0;
  static Wifi = 1;
  // static Unmetered = 2; //Wifi and Unmetered are the same thing
  static NotRoaming = 3;
}

const DEFAULT_SETTINGS = {
  time: 1440,
  updateRestriction: [updateRestictionType.NotRoaming],
  compactNotifications: false,

  showChapterDate: false,

  showFullDescription: false,
  preferHtml: false,

  allowSelectingText: false,
  downloadWhileReading: 0,
  downloadOnUpdate: false,

  finishedOnboarding: false,
};

export async function getJsonSettings() {
  try {
    const settingsString = await AsyncStorage.getItem('Settings');

    if (settingsString) {
      const parsedSettings = JSON.parse(settingsString);
      return { ...DEFAULT_SETTINGS, ...parsedSettings };
    }

    return DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error getting JSON settings:', error);
    return DEFAULT_SETTINGS;
  }
}

export async function saveJsonSettings(jsonSettings) {
  try {
    return await AsyncStorage.setItem('Settings', JSON.stringify(jsonSettings));
  } catch (error) {
    console.error('Error saving JSON settings:', error);
  }
}

export const UPDATE_INTERVALS = {
  TWELVE_HOURS: { label: 'screen_preferences_selector_check_frequency_12_hours', value: 720 },
  DAILY: { label: 'screen_preferences_selector_check_frequency_daily', value: 1440 },
  EVERY_2_DAYS: { label: 'screen_preferences_selector_check_frequency_every_2_days', value: 2880 },
  EVERY_3_DAYS: { label: 'screen_preferences_selector_check_frequency_every_3_days', value: 4320 },
  WEEKLY: { label: 'screen_preferences_selector_check_frequency_weekly', value: 10080 },
  NEVER: { label: 'screen_preferences_selector_check_frequency_never', value: -1 },
};

export const UPDATE_RESTRICTIONS = {
  NONE: { label: 'screen_preferences_selector_network_restriction_none', value: updateRestictionType.None },
  WIFI: { label: 'screen_preferences_selector_network_restriction_wifi', value: updateRestictionType.Wifi },
  NOT_ROAMING: { label: 'screen_preferences_selector_network_restriction_not_roaming', value: updateRestictionType.NotRoaming },
};

export const DOWNLOAD_WHILE_READING = {
  DISABLED: { label: 'screen_preferences_selector_download_while_reading_disabled', value: 0 },
  NEXT_CHAPTER: { label: 'screen_preferences_selector_download_while_reading_next', value: 1 },
  TWO_CHAPTERS: { label: 'screen_preferences_selector_download_while_reading_next_2', value: 2 },
  THREE_CHAPTERS: { label: 'screen_preferences_selector_download_while_reading_next_3', value: 3 },
  FIVE_CHAPTERS: { label: 'screen_preferences_selector_download_while_reading_next_5', value: 5 },
  TEN_CHAPTERS: { label: 'screen_preferences_selector_download_while_reading_next_10', value: 10 },
};