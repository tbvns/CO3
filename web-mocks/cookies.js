// @react-native-cookies/cookies mock for Electron/web

const CookieManager = {
  set: async (url, cookie) => {
    document.cookie = `${cookie.name}=${cookie.value}; path=/`;
    return true;
  },
  get: async (url) => {
    return document.cookie.split(';').reduce((acc, pair) => {
      const [name, value] = pair.trim().split('=');
      if (name) acc[name] = { name, value: value ?? '' };
      return acc;
    }, {});
  },
  getAll: async () => ({}),
  clearAll: async () => {
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
    });
    return true;
  },
  clearByName: async () => true,
  flush: async () => {},
  setFromResponse: async () => true,
  getFromResponse: async () => ({}),
};

export default CookieManager;
