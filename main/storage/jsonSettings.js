import AsyncStorage from '@react-native-async-storage/async-storage';

class updateRestictionType {
  static None = 0;
  static Wifi = 1;
  static Unmetered = 2;
  static NotRoaming = 3;
}

const DEFAULT_SETTINGS = {
  time: 1440,
  updateRestriction: [updateRestictionType.NotRoaming],
  compactNotifications: false,

  showChapterDate: false,
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
  TWELVE_HOURS: { label: '12 Hours', value: 720 },
  DAILY: { label: 'Daily', value: 1440 },
  EVERY_2_DAYS: { label: 'Every 2 Days', value: 2880 },
  EVERY_3_DAYS: { label: 'Every 3 Days', value: 4320 },
  WEEKLY: { label: 'Weekly', value: 10080 },
};

export const UPDATE_RESTRICTIONS = {
  NONE: { label: 'No Restriction', value: updateRestictionType.None },
  WIFI: { label: 'WiFi Only', value: updateRestictionType.Wifi },
  UNMETERED: { label: 'Unmetered Only', value: updateRestictionType.Unmetered },
  NOT_ROAMING: { label: 'Not Roaming', value: updateRestictionType.NotRoaming },
};