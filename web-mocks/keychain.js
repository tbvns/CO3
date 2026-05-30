// react-native-keychain mock for Electron/web
// Uses localStorage as a simple credential store (Electron only — not secure for production)

const PREFIX = '__keychain__';

export const setGenericPassword = async (username, password, options) => {
  const key = PREFIX + (options?.service || 'default');
  localStorage.setItem(key, JSON.stringify({ username, password }));
  return true;
};

export const getGenericPassword = async (options) => {
  const key = PREFIX + (options?.service || 'default');
  const raw = localStorage.getItem(key);
  if (!raw) return false;
  return JSON.parse(raw);
};

export const resetGenericPassword = async (options) => {
  const key = PREFIX + (options?.service || 'default');
  localStorage.removeItem(key);
  return true;
};

export const setInternetCredentials = async (server, username, password) => {
  localStorage.setItem(PREFIX + server, JSON.stringify({ username, password }));
  return true;
};

export const getInternetCredentials = async (server) => {
  const raw = localStorage.getItem(PREFIX + server);
  if (!raw) return false;
  return JSON.parse(raw);
};

export const resetInternetCredentials = async (server) => {
  localStorage.removeItem(PREFIX + server);
  return true;
};

export const getSupportedBiometryType = async () => null;
export const canImplyAuthentication = async () => false;
export const ACCESS_CONTROL = {};
export const ACCESSIBLE = {};
export const AUTHENTICATION_TYPE = {};
export const BIOMETRY_TYPE = {};
export const SECURITY_LEVEL = {};
export const STORAGE_TYPE = {};

export default {
  setGenericPassword,
  getGenericPassword,
  resetGenericPassword,
  setInternetCredentials,
  getInternetCredentials,
  resetInternetCredentials,
  getSupportedBiometryType,
  canImplyAuthentication,
  ACCESS_CONTROL,
  ACCESSIBLE,
  AUTHENTICATION_TYPE,
  BIOMETRY_TYPE,
  SECURITY_LEVEL,
  STORAGE_TYPE,
};
