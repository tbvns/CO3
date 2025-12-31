import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getJsonSettings() {
  let settings = await AsyncStorage.getItem('Settings');
  if (settings === null || settings === undefined) {
    settings = {
      time: 1440,
      updateRestriction: [updateRestictionType.NotRoaming]
    }
  }
  return settings;
}

export async function saveJsonSettings(jsonSettings) {
  return await AsyncStorage.setItem('Settings', JSON.stringify(jsonSettings));
}

class updateRestictionType {
  static None = 0;
  static Wifi = 1;
  static Unmetered = 2;
  static NotRoaming = 3;
}